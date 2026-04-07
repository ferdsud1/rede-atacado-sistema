import { pool } from "../config/database";
import { CreateCategoriaDTO, UpdateCategoriaDTO, CategoriaResponseDTO } from "../entity/CategoriaDTO";

export class CategoriaRepository {

    async listarTodas(): Promise<CategoriaResponseDTO[]> {
        const result = await pool.query(
            `SELECT * FROM categorias ORDER BY ordem ASC, nome ASC`
        );
        return result.rows;
    }

    async buscarPorId(id: number): Promise<CategoriaResponseDTO | null> {
        const result = await pool.query(
            "SELECT * FROM categorias WHERE id = $1",
            [id]
        );
        return result.rows[0] || null;
    }

    async buscarPorNome(nome: string): Promise<CategoriaResponseDTO | null> {
        const result = await pool.query(
            "SELECT * FROM categorias WHERE nome ILIKE $1",
            [nome]
        );
        return result.rows[0] || null;
    }

    async criar(categoria: CreateCategoriaDTO): Promise<CategoriaResponseDTO> {
        const result = await pool.query(
            `INSERT INTO categorias 
            (nome, descricao, cor, icone, ativo, ordem)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                categoria.nome,
                categoria.descricao || null,
                categoria.cor || '#ff6600',
                categoria.icone || '🏷️',
                categoria.ativo ?? true,
                categoria.ordem ?? 0
            ]
        );
        return result.rows[0];
    }

    async atualizar(id: number, categoria: UpdateCategoriaDTO): Promise<CategoriaResponseDTO | null> {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (categoria.nome !== undefined) {
            fields.push(`nome = $${paramCount++}`);
            values.push(categoria.nome);
        }
        if (categoria.descricao !== undefined) {
            fields.push(`descricao = $${paramCount++}`);
            values.push(categoria.descricao);
        }
        if (categoria.cor !== undefined) {
            fields.push(`cor = $${paramCount++}`);
            values.push(categoria.cor);
        }
        if (categoria.icone !== undefined) {
            fields.push(`icone = $${paramCount++}`);
            values.push(categoria.icone);
        }
        if (categoria.ativo !== undefined) {
            fields.push(`ativo = $${paramCount++}`);
            values.push(categoria.ativo);
        }
        if (categoria.ordem !== undefined) {
            fields.push(`ordem = $${paramCount++}`);
            values.push(categoria.ordem);
        }

        if (fields.length === 0) {
            return await this.buscarPorId(id);
        }

        values.push(id);
        const query = `
            UPDATE categorias 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount} 
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    async excluir(id: number): Promise<boolean> {
        const result = await pool.query(
            "DELETE FROM categorias WHERE id = $1",
            [id]
        );
        return result.rowCount !== null && result.rowCount > 0;
    }
}