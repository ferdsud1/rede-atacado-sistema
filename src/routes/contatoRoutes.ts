import { Router, Request, Response } from "express";
import multer from "multer";
import { resend, EMAIL_FROM } from "../utils/email";

const router = Router();

// Sanitizar HTML para prevenir XSS em emails
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// Configurar Multer (armazenamento em memória para anexo no email)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Máx 5MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Formato inválido. Apenas PDF, DOC ou DOCX."));
        }
    }
});

// POST /contato/fale-conosco
router.post("/fale-conosco", async (req: Request, res: Response) => {
    try {
        const { nome, email, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
        }

        // Validar comprimento dos campos
        if (nome.length > 200 || email.length > 254 || mensagem.length > 5000) {
            return res.status(400).json({ erro: "Campos excedem o tamanho máximo permitido" });
        }

        // Sanitizar inputs antes de inserir no HTML
        const nomeSeguro = escapeHtml(nome);
        const emailSeguro = escapeHtml(email);
        const mensagemSegura = escapeHtml(mensagem);

        const { error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [process.env.EMAIL_USER!],
            replyTo: [email],
            subject: `Nova mensagem de ${nomeSeguro} - Fale Conosco`,
            html: `
                <h2>Nova mensagem via Fale Conosco</h2>
                <p><strong>Nome:</strong> ${nomeSeguro}</p>
                <p><strong>Email:</strong> ${emailSeguro}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagemSegura.replace(/\n/g, "<br>")}</p>
            `
        });

        if (error) throw new Error(error.message);

        res.json({ sucesso: true });
    } catch (error: any) {
        console.error("Erro ao enviar email:", error);
        res.status(500).json({ erro: "Erro ao enviar mensagem. Tente novamente." });
    }
});

// POST /contato/trabalhe-conosco (COM UPLOAD DE CURRÍCULO)
router.post("/trabalhe-conosco", upload.single("curriculo"), async (req: Request, res: Response) => {
    try {
        const { nome, email, telefone, cargo, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ erro: "Nome, email e mensagem são obrigatórios" });
        }

        // Validar comprimento dos campos
        if (nome.length > 200 || email.length > 254 || mensagem.length > 5000) {
            return res.status(400).json({ erro: "Campos excedem o tamanho máximo permitido" });
        }

        const file = req.file as Express.Multer.File | undefined;

        // Sanitizar inputs antes de inserir no HTML
        const nomeSeguro = escapeHtml(nome);
        const emailSeguro = escapeHtml(email);
        const telefoneSeguro = escapeHtml(telefone || "Não informado");
        const cargoSeguro = escapeHtml(cargo || "Não especificado");
        const mensagemSegura = escapeHtml(mensagem);

        const { error: sendError } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [process.env.EMAIL_USER!],
            replyTo: [email],
            subject: `Candidatura de ${nomeSeguro} - ${cargoSeguro}`,
            html: `
                <h2>Nova Candidatura - Trabalhe Conosco</h2>
                <p><strong>Nome:</strong> ${nomeSeguro}</p>
                <p><strong>Email:</strong> ${emailSeguro}</p>
                <p><strong>Telefone:</strong> ${telefoneSeguro}</p>
                <p><strong>Cargo desejado:</strong> ${cargoSeguro}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagemSegura.replace(/\n/g, "<br>")}</p>
            `,
            attachments: file ? [{
                filename: file.originalname,
                content: file.buffer.toString("base64"),
            }] : []
        });

        if (sendError) throw new Error(sendError.message);

        res.json({ sucesso: true });
    } catch (error: any) {
        console.error("Erro ao enviar candidatura:", error);
        res.status(500).json({ erro: error.message || "Erro ao enviar candidatura." });
    }
});

export default router;
