import { pool } from "../config/database";
import { Empresa, EmpresaResponseDTO } from "../entity/EmpresaDTO";

export class EmpresaRepository {

    // Buscar dados da empresa (primeiro registro)
    async buscarDados(): Promise<EmpresaResponseDTO | null> {
        try {
            const result = await pool.query(
                "SELECT * FROM empresa LIMIT 1"
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar dados da empresa:', error);
            throw error;
        }
    }

    // Atualizar dados da empresa
    async atualizar(id: number, dados: Partial<Empresa>): Promise<EmpresaResponseDTO | null> {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (dados.nome !== undefined) {
                fields.push(`nome = $${paramCount++}`);
                values.push(dados.nome);
            }
            if (dados.endereco !== undefined) {
                fields.push(`endereco = $${paramCount++}`);
                values.push(dados.endereco);
            }
            if (dados.telefone !== undefined) {
                fields.push(`telefone = $${paramCount++}`);
                values.push(dados.telefone);
            }
            if (dados.instagram !== undefined) {
                fields.push(`instagram = $${paramCount++}`);
                values.push(dados.instagram);
            }
            if (dados.facebook !== undefined) {
                fields.push(`facebook = $${paramCount++}`);
                values.push(dados.facebook);
            }
            if (dados.whatsapp !== undefined) {
                fields.push(`whatsapp = $${paramCount++}`);
                values.push(dados.whatsapp);
            }

            if (fields.length === 0) {
                return await this.buscarDados();
            }

            values.push(id);
            const query = `
                UPDATE empresa 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount} 
                RETURNING *
            `;

            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao atualizar dados da empresa:', error);
            throw error;
        }
    }
}