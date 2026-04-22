import { AdminRepository } from "../repository/AdminRepository";
import { CreateAdminDTO, LoginDTO, AdminResponseDTO, AuthResponseDTO } from "../entity/AdminDTO";
import { createAdminSchema, loginSchema } from "../utils/validations";
import { AppError } from "../utils/AppError";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { enviarEmailRecuperacao } from "../utils/email";

export class AdminService {
    private readonly repo = new AdminRepository();

    async cadastrar(data: CreateAdminDTO): Promise<AdminResponseDTO> {
        try {
            const validated = createAdminSchema.parse(data);

            const existe = await this.repo.buscarPorEmail(validated.email);
            if (existe) {
                throw new AppError("E-mail já cadastrado", StatusCodes.CONFLICT);
            }

            const hash = await bcrypt.hash(validated.senha, 12);

            return await this.repo.criar({
                nome: validated.nome,
                email: validated.email,
                senha: hash,
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao cadastrar admin",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async login(data: LoginDTO): Promise<AuthResponseDTO> {
        try {
            const validated = loginSchema.parse(data);

            const admin = await this.repo.buscarPorEmail(validated.email);
            if (!admin) {
                throw new AppError("E-mail ou senha inválidos", StatusCodes.UNAUTHORIZED);
            }

            const senhaValida = await bcrypt.compare(validated.senha, admin.senha);
            if (!senhaValida) {
                throw new AppError("E-mail ou senha inválidos", StatusCodes.UNAUTHORIZED);
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new AppError("JWT_SECRET não configurado no ambiente", StatusCodes.INTERNAL_SERVER_ERROR);
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
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao realizar login",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async validarToken(token: string): Promise<AdminResponseDTO> {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new AppError("JWT_SECRET não configurado", StatusCodes.INTERNAL_SERVER_ERROR);
            }

            const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };

            const admin = await this.repo.buscarPorId(decoded.id);
            if (!admin) {
                throw new AppError("Admin não encontrado", StatusCodes.NOT_FOUND);
            }

            return {
                id: admin.id!,
                nome: admin.nome,
                email: admin.email,
                criado_em: admin.criado_em || new Date(),
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Token inválido ou expirado",
                StatusCodes.UNAUTHORIZED,
                undefined,
                error
            );
        }
    }

    async solicitarRecuperacaoSenha(email: string): Promise<{ mensagem: string }> {
        const msgSegura = "Se o e-mail estiver cadastrado, você receberá um link de recuperação.";

        try {
            const admin = await this.repo.buscarPorEmail(email);
            if (!admin) return { mensagem: msgSegura };

            const token = crypto.randomBytes(32).toString("hex");
            const expiracao = new Date(Date.now() + 3600000);

            await this.repo.criarTokenRecuperacao(admin.id!, token, expiracao);

            try {
                await enviarEmailRecuperacao(email, token);
            } catch (error) {
                console.error("Erro ao enviar email:", error);
            }

            return { mensagem: msgSegura };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao solicitar recuperação de senha",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async resetarSenha(token: string, novaSenha: string): Promise<{ mensagem: string }> {
        try {
            const tokenData = await this.repo.buscarTokenValido(token);
            if (!tokenData) {
                throw new AppError("Token inválido ou expirado", StatusCodes.BAD_REQUEST);
            }

            const hashedSenha = await bcrypt.hash(novaSenha, 12);
            await this.repo.atualizar(tokenData.admin_id, { senha: hashedSenha });
            await this.repo.marcarTokenComoUsado(token);

            return { mensagem: "Senha redefinida com sucesso!" };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao resetar senha",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }

    async excluir(id: number): Promise<{ mensagem: string }> {
        try {
            const excluiu = await this.repo.excluir(id);
            if (!excluiu) {
                throw new AppError("Admin não encontrado", StatusCodes.NOT_FOUND);
            }

            return { mensagem: "Admin excluído com sucesso!" };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                "Erro ao excluir admin",
                StatusCodes.INTERNAL_SERVER_ERROR,
                undefined,
                error
            );
        }
    }
}
