import { pool } from "../config/database";
import { CreateSorteioDTO, UpdateSorteioDTO, SorteioResponseDTO, Sorteio } from "../entity/SorteioDTO";

export class SorteioRepository {

    // Listar sorteios ativos
    async listarAtivos(): Promise<SorteioResponseDTO[]> {
        try {
            const result = await pool.query(
                `SELECT id, titulo, descricao, imagem_url, data_inicio, data_fim, ativo 
                FROM sorteios 
                WHERE ativo = true 
                AND data_fim >= CURRENT_DATE
                ORDER BY data_inicio DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Erro ao listar sorteios ativos:', error);
            throw error;
        }
    }

    // Listar todos os sorteios (Admin) ✅ CORRIGIDO: sem comentário na query
    async listarTodos(): Promise<Sorteio[]> {
        const result = await pool.query(
            `SELECT id, titulo, descricao, imagem_url, data_inicio, data_fim, ativo 
            FROM sorteios 
            ORDER BY data_inicio DESC`
        );
        return result.rows;
    }

    // Buscar sorteio por ID
    async buscarPorId(id: number): Promise<SorteioResponseDTO | null> {
        try {
            const result = await pool.query(
                "SELECT * FROM sorteios WHERE id = $1",
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar sorteio por ID:', error);
            throw error;
        }
    }

    // Criar sorteio
    async criar(sorteio: CreateSorteioDTO): Promise<SorteioResponseDTO> {
        try {
            const result = await pool.query(
                `INSERT INTO sorteios 
                (titulo, descricao, imagem_url, data_inicio, data_fim, ativo)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    sorteio.titulo,
                    sorteio.descricao || null,
                    sorteio.imagem_url,
                    sorteio.data_inicio,
                    sorteio.data_fim,
                    sorteio.ativo ?? true
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao criar sorteio:', error);
            throw error;
        }
    }

    // Atualizar sorteio
    async atualizar(id: number, sorteio: UpdateSorteioDTO): Promise<SorteioResponseDTO | null> {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (sorteio.titulo !== undefined) {
                fields.push(`titulo = $${paramCount++}`);
                values.push(sorteio.titulo);
            }
            if (sorteio.descricao !== undefined) {
                fields.push(`descricao = $${paramCount++}`);
                values.push(sorteio.descricao);
            }
            if (sorteio.imagem_url !== undefined) {
                fields.push(`imagem_url = $${paramCount++}`);
                values.push(sorteio.imagem_url);
            }
            if (sorteio.data_inicio !== undefined) {
                fields.push(`data_inicio = $${paramCount++}`);
                values.push(sorteio.data_inicio);
            }
            if (sorteio.data_fim !== undefined) {
                fields.push(`data_fim = $${paramCount++}`);
                values.push(sorteio.data_fim);
            }
            if (sorteio.ativo !== undefined) {
                fields.push(`ativo = $${paramCount++}`);
                values.push(sorteio.ativo);
            }

            if (fields.length === 0) {
                return await this.buscarPorId(id);
            }

            values.push(id);
            const query = `
                UPDATE sorteios 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount} 
                RETURNING *
            `;

            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao atualizar sorteio:', error);
            throw error;
        }
    }

    // Excluir sorteio
    async excluir(id: number): Promise<boolean> {
        try {
            // Excluir participantes primeiro
            await pool.query("DELETE FROM participantes_sorteio WHERE sorteio_id = $1", [id]);
            const result = await pool.query(
                "DELETE FROM sorteios WHERE id = $1",
                [id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erro ao excluir sorteio:', error);
            throw error;
        }
    }

    // ==========================================
    // PARTICIPANTES
    // ==========================================

    async criarTabelaParticipantes(): Promise<void> {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS participantes_sorteio (
                id SERIAL PRIMARY KEY,
                sorteio_id INTEGER NOT NULL REFERENCES sorteios(id) ON DELETE CASCADE,
                nome VARCHAR(255) NOT NULL,
                telefone VARCHAR(50),
                criado_em TIMESTAMP DEFAULT NOW()
            )
        `);
    }

    async adicionarParticipante(sorteioId: number, nome: string, telefone: string | null): Promise<any> {
        // Garantir que a tabela existe
        await this.criarTabelaParticipantes();

        const result = await pool.query(
            `INSERT INTO participantes_sorteio (sorteio_id, nome, telefone)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sorteioId, nome, telefone]
        );
        return result.rows[0];
    }

    async listarParticipantes(sorteioId: number): Promise<any[]> {
        // Garantir que a tabela existe
        await this.criarTabelaParticipantes();

        const result = await pool.query(
            `SELECT * FROM participantes_sorteio
             WHERE sorteio_id = $1
             ORDER BY criado_em ASC`,
            [sorteioId]
        );
        return result.rows;
    }

    async contarParticipantes(sorteioId: number): Promise<number> {
        await this.criarTabelaParticipantes();

        const result = await pool.query(
            `SELECT COUNT(*) as total FROM participantes_sorteio WHERE sorteio_id = $1`,
            [sorteioId]
        );
        return parseInt(result.rows[0].total);
    }

    async buscarParticipanteAleatorio(sorteioId: number): Promise<any | null> {
        const result = await pool.query(
            `SELECT * FROM participantes_sorteio
             WHERE sorteio_id = $1
             ORDER BY RANDOM()
             LIMIT 1`,
            [sorteioId]
        );
        return result.rows[0] || null;
    }

    async verificarParticipacao(sorteioId: number, nome: string, telefone: string | null): Promise<boolean> {
        await this.criarTabelaParticipantes();

        const result = await pool.query(
            `SELECT id FROM participantes_sorteio
             WHERE sorteio_id = $1 AND LOWER(nome) = LOWER($2)
             ${telefone ? 'AND telefone = $3' : ''}
             LIMIT 1`,
            telefone ? [sorteioId, nome, telefone] : [sorteioId, nome]
        );
        return result.rows.length > 0;
    }
}
