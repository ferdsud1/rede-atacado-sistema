import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "Certo Atacado <onboarding@resend.dev>";

export { resend, EMAIL_FROM };

export async function enviarEmailRecuperacao(destinatario: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/resetar-senha.html?token=${token}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #ff6600;">🔐 Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha no <strong>Certo Atacado</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p style="color: #666; font-size: 13px;">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
        </div>
    `;

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [destinatario],
        subject: "Redefinição de Senha - Certo Atacado",
        html,
    });

    if (error) {
        throw new Error(`Erro ao enviar email: ${error.message}`);
    }
}
