import { Router, Request, Response } from "express";
import { EncarteService } from "../service/EncarteService";
import { CategoriaService } from "../service/CategoriaService";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const service = new EncarteService();
const categoriaService = new CategoriaService();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Formato inválido'));
    },
});

// ==========================================
// ROTAS PÚBLICAS
// ==========================================

router.get("/ativos", async (req: Request, res: Response) => {
    try {
        const encartes = await service.listarAtivos();
        
        const formatados = encartes.map(e => ({
            ...e,
            imagens: (e as any).imagens || ((e as any).imagem_url ? [(e as any).imagem_url] : []),
            categoria_nome: (e as any).categoria_nome || 'Ofertas',
            categoria_cor: (e as any).categoria_cor || '#ff6600',
            categoria_icone: (e as any).categoria_icone || '🏷️'
        }));
        
        console.log('📤 Encartes ativos retornados:', formatados.length);
        res.json(formatados);
    } catch (err: any) {
        console.error("Erro ao listar encartes ativos:", err);
        res.status(500).json({ erro: err.message });
    }
});

router.get("/futuros", async (req: Request, res: Response) => {
    try {
        const encartes = await service.listarFuturos();
        res.json(encartes);
    } catch (err: any) {
        console.error("Erro ao listar encartes futuros:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ==========================================
// ROTAS PROTEGIDAS (Admin)
// ==========================================

router.post("/criar", authMiddleware, upload.array("imagem", 20), async (req: Request, res: Response) => {
    try {
        const { titulo, data_inicio, data_fim, ativo, categoria_nome, categoria_id, categoria_cor, categoria_icone } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ erro: "Pelo menos uma imagem é obrigatória" });
        }

        if (!titulo || !data_inicio || !data_fim) {
            return res.status(400).json({ erro: "Título, data de início e término são obrigatórios" });
        }

        let finalCategoriaId: number | null = null;
        
        if (categoria_id !== undefined && categoria_id !== null && categoria_id !== "" && categoria_id !== "null") {
            finalCategoriaId = parseInt(categoria_id);
            console.log('✅ Usando categoria_id do select:', finalCategoriaId);
        } 
        else if (categoria_nome && categoria_nome.trim() !== "") {
            const existente = await categoriaService.buscarPorNome(categoria_nome.trim());
            if (existente) {
                finalCategoriaId = existente.id;
            } else {
                const nova = await categoriaService.criar({
                    nome: categoria_nome.trim(),
                    descricao: `Ofertas de ${categoria_nome}`,
                    cor: categoria_cor || '#ff6600',
                    icone: categoria_icone || '🏷️',
                    ativo: true
                });
                finalCategoriaId = nova.id;
            }
        }

        const encarte = await service.criarComImagens(
            {
                titulo,
                data_inicio,
                data_fim,
                ativo: ativo === "true" || ativo === true,
                categoria_id: finalCategoriaId  ?? undefined 
            },
            files
        );

        res.status(201).json(encarte);
    } catch (err: any) {
        console.error("Erro ao criar encarte:", err);
        res.status(400).json({ erro: err.message });
    }
});

router.get("/listar", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const encartes = awaitservice.buscarTodos();
        res.json(encartes);
    } catch (err: any) {
        console.error("Erro ao listar encartes:", err);
        res.status(500).json({ erro: err.message });
    }
});

router.get("/buscar/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });

        const encarte = await service.buscarPorId(id);
        if (!encarte) return res.status(404).json({ erro: "Encarte não encontrado" });

        res.json(encarte);
    } catch (err: any) {
        console.error("Erro ao buscar encarte:", err);
        res.status(500).json({ erro: err.message });
    }
});

router.put("/atualizar/:id", authMiddleware, upload.array("imagem", 20), async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });

        const { titulo, data_inicio, data_fim, ativo, categoria_id } = req.body;
        
        const updateData: any = {
            titulo: titulo || undefined,
            data_inicio: data_inicio || undefined,
            data_fim: data_fim || undefined,
            ativo: ativo !== undefined ? (ativo === "true" || ativo === true) : undefined,
            categoria_id: categoria_id !== undefined && categoria_id !== "" ? parseInt(categoria_id) : undefined
        };

        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            updateData.imagens = await service.criarComImagens(files);
        }

        const encarte = await service.atualizar(id, updateData);
        res.json(encarte);
    } catch (err: any) {
        console.error("Erro ao atualizar encarte:", err);
        res.status(400).json({ erro: err.message });
    }
});

router.delete("/excluir/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });

        const result = awaitservice.deletar(id);
        res.json(result);
    } catch (err: any) {
        console.error("Erro ao excluir encarte:", err);
        res.status(400).json({ erro: err.message });
    }
});

router.post("/alterar-status/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        if (isNaN(id) || ativo === undefined) return res.status(400).json({ erro: "Parâmetros inválidos" });

        const encarte = await service.atualizarStatus(id, ativo === true || ativo === "true");
        res.json(encarte);
    } catch (err: any) {
        console.error("Erro ao alterar status:", err);
        res.status(400).json({ erro: err.message });
    }
});

export default router;
