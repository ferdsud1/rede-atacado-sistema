import dotenv from "dotenv";

dotenv.config();

const EMAIL_FROM = process.env.EMAIL_FROM || "Certo Atacado <onboarding@resend.dev>";

export { EMAIL_FROM };

// Email desabilitado - sem Resend configurado
export async function enviarEmailRecuperacao(destinatario: string, token: string): Promise<void> {
    console.log('⚠️ Email desabilitado - RESEND_API_KEY não configurada');
    console.log(`[SIMULADO] Link de recuperação: ${process.env.FRONTEND_URL || "http://localhost:3000"}/resetar-senha.html?token=${token}`);
}
