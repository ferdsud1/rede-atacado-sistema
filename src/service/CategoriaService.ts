import { CategoriaRepository } from "../repository/CategoriaRepository";
import { CreateCategoriaDTO, UpdateCategoriaDTO, CategoriaResponseDTO } from "../entity/CategoriaDTO";
import { AppError } from "../utils/AppError";
import { StatusCodes } from "http-status-codes";

export class CategoriaService {
    private readonly repo = new CategoriaRepository();

    async listarTodas(): Promise<CategoriaResponseDTO[]> {
        try {
            return await this.repo.listarTodas();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao listar categorias",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async buscarPorId(id: number): Promise<CategoriaResponseDTO | null> {
        try {
            return await this.repo.buscarPorId(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao buscar categoria",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async buscarPorNome(nome: string): Promise<CategoriaResponseDTO | null> {
        try {
            return await this.repo.buscarPorNome(nome);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao buscar categoria",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async criar(categoria: CreateCategoriaDTO): Promise<CategoriaResponseDTO> {
        try {
            const existente = await this.repo.buscarPorNome(categoria.nome);
            if (existente) {
                throw new AppError("Já existe uma categoria com este nome", StatusCodes.CONFLICT);
            }

            return await this.repo.criar(categoria);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao criar categoria",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async atualizar(id: number, categoria: UpdateCategoriaDTO): Promise<CategoriaResponseDTO> {
        try {
            const existente = await this.repo.buscarPorId(id);
            if (!existente) {
                throw new AppError("Categoria não encontrada", StatusCodes.NOT_FOUND);
            }

            if (categoria.nome && categoria.nome !== existente.nome) {
                const duplicado = await this.repo.buscarPorNome(categoria.nome);
                if (duplicado && duplicado.id !== id) {
                    throw new AppError("Já existe uma categoria com este nome", StatusCodes.CONFLICT);
                }
            }

            const atualizada = await this.repo.atualizar(id, categoria);
            if (!atualizada) {
                throw new AppError("Falha ao atualizar categoria", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return atualizada;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao atualizar categoria",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async excluir(id: number): Promise<{ mensagem: string }> {
        try {
            const existente = await this.repo.buscarPorId(id);
            if (!existente) {
                throw new AppError("Categoria não encontrada", StatusCodes.NOT_FOUND);
            }

            const excluiu = await this.repo.excluir(id);
            if (!excluiu) {
                throw new AppError("Falha ao excluir categoria", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return { mensagem: "Categoria excluída com sucesso" };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao excluir categoria",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }
}
