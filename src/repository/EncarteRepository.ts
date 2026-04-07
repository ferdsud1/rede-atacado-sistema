import { pool } from "../config/database";
import { Encarte } from "../entity/Encarte";
import { CreateEncarteDTO, UpdateEncarteDTO, EncarteResponseDTO, EncarteAtivoDTO } from "../entity/EncarteDTO";

export class EncarteRepository {

    // ==========================================
    // LEITURA - PÚBLICA (Site)
    // ==========================================

    // ✅ CORREÇÃO: JOIN com categorias para retornar nome, cor e ícone
    async listarAtivos(): Promise<EncarteAtivoDTO[]> {
        try {
            const result = await pool.query(
                `SELECT 
                    e.id, 
                    e.titulo, 
                    e.imagem_url, 
                    e.imagens, 
                    e.data_inicio, 
                    e.data_fim,
                    e.ativo,
                    e.categoria_id,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    c.icone as categoria_icone
                 FROM encartes e 
                 LEFT JOIN categorias c ON e.categoria_id = c.id
                 WHERE e.ativo = true 
                 AND e.data_inicio <= NOW() 
                 AND e.data_fim >= NOW()
                 ORDER BY e.data_inicio DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Erro ao listar encartes ativos:', error);
            throw error;
        }
    }

    async buscarPorId(id: number): Promise<Encarte | null> {
        try {
            const result = await pool.query(
                `SELECT 
                    e.*,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    c.icone as categoria_icone
                 FROM encartes e 
                 LEFT JOIN categorias c ON e.categoria_id = c.id
                 WHERE e.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar encarte por ID:', error);
            throw error;
        }
    }

    // Listar TODOS os encartes (para o admin) - também com JOIN
    async listarTodos(): Promise<EncarteResponseDTO[]> {
        const result = await pool.query(
            `SELECT 
                e.*, 
                c.nome as categoria_nome,
                c.cor as categoria_cor,
                c.icone as categoria_icone
             FROM encartes e 
             LEFT JOIN categorias c ON e.categoria_id = c.id 
             ORDER BY e.data_inicio DESC`
        );
        return result.rows;
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(encarte: CreateEncarteDTO): Promise<EncarteResponseDTO> {
        const result = await pool.query(
            `INSERT INTO encartes 
            (titulo, imagem_url, imagens, data_inicio, data_fim, ativo, categoria_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                encarte.titulo,
                encarte.imagem_url || null,
                encarte.imagens || null,
                encarte.data_inicio,
                encarte.data_fim,
                encarte.ativo ?? true,
                encarte.categoria_id || null
            ]
        );
        return result.rows[0];
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    async atualizar(id: number, encarte: UpdateEncarteDTO): Promise<EncarteResponseDTO | null> {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (encarte.titulo !== undefined) {
            fields.push(`titulo = $${paramCount++}`);
            values.push(encarte.titulo);
        }
        if (encarte.imagem_url !== undefined) {
            fields.push(`imagem_url = $${paramCount++}`);
            values.push(encarte.imagem_url);
        }
        if (encarte.imagens !== undefined) {
            fields.push(`imagens = $${paramCount++}`);
            values.push(encarte.imagens);
        }
        if (encarte.data_inicio !== undefined) {
            fields.push(`data_inicio = $${paramCount++}`);
            values.push(encarte.data_inicio);
        }
        if (encarte.data_fim !== undefined) {
            fields.push(`data_fim = $${paramCount++}`);
            values.push(encarte.data_fim);
        }
        if (encarte.ativo !== undefined) {
            fields.push(`ativo = $${paramCount++}`);
            values.push(encarte.ativo);
        }
        if (encarte.categoria_id !== undefined) {
            fields.push(`categoria_id = $${paramCount++}`);
            values.push(encarte.categoria_id);
        }

        if (fields.length === 0) {
            return await this.buscarPorId(id);
        }

        values.push(id);
        const query = `
            UPDATE encartes 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount} 
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                "DELETE FROM encartes WHERE id = $1",
                [id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erro ao excluir encarte:', error);
            throw error;
        }
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    async desativarExpirados(): Promise<number> {
        try {
            const result = await pool.query(
                `UPDATE encartes 
                 SET ativo = false 
                 WHERE data_fim < NOW() AND ativo = true`
            );
            return result.rowCount || 0;
        } catch (error) {
            console.error('Erro ao desativar encartes expirados:', error);
            throw error;
        }
    }

    async buscarPorCategoria(categoriaId: number): Promise<any[]> {
        const result = await pool.query(
            `SELECT 
                e.*, 
                c.nome as categoria_nome,
                c.cor as categoria_cor,
                c.icone as categoria_icone
             FROM encartes e 
             LEFT JOIN categorias c ON e.categoria_id = c.id 
             WHERE e.categoria_id = $1 
             ORDER BY e.data_inicio DESC`,
            [categoriaId]
        );
        return result.rows;
    }

    async listarFuturos(): Promise<EncarteResponseDTO[]> {
        try {
            const result = await pool.query(
                `SELECT 
                    e.id, 
                    e.titulo, 
                    e.imagem_url, 
                    e.imagens, 
                    e.data_inicio, 
                    e.data_fim, 
                    e.ativo, 
                    e.categoria_id,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    c.icone as categoria_icone
                 FROM encartes e 
                 LEFT JOIN categorias c ON e.categoria_id = c.id
                 WHERE e.data_inicio > NOW() AND e.ativo = true
                 ORDER BY e.data_inicio ASC`
            );
            return result.rows;
        } catch (error) {
            console.error('Erro ao listar encartes futuros:', error);
            throw error;
        }
    }
}