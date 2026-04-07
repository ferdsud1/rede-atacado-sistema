import { Router, Request, Response, NextFunction } from "express";
import { AdminService } from "../service/AdminService";
// ✅ IMPORT DO MIDDLEWARE CENTRALIZADO
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
const service = new AdminService();

// ==========================================
// ROTAS PÚBLICAS
// ==========================================

// POST /admin/cadastrar - Criar novo admin
router.post("/cadastrar", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });
        }

        const admin = await service.cadastrar({ nome, email, senha });
        return res.status(201).json(admin);
    } catch (err: any) {
        console.error("Erro ao cadastrar admin:", err);
        return res.status(400).json({ erro: err.message });
    }
});

// POST /admin/login - Autenticar admin
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
        }

        const data = await service.login({ email, senha });
        return res.json(data);
    } catch (err: any) {
        console.error("Erro ao fazer login:", err);
        return res.status(401).json({ erro: err.message });
    }
});

// POST /admin/recuperar-senha - Solicitar recuperação
router.post("/recuperar-senha", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ erro: "E-mail é obrigatório" });
        }

        const result = await service.solicitarRecuperacaoSenha(email);
        return res.json(result);
    } catch (err: any) {
        console.error("Erro ao solicitar recuperação:", err);
        return res.status(400).json({ erro: err.message });
    }
});

// POST /admin/resetar-senha - Redefinir senha
router.post("/resetar-senha", async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({ erro: "Token e nova senha são obrigatórios" });
        }

        const result = await service.resetarSenha(token, novaSenha);
        return res.json(result);
    } catch (err: any) {
        console.error("Erro ao resetar senha:", err);
        return res.status(400).json({ erro: err.message });
    }
});

// ==========================================
// ROTAS PROTEGIDAS (Requer autenticação)
// ==========================================

// GET /admin/validar-token - Verificar token
router.get("/validar-token", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ erro: "Token não fornecido" });
        }

        const admin = await service.validarToken(token);
        return res.json(admin);
    } catch (err: any) {
        return res.status(401).json({ erro: err.message });
    }
});

// GET /admin/listar - Listar todos admins
router.get("/listar", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const admins = await service.listarTodos();
        return res.json(admins);
    } catch (err: any) {
        console.error("Erro ao listar admins:", err);
        return res.status(500).json({ erro: err.message });
    }
});

// PUT /admin/atualizar/:id - Atualizar admin
router.put("/atualizar/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, senha } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ erro: "ID inválido" });
        }

        const data: any = {};
        if (nome) data.nome = nome;
        if (email) data.email = email;
        if (senha) data.senha = senha;

        const admin = await service.atualizar(id, data);
        return res.json(admin);
    } catch (err: any) {
        console.error("Erro ao atualizar admin:", err);
        return res.status(400).json({ erro: err.message });
    }
});

// DELETE /admin/excluir/:id - Excluir admin
router.delete("/excluir/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ erro: "ID inválido" });
        }

        const result = await service.excluir(id);
        return res.json(result);
    } catch (err: any) {
        console.error("Erro ao excluir admin:", err);
        return res.status(400).json({ erro: err.message });
    }
});

export default router;