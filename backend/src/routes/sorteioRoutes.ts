import { Router, Request, Response, NextFunction } from "express";
import { SorteioService } from "../service/SorteioService";
// ✅ IMPORT DO MIDDLEWARE CENTRALIZADO
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const service = new SorteioService();

// ==========================================
// CONFIGURAÇÃO DO MULTER (UPLOAD DE IMAGENS)
// ==========================================

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagem inválido. Use JPEG, PNG ou WebP.'));
        }
    },
});

// ==========================================
// ROTAS PÚBLICAS (Site - Sem autenticação)
// ==========================================

// GET /sorteios/ativos - Lista sorteios ativos (Site público)
router.get("/ativos", async (req, res) => {
    try {
        const sorteios = await service.listarAtivos();
        res.json(sorteios);
    } catch (err: any) {
        console.error("Erro ao listar sorteios ativos:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ==========================================
// ROTAS PROTEGIDAS (Admin - Requer autenticação)
// ==========================================

// POST /sorteios/criar - Criar sorteio (Admin)
router.post("/criar", authMiddleware, upload.single("imagem"), async (req, res) => {
    try {
        const { titulo, descricao, data_inicio, data_fim, ativo } = req.body;

        if (!req.file) {
            res.status(400).json({ erro: "Imagem é obrigatória" });
            return;
        }

        if (!titulo || !data_inicio || !data_fim) {
            res.status(400).json({ erro: "Título, data de início e data de término são obrigatórios" });
            return;
        }

        // Salvar imagem (mesma lógica dos encartes)
        const { randomUUID } = require("crypto");
        const path = require("path");
        const fs = require("fs");
        
        const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
        const ext = path.extname(req.file.originalname);
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        
        fs.writeFileSync(filepath, req.file.buffer);
        const imagem_url = `/uploads/${filename}`;

        const sorteio = await service.criar({
            titulo,
            descricao,
            imagem_url,
            data_inicio: new Date(data_inicio),
            data_fim: new Date(data_fim),
            ativo: ativo === "true"
        });

        res.status(201).json(sorteio);
    } catch (err: any) {
        console.error("Erro ao criar sorteio:", err);
        res.status(400).json({ erro: err.message });
    }
});

// GET /sorteios/listar - Listar todos os sorteios (Admin)
router.get("/listar", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const sorteios = await service.listarTodos();
        res.json(sorteios);
    } catch (err: any) {
        console.error("Erro ao listar sorteios:", err);
        res.status(500).json({ erro: err.message });
    }
});

// GET /sorteios/buscar/:id - Buscar sorteio por ID (Admin)
router.get("/buscar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const sorteio = await service.buscarPorId(id);

        if (!sorteio) {
            res.status(404).json({ erro: "Sorteio não encontrado" });
            return;
        }

        res.json(sorteio);
    } catch (err: any) {
        console.error("Erro ao buscar sorteio:", err);
        res.status(500).json({ erro: err.message });
    }
});

// PUT /sorteios/atualizar/:id - Atualizar sorteio (Admin)
router.put("/atualizar/:id", authMiddleware, upload.single("imagem"), async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const { titulo, descricao, data_inicio, data_fim, ativo } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const data: any = {};
        if (titulo) data.titulo = titulo;
        if (descricao !== undefined) data.descricao = descricao;
        if (data_inicio) data.data_inicio = new Date(data_inicio);
        if (data_fim) data.data_fim = new Date(data_fim);
        if (ativo !== undefined) data.ativo = ativo === "true" || ativo === true;

        // Se tiver nova imagem
        if (req.file) {
            const { randomUUID } = require("crypto");
            const path = require("path");
            const fs = require("fs");
            
            const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
            const ext = path.extname(req.file.originalname);
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            
            fs.writeFileSync(filepath, req.file.buffer);
            data.imagem_url = `/uploads/${filename}`;
        }

        const sorteio = await service.atualizar(id, data);
        res.json(sorteio);
    } catch (err: any) {
        console.error("Erro ao atualizar sorteio:", err);
        res.status(400).json({ erro: err.message });
    }
});

// DELETE /sorteios/excluir/:id - Excluir sorteio (Admin)
router.delete("/excluir/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const result = await service.excluir(id);
        res.json(result);
    } catch (err: any) {
        console.error("Erro ao excluir sorteio:", err);
        res.status(400).json({ erro: err.message });
    }
});

// POST /sorteios/ativar/:id - Ativar sorteio (Admin)
router.post("/ativar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const sorteio = await service.ativar(id);
        res.json(sorteio);
    } catch (err: any) {
        console.error("Erro ao ativar sorteio:", err);
        res.status(400).json({ erro: err.message });
    }
});

// POST /sorteios/desativar/:id - Desativar sorteio (Admin)
router.post("/desativar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const sorteio = await service.desativar(id);
        res.json(sorteio);
    } catch (err: any) {
        console.error("Erro ao desativar sorteio:", err);
        res.status(400).json({ erro: err.message });
    }
});

export default router;