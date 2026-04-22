import { EmpresaRepository } from "../repository/EmpresaRepository";
import { Empresa, EmpresaResponseDTO } from "../entity/EmpresaDTO";
import { AppError } from "../utils/AppError";
import { StatusCodes } from "http-status-codes";

export class EmpresaService {
    private readonly repo = new EmpresaRepository();

    async buscarDados(): Promise<EmpresaResponseDTO | null> {
        try {
            return await this.repo.buscarDados();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao buscar dados da empresa",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async atualizar(id: number, dados: Partial<Empresa>): Promise<EmpresaResponseDTO> {
        try {
            const existente = await this.repo.buscarDados();
            if (!existente) {
                throw new AppError("Empresa não encontrada", StatusCodes.NOT_FOUND);
            }

            if (dados.nome && dados.nome.trim().length < 3) {
                throw new AppError(
                    "Nome da empresa deve ter no mínimo 3 caracteres",
                    StatusCodes.BAD_REQUEST
                );
            }

            const atualizado = await this.repo.atualizar(id, dados);
            if (!atualizado) {
                throw new AppError("Falha ao atualizar dados da empresa", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return atualizado;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao atualizar empresa",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }
}
