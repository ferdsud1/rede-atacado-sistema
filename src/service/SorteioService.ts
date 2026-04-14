import { SorteioRepository } from "../repository/SorteioRepository";
import { CreateSorteioDTO, UpdateSorteioDTO, SorteioResponseDTO } from "../entity/SorteioDTO";
import { AppError } from "../utils/AppError";
import { StatusCodes } from "http-status-codes";

export class SorteioService {
    private readonly repo = new SorteioRepository();

    async listarAtivos(): Promise<SorteioResponseDTO[]> {
        try {
            return await this.repo.listarAtivos();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao listar sorteios ativos",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async listarTodos(): Promise<SorteioResponseDTO[]> {
        try {
            return await this.repo.listarTodos();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao listar sorteios",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async buscarPorId(id: number): Promise<SorteioResponseDTO | null> {
        try {
            return await this.repo.buscarPorId(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao buscar sorteio",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async criar(sorteio: CreateSorteioDTO): Promise<SorteioResponseDTO> {
        try {
            if (!sorteio.titulo || sorteio.titulo.trim().length < 3) {
                throw new AppError(
                    "Título do sorteio deve ter no mínimo 3 caracteres",
                    StatusCodes.BAD_REQUEST
                );
            }

            if (sorteio.data_fim <= sorteio.data_inicio) {
                throw new AppError(
                    "Data de término deve ser posterior à data de início",
                    StatusCodes.BAD_REQUEST
                );
            }

            return await this.repo.criar(sorteio);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao criar sorteio",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async atualizar(id: number, sorteio: UpdateSorteioDTO): Promise<SorteioResponseDTO> {
        try {
            const existente = await this.repo.buscarPorId(id);
            if (!existente) {
                throw new AppError("Sorteio não encontrado", StatusCodes.NOT_FOUND);
            }

            if (sorteio.titulo && sorteio.titulo.trim().length < 3) {
                throw new AppError(
                    "Título do sorteio deve ter no mínimo 3 caracteres",
                    StatusCodes.BAD_REQUEST
                );
            }

            if (sorteio.data_fim && sorteio.data_inicio) {
                const dataFim = typeof sorteio.data_fim === "string" ? new Date(sorteio.data_fim) : sorteio.data_fim;
                const dataInicio = typeof sorteio.data_inicio === "string" ? new Date(sorteio.data_inicio) : sorteio.data_inicio;

                if (dataFim <= dataInicio) {
                    throw new AppError(
                        "Data de término deve ser posterior à data de início",
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            const atualizado = await this.repo.atualizar(id, sorteio);
            if (!atualizado) {
                throw new AppError("Falha ao atualizar sorteio", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return atualizado;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao atualizar sorteio",
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
                throw new AppError("Sorteio não encontrado", StatusCodes.NOT_FOUND);
            }

            const excluiu = await this.repo.excluir(id);
            if (!excluiu) {
                throw new AppError("Falha ao excluir sorteio", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return { mensagem: "Sorteio excluído com sucesso!" };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao excluir sorteio",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async alterarStatus(id: number, ativo: boolean): Promise<SorteioResponseDTO> {
        const sorteio = await this.buscarPorId(id);
        if (!sorteio) {
            throw new AppError("Sorteio não encontrado", StatusCodes.NOT_FOUND);
        }

        return await this.atualizar(id, { ativo });
    }

    async ativar(id: number): Promise<SorteioResponseDTO> {
        return await this.alterarStatus(id, true);
    }

    async desativar(id: number): Promise<SorteioResponseDTO> {
        return await this.alterarStatus(id, false);
    }

    async adicionarParticipante(sorteioId: number, nome: string, telefone: string | null): Promise<any> {
        try {
            const sorteio = await this.repo.buscarPorId(sorteioId);
            if (!sorteio) {
                throw new AppError("Sorteio não encontrado", StatusCodes.NOT_FOUND);
            }
            if (!sorteio.ativo) {
                throw new AppError("Este sorteio não está ativo", StatusCodes.BAD_REQUEST);
            }

            const jaParticipou = await this.repo.verificarParticipacao(sorteioId, nome, telefone);
            if (jaParticipou) {
                throw new AppError("Você já está participando deste sorteio", StatusCodes.CONFLICT);
            }

            return await this.repo.adicionarParticipante(sorteioId, nome, telefone);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao adicionar participante",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async listarParticipantes(sorteioId: number): Promise<any[]> {
        try {
            return await this.repo.listarParticipantes(sorteioId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao listar participantes",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async sortearGanhador(sorteioId: number): Promise<any> {
        try {
            const sorteio = await this.repo.buscarPorId(sorteioId);
            if (!sorteio) {
                throw new AppError("Sorteio não encontrado", StatusCodes.NOT_FOUND);
            }

            const total = await this.repo.contarParticipantes(sorteioId);
            if (total === 0) {
                throw new AppError("Não há participantes neste sorteio", StatusCodes.BAD_REQUEST);
            }

            const ganhador = await this.repo.buscarParticipanteAleatorio(sorteioId);
            if (!ganhador) {
                throw new AppError("Erro ao sortear ganhador", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return ganhador;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao sortear ganhador",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }
}
