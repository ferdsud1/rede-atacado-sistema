import { Router } from "express";
import { CategoriaService } from "../service/CategoriaService";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { EncarteRepository } from "../repository/EncarteRepository";

const router = Router();
const service = new CategoriaService();
const encarteRepo = new EncarteRepository();

// ==========================================
// ROTAS PÚBLICAS
// ==========================================

// GET /categorias/listar - Lista categorias ativas (Site público)
router.get("/listar", async (req, res) => {
    try {
        const categorias = await service.listarTodas();
        const ativas = categorias.filter(c => c.ativo !== false);
        res.json(ativas);
    } catch (err: any) {
        console.error("Erro ao listar categorias:", err);
        res.status(500).json({ erro: err.message });
    }
});

// GET /categorias/com-encartes - Lista categorias com seus encartes ativos (Site público)
router.get("/com-encartes", async (req, res) => {
    try {
        const categorias = await service.listarTodas();
        const ativas = categorias.filter(c => c.ativo !== false);
        
        // Para cada categoria, busca os encartes ativos
        const categoriasComEncartes = await Promise.all(
            ativas.map(async (categoria) => {
                const encartes = await encarteRepo.buscarPorCategoria(categoria.id);
                return {
                    ...categoria,
                    encartes: encartes.filter(e => e.ativo && new Date(e.data_fim) >= new Date())
                };
            })
        );
        
        res.json(categoriasComEncartes);
    } catch (err: any) {
        console.error("Erro ao listar categorias com encartes:", err);
        res.status(500).json({ erro: err.message });
    }
});

// ==========================================
// ROTAS PROTEGIDAS (Admin)
// ==========================================

// GET /categorias/todas - Lista todas (Admin)
router.get("/todas", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const categorias = await service.listarTodas();
        res.json(categorias);
    } catch (err: any) {
        console.error("Erro ao listar categorias:", err);
        res.status(500).json({ erro: err.message });
    }
});

// POST /categorias/criar - Criar categoria (Admin)
router.post("/criar", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { nome, descricao, cor, icone, ativo, ordem } = req.body;

        if (!nome) {
            res.status(400).json({ erro: "Nome é obrigatório" });
            return;
        }

        const categoria = await service.criar({
            nome,
            descricao,
            cor,
            icone,
            ativo: ativo ?? true,
            ordem: ordem || 0
        });

        res.status(201).json(categoria);
    } catch (err: any) {
        console.error("Erro ao criar categoria:", err);
        res.status(400).json({ erro: err.message });
    }
});

// PUT /categorias/atualizar/:id - Atualizar categoria (Admin)
router.put("/atualizar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, descricao, cor, icone, ativo, ordem } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const data: any = {};
        if (nome) data.nome = nome;
        if (descricao !== undefined) data.descricao = descricao;
        if (cor !== undefined) data.cor = cor;
        if (icone !== undefined) data.icone = icone;
        if (ativo !== undefined) data.ativo = ativo;
        if (ordem !== undefined) data.ordem = ordem;

        const categoria = await service.atualizar(id, data);
        res.json(categoria);
    } catch (err: any) {
        console.error("Erro ao atualizar categoria:", err);
        res.status(400).json({ erro: err.message });
    }
});

// DELETE /categorias/excluir/:id - Excluir categoria (Admin)
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
        console.error("Erro ao excluir categoria:", err);
        res.status(400).json({ erro: err.message });
    }
});

// GET /categorias/buscar/:id - Buscar categoria por ID (Admin)
router.get("/buscar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ erro: "ID inválido" });
            return;
        }

        const categoria = await service.buscarPorId(id);
        if (!categoria) {
            res.status(404).json({ erro: "Categoria não encontrada" });
            return;
        }

        res.json(categoria);
    } catch (err: any) {
        console.error("Erro ao buscar categoria:", err);
        res.status(400).json({ erro: err.message });
    }
});

export default router;