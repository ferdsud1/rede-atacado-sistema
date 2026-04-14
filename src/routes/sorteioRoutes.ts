import { Router, Request, Response } from "express";
import { createClient } from '@supabase/supabase-js';
import { SorteioService } from "../service/SorteioService";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const service = new SorteioService();

// Validar variáveis de ambiente do Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const STORAGE_BUCKET = 'sorteios';
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Formato inválido'));
    },
});

async function uploadImagemSupabase(file: Express.Multer.File, titulo: string): Promise<string> {
    const nomeArquivo = `${Date.now()}-${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(nomeArquivo, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (uploadError) throw new Error(`Erro ao fazer upload: ${uploadError.message}`);

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(nomeArquivo);
    return data.publicUrl;
}

router.get("/ativos", async (req, res) => {
    try {
        const sorteios = await service.listarAtivos();
        res.json(sorteios);
    } catch (err: any) {
        console.error("Erro ao listar sorteios ativos:", err);
        res.status(500).json({ erro: err.message });
    }
});

router.post("/criar", authMiddleware, upload.single("imagem"), async (req, res) => {
    try {
        const { titulo, descricao, data_inicio, data_fim, ativo } = req.body;

        if (!req.file) {
            res.status(400).json({ erro: "Imagem é obrigatória" });
            return;
        }

        if (!titulo || !data_inicio || !data_fim) {
            res.status(400).json({ erro: "Dados obrigatórios faltando" });
            return;
        }

        const imagem_url = await uploadImagemSupabase(req.file, titulo);

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

router.get("/listar", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const sorteios = await service.listarTodos();
        res.json(sorteios);
    } catch (err: any) {
        res.status(500).json({ erro: err.message });
    }
});

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
        res.status(500).json({ erro: err.message });
    }
});

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

        if (req.file) {
            data.imagem_url = await uploadImagemSupabase(req.file, titulo || 'sorteio');
        }

        const sorteio = await service.atualizar(id, data);
        res.json(sorteio);
    } catch (err: any) {
        res.status(400).json({ erro: err.message });
    }
});

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
        res.status(400).json({ erro: err.message });
    }
});

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
        res.status(400).json({ erro: err.message });
    }
});

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
        res.status(400).json({ erro: err.message });
    }
});

export default router;
