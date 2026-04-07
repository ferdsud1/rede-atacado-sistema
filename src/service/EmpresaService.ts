import { EmpresaRepository } from "../repository/EmpresaRepository";
import { Empresa, EmpresaResponseDTO } from "../entity/EmpresaDTO";

const repo = new EmpresaRepository();

export class EmpresaService {

    // ==========================================
    // LEITURA
    // ==========================================

    // Buscar dados da empresa (Site público)
    async buscarDados(): Promise<EmpresaResponseDTO | null> {
        return await repo.buscarDados();
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    // Atualizar dados da empresa (Admin)
    async atualizar(id: number, dados: Partial<Empresa>): Promise<EmpresaResponseDTO> {
        // Verificar se empresa existe
        const existente = await repo.buscarDados();
        if (!existente) {
            throw new Error("Empresa não encontrada");
        }

        // Validar dados básicos
        if (dados.nome && dados.nome.trim().length < 3) {
            throw new Error("Nome da empresa deve ter no mínimo 3 caracteres");
        }

        const atualizado = await repo.atualizar(id, dados);
        if (!atualizado) {
            throw new Error("Falha ao atualizar dados da empresa");
        }

        return atualizado;
    }
}