import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "Certo Atacado <onboarding@resend.dev>";

export { resend, EMAIL_FROM };

/**
 * Classifica erros do Resend/email em mensagens amigáveis.
 * Cobre cenários de API key inválida, domínio não verificado,
 * servidor inalcançável e outros.
 */
export function classificarErroEmail(error: unknown): string {
    if (!(error instanceof Error)) {
        return "Erro desconhecido ao enviar email.";
    }

    const message = error.message.toLowerCase();

    // API key inválida ou ausente
    if (
        message.includes("api key") ||
        message.includes("missing api key") ||
        message.includes("invalid api key") ||
        message.includes("unauthorized") ||
        message.includes("authentication") ||
        message.includes("forbidden")
    ) {
        return "Credenciais de email inválidas. Verifique a variável RESEND_API_KEY.";
    }

    // Domínio não verificado ou remetente inválido
    if (
        message.includes("domain") ||
        message.includes("not verified") ||
        message.includes("sender") ||
        message.includes("from address")
    ) {
        return "Domínio de envio não verificado. Verifique a configuração do domínio no Resend e a variável EMAIL_FROM.";
    }

    // Rate limit
    if (
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("429")
    ) {
        return "Limite de envio de emails atingido. Tente novamente em alguns minutos.";
    }

    // Destinatário inválido
    if (
        message.includes("invalid") && message.includes("email") ||
        message.includes("recipient") ||
        message.includes("validation")
    ) {
        return "Endereço de email do destinatário é inválido.";
    }

    // Erros de rede / servidor inalcançável
    const code = (error as NodeJS.ErrnoException).code;
    if (
        code === "ECONNREFUSED" ||
        code === "ECONNRESET" ||
        code === "ENOTFOUND" ||
        code === "ETIMEDOUT" ||
        code === "ENETUNREACH" ||
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("getaddrinfo") ||
        message.includes("fetch failed")
    ) {
        return "Servidor de email inalcançável. Verifique a conectividade de rede.";
    }

    return `Erro ao enviar email: ${error.message}`;
}

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

    try {
        const { error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [destinatario],
            subject: "Redefinição de Senha - Certo Atacado",
            html,
        });

        if (error) {
            throw new Error(error.message);
        }
    } catch (error) {
        const mensagem = classificarErroEmail(error);
        console.error(`Erro ao enviar email de recuperação para ${destinatario}: ${mensagem}`, error);
        throw new Error(mensagem);
    }
}
