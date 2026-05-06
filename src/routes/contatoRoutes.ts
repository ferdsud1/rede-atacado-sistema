import { Router, Request, Response } from "express";
import multer from "multer";
import { EMAIL_FROM } from "../utils/email";

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
        // Email desabilitado - retorna sucesso simulado
        return res.status(200).json({ sucesso: true, mensagem: "Mensagem recebida (email desabilitado)" });
    } catch (error: any) {
        console.error("Erro ao processar mensagem:", error);
        res.status(500).json({ erro: "Erro ao processar mensagem. Tente novamente." });
    }
});

// POST /contato/trabalhe-conosco (COM UPLOAD DE CURRÍCULO)
router.post("/trabalhe-conosco", upload.single("curriculo"), async (req: Request, res: Response) => {
    try {
        // Email desabilitado - retorna sucesso simulado
        return res.status(200).json({ sucesso: true, mensagem: "Candidatura recebida (email desabilitado)" });
    } catch (error: any) {
        console.error("Erro ao processar candidatura:", error);
        res.status(500).json({ erro: error.message || "Erro ao processar candidatura." });
    }
});

export default router;
