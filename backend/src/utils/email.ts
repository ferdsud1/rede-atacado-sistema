import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // false para porta 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verifica conexão ao iniciar
transporter.verify().then(() => console.log("✅ Servidor de email conectado")).catch(console.error);

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

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: destinatario,
        subject: "Redefinição de Senha - Certo Atacado",
        html,
    });
}