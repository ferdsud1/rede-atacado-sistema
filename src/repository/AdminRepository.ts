import { pool } from "../config/database";
import { Admin } from "../entity/Admin";
import { CreateAdminDTO, UpdateAdminDTO, AdminResponseDTO } from "../entity/AdminDTO";

export class AdminRepository {

    // ==========================================
    // LEITURA
    // ==========================================

    async buscarPorEmail(email: string): Promise<Admin | null> {
        try {
            const result = await pool.query(
                "SELECT * FROM admin WHERE email = $1",
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar admin por email:', error);
            throw error;
        }
    }

    async buscarPorId(id: number): Promise<Admin | null> {
        try {
            const result = await pool.query(
                "SELECT * FROM admin WHERE id = $1",
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar admin por ID:', error);
            throw error;
        }
    }

    async buscarTodos(): Promise<AdminResponseDTO[]> {
        try {
            const result = await pool.query(
                "SELECT id, nome, email, criado_em FROM admin ORDER BY nome"
            );
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar todos admins:', error);
            throw error;
        }
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(admin: CreateAdminDTO): Promise<AdminResponseDTO> {
        try {
            const result = await pool.query(
                "INSERT INTO admin (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em",
                [admin.nome, admin.email, admin.senha]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao criar admin:', error);
            throw error;
        }
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    async atualizar(id: number, admin: UpdateAdminDTO): Promise<AdminResponseDTO | null> {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (admin.nome !== undefined) {
                fields.push(`nome = $${paramCount++}`);
                values.push(admin.nome);
            }
            if (admin.email !== undefined) {
                fields.push(`email = $${paramCount++}`);
                values.push(admin.email);
            }
            if (admin.senha !== undefined) {
                fields.push(`senha = $${paramCount++}`);
                values.push(admin.senha);
            }

           if (fields.length === 0) {
    const admin = await this.buscarPorId(id);
    if (!admin) return null;
    
    // Converte Admin para AdminResponseDTO
    return {
        id: admin.id!, // ! diz ao TypeScript que não é undefined
        nome: admin.nome,
        email: admin.email,
        criado_em: admin.criado_em || new Date()
    };
}

            values.push(id);
            const query = `
                UPDATE admin 
                SET ${fields.join(', ')}, criado_em = CURRENT_TIMESTAMP 
                WHERE id = $${paramCount} 
                RETURNING id, nome, email, criado_em
            `;

            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao atualizar admin:', error);
            throw error;
        }
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                "DELETE FROM admin WHERE id = $1",
                [id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erro ao excluir admin:', error);
            throw error;
        }
    }

    // ==========================================
    // RECUPERAÇÃO DE SENHA
    // ==========================================

    async criarTokenRecuperacao(adminId: number, token: string, expiracao: Date): Promise<void> {
        try {
            await pool.query(
                `INSERT INTO recuperacao_senha (admin_id, token, expiracao, usado) 
                 VALUES ($1, $2, $3, false)`,
                [adminId, token, expiracao]
            );
        } catch (error) {
            console.error('Erro ao criar token de recuperação:', error);
            throw error;
        }
    }

    async buscarTokenValido(token: string): Promise<{ admin_id: number; expiracao: Date; usado: boolean } | null> {
        try {
            const result = await pool.query(
                `SELECT admin_id, expiracao, usado FROM recuperacao_senha 
                 WHERE token = $1 AND usado = false AND expiracao > NOW()`,
                [token]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar token de recuperação:', error);
            throw error;
        }
    }

    async marcarTokenComoUsado(token: string): Promise<void> {
        try {
            await pool.query(
                "UPDATE recuperacao_senha SET usado = true WHERE token = $1",
                [token]
            );
        } catch (error) {
            console.error('Erro ao marcar token como usado:', error);
            throw error;
        }
    }
}