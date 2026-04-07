import { EncarteRepository } from "../repository/EncarteRepository";
import { CreateEncarteDTO, UpdateEncarteDTO, EncarteResponseDTO, EncarteAtivoDTO } from "../entity/EncarteDTO";
import { processImage } from "../utils/imageProcessor";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const repo = new EncarteRepository();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class EncarteService {

    // ==========================================
    // UPLOAD DE IMAGENS
    // ==========================================

    async salvarImagem(file: Express.Multer.File): Promise<string> {
        const { buffer: optimizedBuffer, ext } = await processImage(file.buffer);
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, optimizedBuffer);
        return `/uploads/${filename}`;
    }

    async salvarImagens(files: Express.Multer.File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const file of files) {
            const { buffer: optimizedBuffer, ext } = await processImage(file.buffer);
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filepath, optimizedBuffer);
            urls.push(`/uploads/${filename}`);
        }
        return urls;
    }

    async deletarImagem(imagemUrl: string): Promise<void> {
        try {
            const filename = imagemUrl.split("/").pop();
            if (!filename) return;
            const filepath = path.join(UPLOAD_DIR, filename);
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        } catch (error) {
            console.error("Erro ao deletar imagem:", error);
        }
    }

    async deletarImagens(urls: string[]): Promise<void> {
        for (const url of urls) await this.deletarImagem(url);
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

        // ✅ CORREÇÃO: Usar undefined em vez de null
        return await repo.criar({
            titulo: data.titulo,
            imagem_url: principal,  // ✅ undefined se vazio
            imagens: data.imagens || undefined,  // ✅ undefined se vazio
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

        // Deletar imagens antigas se necessário
        if (data.imagens && Array.isArray(data.imagens)) {
            const e = existente as any;
            if (e.imagens && Array.isArray(e.imagens)) {
                await this.deletarImagens(e.imagens);
            } else if (e.imagem_url) {
                await this.deletarImagem(e.imagem_url);
            }
        }

        const atualizado = await repo.atualizar(id, data);
        if (!atualizado) throw new Error("Falha ao atualizar encarte");  // ✅ Verifica null
        
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

        // Deletar imagens associadas
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