import { EncarteRepository } from "../repository/EncarteRepository";
import { CreateEncarteDTO, UpdateEncarteDTO, EncarteResponseDTO, EncarteAtivoDTO } from "../entity/EncarteDTO";
import { processImage } from "../utils/imageProcessor";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const repo = new EncarteRepository();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

// Garantir que o diretório de uploads exista
const ensureUploadDir = async () => {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
};

export class EncarteService {

    // ==========================================
    // UTILITÁRIOS DE IMAGEM
    // ==========================================

    private async saveImageFile(buffer: Buffer, ext: string): Promise<string> {
        await ensureUploadDir();
        
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        
        await fs.writeFile(filepath, buffer);
        return `/uploads/${filename}`;
    }

    private async deleteImageFile(imagemUrl: string): Promise<void> {
        try {
            const filename = imagemUrl.split("/").pop();
            if (!filename) return;
            
            const filepath = path.join(UPLOAD_DIR, filename);
            await fs.access(filepath);
            await fs.unlink(filepath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.error("Erro ao deletar imagem:", error);
            }
        }
    }

    // ==========================================
    // UPLOAD DE IMAGENS - PÚBLICOS
    // ==========================================

    async salvarImagem(file: Express.Multer.File): Promise<string> {
        const { buffer: optimizedBuffer, ext } = await processImage(file.buffer);
        return await this.saveImageFile(optimizedBuffer, ext);
    }

    async salvarImagens(files: Express.Multer.File[]): Promise<string[]> {
        const promises = files.map(async (file) => {
            const { buffer: optimizedBuffer, ext } = await processImage(file.buffer);
            return await this.saveImageFile(optimizedBuffer, ext);
        });
        return Promise.all(promises);
    }

    async salvarImagemBase64(base64String: string): Promise<string> {
        // Remove prefixo data:image/...;base64, se existir
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const { buffer: optimizedBuffer, ext } = await processImage(buffer);
        return await this.saveImageFile(optimizedBuffer, ext);
    }

    async deletarImagem(imagemUrl: string): Promise<void> {
        await this.deleteImageFile(imagemUrl);
    }

    async deletarImagens(urls: string[]): Promise<void> {
        await Promise.all(urls.map(url => this.deleteImageFile(url)));
    }

    // ==========================================
    // VALIDAÇÕES
    // ==========================================

    private validarDatas(dataInicio: Date | string, dataFim: Date | string): void {
        const dInicio = dataInicio instanceof Date ? dataInicio : new Date(dataInicio);
        const dFim = dataFim instanceof Date ? dataFim : new Date(dataFim);
        
        if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) {
            throw new Error("Datas inválidas");
        }
        if (dFim <= dInicio) {
            throw new Error("Data de término deve ser após a data de início");
        }
    }

    private determinarImagemPrincipal(
        imagemUrl?: string,
        imagens?: string[]
    ): string | undefined {
        if (imagemUrl) return imagemUrl;
        if (imagens?.length) return imagens[0];
        return undefined;
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(data: CreateEncarteDTO): Promise<EncarteResponseDTO> {
        this.validarDatas(data.data_inicio, data.data_fim);

        const imagemPrincipal = this.determinarImagemPrincipal(
            data.imagem_url,
            data.imagens
        );

        return await repo.criar({
            titulo: data.titulo,
            imagem_url: imagemPrincipal,
            imagens: data.imagens?.length ? data.imagens : undefined,
            data_inicio: data.data_inicio instanceof Date 
                ? data.data_inicio 
                : new Date(data.data_inicio),
            data_fim: data.data_fim instanceof Date 
                ? data.data_fim 
                : new Date(data.data_fim),
            ativo: data.ativo ?? true,
            categoria_id: data.categoria_id ?? null
        });
    }

    async criarComImagens(
        data: Omit<CreateEncarteDTO, "imagem_url" | "imagens">,
        files: Express.Multer.File[]
    ): Promise<EncarteResponseDTO> {
        if (!files?.length) {
            throw new Error("Pelo menos uma imagem é obrigatória");
        }
        
        const imagens = await this.salvarImagens(files);
        return await this.criar({ ...data, imagens });
    }

    async criarComImagem(
        data: Omit<CreateEncarteDTO, "imagem_url">,
        file: Express.Multer.File
    ): Promise<EncarteResponseDTO> {
        const imagem_url = await this.salvarImagem(file);
        return await this.criar({ ...data, imagem_url });
    }

    async criarComBase64(
        data: Omit<CreateEncarteDTO, 'imagem_base64'>,
        base64String: string
    ): Promise<EncarteResponseDTO> {
        if (!base64String) {
            throw new Error("String base64 da imagem é obrigatória");
        }
        
        const imagem_url = await this.salvarImagemBase64(base64String);
        return await this.criar({ ...data, imagem_url });
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

    async atualizar(id: number, data: UpdateEncarteDTO): Promise<EncarteResponseDTO> {
        const existente = await repo.buscarPorId(id);
        if (!existente) {
            throw new Error("Encarte não encontrado");
        }

        // Validar datas se estiverem sendo atualizadas
        if (data.data_inicio && data.data_fim) {
            this.validarDatas(data.data_inicio, data.data_fim);
        }

        // Deletar imagens antigas se estiverem sendo substituídas
        if (data.imagens !== undefined || data.imagem_url !== undefined) {
            await this.limparImagensAntigas(existente);
        }

        const atualizado = await repo.atualizar(id, data);
        if (!atualizado) {
            throw new Error("Falha ao atualizar encarte");
        }
        
        return atualizado;
    }

    private async limparImagensAntigas(encarte: EncarteResponseDTO): Promise<void> {
        const e = encarte as any;
        
        if (e.imagens?.length) {
            await this.deletarImagens(e.imagens);
        } else if (e.imagem_url) {
            await this.deletarImagem(e.imagem_url);
        }
    }

    async atualizarComImagens(
        id: number,
        data: Partial<Omit<UpdateEncarteDTO, "imagem_url" | "imagens">>,
        files: Express.Multer.File[]
    ): Promise<EncarteResponseDTO> {
        if (!files?.length) {
            throw new Error("Pelo menos uma imagem é obrigatória");
        }
        
        await this.limparImagensAntigas(await this.buscarPorId(id) as EncarteResponseDTO);
        
        const imagens = await this.salvarImagens(files);
        return await this.atualizar(id, { ...data, imagens });
    }

    async atualizarComImagem(
        id: number,
        data: Partial<Omit<UpdateEncarteDTO, "imagem_url">>,
        file: Express.Multer.File
    ): Promise<EncarteResponseDTO> {
        await this.limparImagensAntigas(await this.buscarPorId(id) as EncarteResponseDTO);
        
        const imagem_url = await this.salvarImagem(file);
        return await this.atualizar(id, { ...data, imagem_url });
    }

    async atualizarComBase64(
        id: number,
        data: Partial<Omit<UpdateEncarteDTO, "imagem_base64">>,
        base64String: string
    ): Promise<EncarteResponseDTO> {
        await this.limparImagensAntigas(await this.buscarPorId(id) as EncarteResponseDTO);
        
        const imagem_url = await this.salvarImagemBase64(base64String);
        return await this.atualizar(id, { ...data, imagem_url });
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<{ mensagem: string }> {
        const encarte = await repo.buscarPorId(id);
        if (!encarte) {
            throw new Error("Encarte não encontrado");
        }

        await this.limparImagensAntigas(encarte);
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
