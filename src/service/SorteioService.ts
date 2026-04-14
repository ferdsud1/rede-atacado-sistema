import { SorteioRepository } from "../repository/SorteioRepository";
import { CreateSorteioDTO, UpdateSorteioDTO, SorteioResponseDTO } from "../entity/SorteioDTO";

const repo = new SorteioRepository();

export class SorteioService {

    // ==========================================
    // LEITURA
    // ==========================================

    // Listar sorteios ativos (Site público)
    async listarAtivos(): Promise<SorteioResponseDTO[]> {
        return await repo.listarAtivos();
    }

    // Listar todos os sorteios (Admin)
    async listarTodos(): Promise<SorteioResponseDTO[]> {
        return await repo.listarTodos();
    }

    // Buscar sorteio por ID (Admin)
    async buscarPorId(id: number): Promise<SorteioResponseDTO | null> {
        return await repo.buscarPorId(id);
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(sorteio: CreateSorteioDTO): Promise<SorteioResponseDTO> {
        // Validar nome
        if (!sorteio.titulo || sorteio.titulo.trim().length < 3) {
            throw new Error("Título do sorteio deve ter no mínimo 3 caracteres");
        }

        // Validar datas: data_fim deve ser após data_inicio
        if (sorteio.data_fim <= sorteio.data_inicio) {
            throw new Error("Data de término deve ser posterior à data de início");
        }

        return await repo.criar(sorteio);
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    async atualizar(id: number, sorteio: UpdateSorteioDTO): Promise<SorteioResponseDTO> {
        // Verificar se sorteio existe
        const existente = await repo.buscarPorId(id);
        if (!existente) {
            throw new Error("Sorteio não encontrado");
        }

        // Validar título (se estiver sendo atualizado)
        if (sorteio.titulo && sorteio.titulo.trim().length < 3) {
            throw new Error("Título do sorteio deve ter no mínimo 3 caracteres");
        }

        // Validar datas (se estiverem sendo atualizadas)
        if (sorteio.data_fim && sorteio.data_inicio) {
            const dataFim = typeof sorteio.data_fim === "string" ? new Date(sorteio.data_fim) : sorteio.data_fim;
            const dataInicio = typeof sorteio.data_inicio === "string" ? new Date(sorteio.data_inicio) : sorteio.data_inicio;
            
            if (dataFim <= dataInicio) {
                throw new Error("Data de término deve ser posterior à data de início");
            }
        }

        const atualizado = await repo.atualizar(id, sorteio);
        if (!atualizado) {
            throw new Error("Falha ao atualizar sorteio");
        }

        return atualizado;
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<{ mensagem: string }> {
        // Verificar se sorteio existe
        const existente = await repo.buscarPorId(id);
        if (!existente) {
            throw new Error("Sorteio não encontrado");
        }

        const excluiu = await repo.excluir(id);
        if (!excluiu) {
            throw new Error("Falha ao excluir sorteio");
        }

        return { mensagem: "Sorteio excluído com sucesso!" };
    }

    // ==========================================
    // STATUS
    // ==========================================

    async alterarStatus(id: number, ativo: boolean): Promise<SorteioResponseDTO> {
        const sorteio = await this.buscarPorId(id);
        if (!sorteio) {
            throw new Error("Sorteio não encontrado");
        }

        return await this.atualizar(id, { ativo });
    }

    async ativar(id: number): Promise<SorteioResponseDTO> {
        return await this.alterarStatus(id, true);
    }

    async desativar(id: number): Promise<SorteioResponseDTO> {
        return await this.alterarStatus(id, false);
    }

    // ==========================================
    // PARTICIPANTES
    // ==========================================

    async adicionarParticipante(sorteioId: number, nome: string, telefone: string | null): Promise<any> {
        // Verificar se sorteio existe e está ativo
        const sorteio = await repo.buscarPorId(sorteioId);
        if (!sorteio) {
            throw new Error("Sorteio não encontrado");
        }
        if (!sorteio.ativo) {
            throw new Error("Este sorteio não está ativo");
        }

        // Verificar se já participou
        const jaParticipou = await repo.verificarParticipacao(sorteioId, nome, telefone);
        if (jaParticipou) {
            throw new Error("Você já está participando deste sorteio");
        }

        return await repo.adicionarParticipante(sorteioId, nome, telefone);
    }

    async listarParticipantes(sorteioId: number): Promise<any[]> {
        return await repo.listarParticipantes(sorteioId);
    }

    async sortearGanhador(sorteioId: number): Promise<any> {
        const sorteio = await repo.buscarPorId(sorteioId);
        if (!sorteio) {
            throw new Error("Sorteio não encontrado");
        }

        const total = await repo.contarParticipantes(sorteioId);
        if (total === 0) {
            throw new Error("Não há participantes neste sorteio");
        }

        const ganhador = await repo.buscarParticipanteAleatorio(sorteioId);
        if (!ganhador) {
            throw new Error("Erro ao sortear ganhador");
        }

        return ganhador;
    }
}
