import { Router, Request, Response } from "express";
import multer from "multer";
import { resend, EMAIL_FROM, classificarErroEmail } from "../utils/email";

const router = Router();

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

        const { error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [process.env.EMAIL_USER!],
            replyTo: [email],
            subject: `Nova mensagem de ${nome} - Fale Conosco`,
            html: `
                <h2>Nova mensagem via Fale Conosco</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagem.replace(/\n/g, "<br>")}</p>
            `
        });

        if (error) throw new Error(error.message);

        res.json({ sucesso: true });
    } catch (error: any) {
        const mensagemErro = classificarErroEmail(error);
        console.error("Erro ao enviar email (fale-conosco):", mensagemErro, error);
        res.status(500).json({ erro: mensagemErro });
    }
});

// POST /contato/trabalhe-conosco (COM UPLOAD DE CURRÍCULO)
router.post("/trabalhe-conosco", upload.single("curriculo"), async (req: Request, res: Response) => {
    try {
        const { nome, email, telefone, cargo, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ erro: "Nome, email e mensagem são obrigatórios" });
        }

        const file = req.file as Express.Multer.File | undefined;

        const { error: sendError } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [process.env.EMAIL_USER!],
            replyTo: [email],
            subject: `Candidatura de ${nome} - ${cargo || "Vaga"}`,
            html: `
                <h2>Nova Candidatura - Trabalhe Conosco</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone || "Não informado"}</p>
                <p><strong>Cargo desejado:</strong> ${cargo || "Não especificado"}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagem.replace(/\n/g, "<br>")}</p>
            `,
            attachments: file ? [{
                filename: file.originalname,
                content: file.buffer.toString("base64"),
            }] : []
        });

        if (sendError) throw new Error(sendError.message);

        res.json({ sucesso: true });
    } catch (error: any) {
        const mensagemErro = classificarErroEmail(error);
        console.error("Erro ao enviar candidatura (trabalhe-conosco):", mensagemErro, error);
        res.status(500).json({ erro: mensagemErro });
    }
});

export default router;
