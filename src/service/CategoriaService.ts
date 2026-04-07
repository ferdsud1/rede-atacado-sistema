import { CategoriaRepository } from "../repository/CategoriaRepository";
import { CreateCategoriaDTO, UpdateCategoriaDTO, CategoriaResponseDTO } from "../entity/CategoriaDTO";

const repo = new CategoriaRepository();

export class CategoriaService {

    async listarTodas(): Promise<CategoriaResponseDTO[]> {
        return await repo.listarTodas();
    }

    async buscarPorId(id: number): Promise<CategoriaResponseDTO | null> {
        return await repo.buscarPorId(id);
    }

    async buscarPorNome(nome: string): Promise<CategoriaResponseDTO | null> {
        return await repo.buscarPorNome(nome);
    }

    async criar(categoria: CreateCategoriaDTO): Promise<CategoriaResponseDTO> {
        // Verifica se já existe categoria com mesmo nome
        const existente = await repo.buscarPorNome(categoria.nome);
        if (existente) {
            throw new Error('Já existe uma categoria com este nome');
        }

        return await repo.criar(categoria);
    }

    // ✅ CORRIGIDO: Retorna CategoriaResponseDTO | null e lança erro se não encontrar
    async atualizar(id: number, categoria: UpdateCategoriaDTO): Promise<CategoriaResponseDTO> {
        const existente = await repo.buscarPorId(id);
        if (!existente) {
            throw new Error('Categoria não encontrada');
        }

        // Se estiver mudando o nome, verifica se não duplica
        if (categoria.nome && categoria.nome !== existente.nome) {
            const duplicado = await repo.buscarPorNome(categoria.nome);
            if (duplicado && duplicado.id !== id) {
                throw new Error('Já existe uma categoria com este nome');
            }
        }

        const atualizada = await repo.atualizar(id, categoria);
        
        // ✅ GARANTE que não retorna null
        if (!atualizada) {
            throw new Error('Falha ao atualizar categoria');
        }
        
        return atualizada;
    }

    async excluir(id: number): Promise<{ mensagem: string }> {
        const existente = await repo.buscarPorId(id);
        if (!existente) {
            throw new Error('Categoria não encontrada');
        }

        const excluiu = await repo.excluir(id);
        if (!excluiu) {
            throw new Error('Falha ao excluir categoria');
        }
        
        return { mensagem: 'Categoria excluída com sucesso' };
    }
}