import { AdminRepository } from "../repository/AdminRepository";
import { CreateAdminDTO, LoginDTO, AdminResponseDTO, AuthResponseDTO } from "../entity/AdminDTO";
import { createAdminSchema, loginSchema } from "../utils/validations";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import nodemailer from "nodemailer";
import { enviarEmailRecuperacao } from "../utils/email";

const repo = new AdminRepository();

// Configurar transporte de e-mail
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export class AdminService {

    // ==========================================
    // CADASTRO
    // ==========================================

    async cadastrar(data: CreateAdminDTO): Promise<AdminResponseDTO> {
        const validated = createAdminSchema.parse(data);

        const existe = await repo.buscarPorEmail(validated.email);
        if (existe) {
            throw new Error("E-mail já cadastrado");
        }

        const hash = await bcrypt.hash(validated.senha, 12);

        return await repo.criar({
            nome: validated.nome,
            email: validated.email,
            senha: hash,
        });
    }

    // ==========================================
    // LOGIN
    // ==========================================

    async login(data: LoginDTO): Promise<AuthResponseDTO> {
        const validated = loginSchema.parse(data);

        const admin = await repo.buscarPorEmail(validated.email);
        
        if (!admin) {
            throw new Error("E-mail ou senha inválidos");
        }

        const senhaValida = await bcrypt.compare(validated.senha, admin.senha);
        if (!senhaValida) {
            throw new Error("E-mail ou senha inválidos");
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET não configurado no ambiente");
        }

       const token = jwt.sign(
    { id: admin.id, email: admin.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
);

        const adminResponse: AdminResponseDTO = {
            id: admin.id!,
            nome: admin.nome,
            email: admin.email,
            criado_em: admin.criado_em || new Date(),
        };

        return { admin: adminResponse, token };
    }

    // ==========================================
    // VALIDAR TOKEN
    // ==========================================

    async validarToken(token: string): Promise<AdminResponseDTO> {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("JWT_SECRET não configurado");
            }

            const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };
            
            const admin = await repo.buscarPorId(decoded.id);
            if (!admin) {
                throw new Error("Admin não encontrado");
            }

            return {
                id: admin.id!,
                nome: admin.nome,
                email: admin.email,
                criado_em: admin.criado_em || new Date(),
            };
        } catch (error) {
            throw new Error("Token inválido ou expirado");
        }
    }

    // ==========================================
    // RECUPERAÇÃO DE SENHA
    // ==========================================

       async solicitarRecuperacaoSenha(email: string): Promise<{ mensagem: string }> {
        const admin = await repo.buscarPorEmail(email);
        
        // Por segurança, sempre retorna a mesma mensagem (evita enumeração de emails)
        const msgSegura = "Se o e-mail estiver cadastrado, você receberá um link de recuperação.";

        if (!admin) return { mensagem: msgSegura };

        // Gera token seguro e expiração (1 hora)
        const token = crypto.randomBytes(32).toString("hex");
        const expiracao = new Date(Date.now() + 3600000);

        // Salva no banco
        await repo.criarTokenRecuperacao(admin.id!, token, expiracao);

        // Envia email
        try {
            await enviarEmailRecuperacao(email, token);
        } catch (error) {
            console.error("Erro ao enviar email:", error);
            // Falha no email não deve quebrar o fluxo, mas logamos
        }

        return { mensagem: msgSegura };
    }

    async resetarSenha(token: string, novaSenha: string): Promise<{ mensagem: string }> {
        // Busca token válido (não usado e não expirado)
        const tokenData = await repo.buscarTokenValido(token);
        if (!tokenData) {
            throw new Error("Token inválido ou expirado");
        }

        // Hash da nova senha
        const hashedSenha = await bcrypt.hash(novaSenha, 12);

        // Atualiza senha no banco
        await repo.atualizar(tokenData.admin_id, { senha: hashedSenha });

        // Invalida token
        await repo.marcarTokenComoUsado(token);

        return { mensagem: "Senha redefinida com sucesso!" };
    }

    // ==========================================
    // EXCLUIR ADMIN
    // ==========================================

    async excluir(id: number): Promise<{ mensagem: string }> {
        const excluiu = await repo.excluir(id);
        if (!excluiu) {
            throw new Error("Admin não encontrado");
        }

        return { mensagem: "Admin excluído com sucesso!" };
    }
}