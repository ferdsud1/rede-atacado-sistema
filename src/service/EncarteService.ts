import { EncarteRepository } from "../repository/EncarteRepository";
import { CreateEncarteDTO, UpdateEncarteDTO, EncarteResponseDTO, EncarteAtivoDTO } from "../entity/EncarteDTO";
import { processImage } from "../utils/imageProcessor";
import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary";

const repo = new EncarteRepository();

export class EncarteService {

    // ==========================================
    // UPLOAD DE IMAGENS PARA CLOUDINARY
    // ==========================================

    async salvarImagem(file: Express.Multer.File): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                // Otimiza a imagem antes de enviar
                const { buffer: optimizedBuffer, ext } = await processImage(file.buffer);
                
                // Converte buffer para base64
                const b64 = optimizedBuffer.toString('base64');
                const mimetype = file.mimetype.startsWith('image/') ? file.mimetype : `image/${ext.replace('.', '')}`;
                const dataURI = `${mimetype};base64,${b64}`;
                
                // Upload para Cloudinary
                cloudinary.uploader.upload(dataURI, {
                    folder: 'certo-atacado/encartes',
                    resource_type: 'auto',
                    public_id: `${randomUUID()}`,
                    transformation: [
                        { width: 1920, height: 1920, crop: 'limit' }, // Limita tamanho máximo
                        { quality: 'auto' }, // Compressão inteligente
                        { fetch_format: 'auto' } // Converte para WebP se possível
                    ]
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result!.secure_url);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async salvarImagens(files: Express.Multer.File[]): Promise<string[]> {
        const uploadPromises = files.map(file => this.salvarImagem(file));
        return Promise.all(uploadPromises);
    }

    async deletarImagem(imagemUrl: string): Promise<void> {
        try {
            // Extrai o public_id da URL do Cloudinary
            // URL exemplo: https://res.cloudinary.com/xyz/image/upload/v1234567890/certo-atacado/encartes/abc123.jpg
            const urlParts = imagemUrl.split('/');
            const filenameWithExt = urlParts[urlParts.length - 1];
            const filename = filenameWithExt.split('.')[0];
            const publicId = `certo-atacado/encartes/${filename}`;
            
            // Deleta do Cloudinary
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Erro ao deletar imagem do Cloudinary:", error);
            // Não lança erro para não quebrar o fluxo principal
        }
    }

    async deletarImagens(urls: string[]): Promise<void> {
        const deletePromises = urls.map(url => this.deletarImagem(url));
        await Promise.all(deletePromises);
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(data: any): Promise<EncarteResponseDTO> {
        const dInicio = data.data_inicio instanceof Date ? data.data_inicio : new Date(data.data_inicio);
        const dFim = data.data_fim instanceof Date ? data.data_fim : new Date(data.data_fim);

        if (dFim <= dInicio) {
            throw new Error("Data de término deve ser após a data de início");
        }

        // Determinar imagem principal
        let principal: string | undefined = undefined;
        if (data.imagem_url) {
            principal = data.imagem_url;
        } else if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
            principal = data.imagens[0];
        }

        return await repo.criar({
            titulo: data.titulo,
            imagem_url: principal,
            imagens: data.imagens || undefined,
            data_inicio: dInicio,
            data_fim: dFim,
            ativo: data.ativo ?? true,
            categoria_id: data.categoria_id ?? null
        });
    }

    async criarComImagens(
        data: Omit<CreateEncarteDTO, "imagem_url" | "imagens">,
        files: Express.Multer.File[]
    ): Promise<EncarteResponseDTO> {
        const imagensUrls = await this.salvarImagens(files);
        return await this.criar({
            ...data,
            imagens: imagensUrls,
            categoria_id: data.categoria_id ?? null
        });
    }

    async criarComImagem(
        data: Omit<CreateEncarteDTO, "imagem_url">,
        file: Express.Multer.File
    ): Promise<EncarteResponseDTO> {
        const imagem_url = await this.salvarImagem(file);
        return await this.criar({ ...data, imagem_url, categoria_id: data.categoria_id ?? null });
    }

    // ==========================================
    // LEITURA
    // ==========================================

    async listarAtivos(): Promise<EncarteAtivoDTO[]> {
        await this.desativarExpirados();
        return await repo.listarAtivos();
    }

    async listarTodos(): Promise<EncarteResponseDTO[]> {
        return await repo.listarTodos();
    }

    async buscarPorId(id: number): Promise<EncarteResponseDTO | null> {
        return await repo.buscarPorId(id);
    }

    async listarFuturos(): Promise<EncarteResponseDTO[]> {
        return await repo.listarFuturos();
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    async atualizar(id: number, data: any): Promise<EncarteResponseDTO> {
        const existente = await repo.buscarPorId(id);
        if (!existente) throw new Error("Encarte não encontrado");

        // Validar datas
        if (data.data_inicio && data.data_fim) {
            const dInicio = data.data_inicio instanceof Date ? data.data_inicio : new Date(data.data_inicio);
            const dFim = data.data_fim instanceof Date ? data.data_fim : new Date(data.data_fim);
            if (dFim <= dInicio) throw new Error("Data de término deve ser após a data de início");
        }

        // Deletar imagens antigas do Cloudinary se estiver substituindo
        if (data.imagens && Array.isArray(data.imagens)) {
            const e = existente as any;
            if (e.imagens && Array.isArray(e.imagens)) {
                await this.deletarImagens(e.imagens);
            } else if (e.imagem_url) {
                await this.deletarImagem(e.imagem_url);
            }
        }

        const atualizado = await repo.atualizar(id, data);
        if (!atualizado) throw new Error("Falha ao atualizar encarte");
        
        return atualizado;
    }

    async atualizarComImagens(
        id: number,
        data: Partial<Omit<UpdateEncarteDTO, "imagem_url" | "imagens">>,
        files: Express.Multer.File[]
    ): Promise<EncarteResponseDTO> {
        const imagens = await this.salvarImagens(files);
        return await this.atualizar(id, { ...data, imagens });
    }

    async atualizarComImagem(
        id: number,
        data: Partial<Omit<UpdateEncarteDTO, "imagem_url">>,
        file: Express.Multer.File
    ): Promise<EncarteResponseDTO> {
        const imagem_url = await this.salvarImagem(file);
        return await this.atualizar(id, { ...data, imagem_url });
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<{ mensagem: string }> {
        const encarte = await repo.buscarPorId(id);
        if (!encarte) throw new Error("Encarte não encontrado");

        // Deletar imagens associadas do Cloudinary
        const e = encarte as any;
        if (e.imagens && Array.isArray(e.imagens)) {
            await this.deletarImagens(e.imagens);
        } else if (e.imagem_url) {
            await this.deletarImagem(e.imagem_url);
        }

        await repo.excluir(id);
        return { mensagem: "Encarte excluído com sucesso!" };
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    async alterarStatus(id: number, ativo: boolean): Promise<EncarteResponseDTO> {
        return await this.atualizar(id, { ativo });
    }

    async desativarExpirados(): Promise<number> {
        return await repo.desativarExpirados();
    }
}
