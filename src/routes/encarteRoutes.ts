import { Router, Request, Response } from "express";
import { EncarteService } from "../service/EncarteService";
import { CategoriaService } from "../service/CategoriaService";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { CreateEncarteDTO } from "../entity/EncarteDTO";
import multer from "multer";

const router = Router();
const service = new EncarteService();
const categoriaService = new CategoriaService();

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        allowed.includes(file.mimetype) 
            ? cb(null, true) 
            : cb(new Error('Formato inválido. Use JPG, PNG ou WebP.'));
    },
});

// ============================================================================
// ROTAS PÚBLICAS
// ============================================================================

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
        console.error("❌ Erro ao listar encartes ativos:", err);
        res.status(500).json({ erro: err.message });
    }
});

router.get("/futuros", async (req: Request, res: Response) => {
    try {
        const encartes = await service.listarFuturos();
        res.json(encartes);
    } catch (err: any) {
        console.error("❌ Erro ao listar encartes futuros:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ============================================================================
// ROTAS PROTEGIDAS (Admin)
// ============================================================================

// ✅ CRIAÇÃO COM IMAGENS - CORRIGIDO TIPO
router.post('/com-imagens', authMiddleware, upload.array('imagens', 20), async (req: AuthRequest, res: Response) => {
    try {
        const dados: CreateEncarteDTO = {
            titulo: req.body.titulo?.trim(),
            data_inicio: req.body.data_inicio,
            data_fim: req.body.data_fim,
            ativo: req.body.ativo !== undefined ? req.body.ativo === 'true' : undefined,
            categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : undefined
        };

        // Validação básica no backend
        if (!dados.titulo || dados.titulo.length < 3) {
            return res.status(400).json({ erro: 'Título deve ter pelo menos 3 caracteres' });
        }
        if (!dados.data_inicio || !dados.data_fim) {
            return res.status(400).json({ erro: 'Datas de início e fim são obrigatórias' });
        }
        if (dados.data_inicio && dados.data_fim && new Date(dados.data_fim) <= new Date(dados.data_inicio)) {
            return res.status(400).json({ erro: 'Data final deve ser posterior à data inicial' });
        }

        // ✅ CORREÇÃO: Tipagem correta do multer
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
            return res.status(400).json({ erro: 'Pelo menos uma imagem é obrigatória' });
        }

        // ✅ CORREÇÃO: Passando array de arquivos corretamente
        const encarte = await service.criarComImagens(dados, files);
        return res.status(201).json({ 
            sucesso: true, 
            mensagem: 'Encarte criado com sucesso', 
            dados: encarte 
        });
    } catch (error: any) {
        console.error('❌ Erro ao criar encarte:', error);
        res.status(400).json({ erro: error.message });
    }
});

// ✅ LISTAR TODOS (Admin)
router.get("/listar", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const encartes = await service.buscarTodos();
        res.json(encartes);
    } catch (err: any) {
        console.error("❌ Erro ao listar encartes:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ✅ BUSCAR POR ID
router.get("/buscar/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });
        
        const encarte = await service.buscarPorId(id);
        if (!encarte) return res.status(404).json({ erro: "Encarte não encontrado" });
        
        res.json(encarte);
    } catch (err: any) {
        console.error("❌ Erro ao buscar encarte:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ✅ ATUALIZAR - CORRIGIDO TIPO
router.put("/atualizar/:id", authMiddleware, upload.array("imagem", 20), async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });
        
        const { titulo, data_inicio, data_fim, ativo, categoria_id } = req.body;
        const updateData: any = {
            titulo: titulo?.trim() || undefined,
            data_inicio: data_inicio || undefined,
            data_fim: data_fim || undefined,
            ativo: ativo !== undefined ? (ativo === "true" || ativo === true) : undefined,
            categoria_id: (categoria_id !== undefined && categoria_id !== "") ? parseInt(categoria_id) : undefined
        };

        // ✅ CORREÇÃO: Tipagem correta do multer
        const files = req.files as Express.Multer.File[];
        
        const encarte = await service.atualizar(id, updateData, files);
        res.json(encarte);
    } catch (err: any) {
        console.error("❌ Erro ao atualizar encarte:", err);
        res.status(400).json({ erro: err.message });
    }
});

// ✅ EXCLUIR
router.delete("/excluir/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });
        
        const result = await service.deletar(id);
        res.json(result);
    } catch (err: any) {
        console.error("❌ Erro ao excluir encarte:", err);
        res.status(400).json({ erro: err.message });
    }
});

// ✅ ALTERAR STATUS
router.post("/alterar-status/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        
        if (isNaN(id) || ativo === undefined) {
            return res.status(400).json({ erro: "Parâmetros inválidos" });
        }
        
        const encarte = await service.atualizarStatus(id, ativo === true || ativo === "true");
        res.json(encarte);
    } catch (err: any) {
        console.error("❌ Erro ao alterar status:", err);
        res.status(400).json({ erro: err.message });
    }
});

export default router;
