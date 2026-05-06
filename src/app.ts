import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import adminRoutes from "./routes/adminRoutes";
import encarteRoutes from "./routes/encarteRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import empresaRoutes from "./routes/empresaRoutes";
import sorteioRoutes from "./routes/sorteioRoutes";
import contatoRoutes from "./routes/contatoRoutes";

const app = express();

// ==========================================
// SEGURANÇA
// ==========================================

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: '⚠️ Muitas requisições. Tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ==========================================
// PARSERS
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// ROTAS
// ==========================================

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - verificar admin por email
app.get('/debug/admin/:email', async (req, res) => {
    try {
        const { AdminRepository } = await import("./repository/AdminRepository");
        const repo = new AdminRepository();
        const admin = await repo.buscarPorEmail(req.params.email);
        if (admin) {
            res.json({ found: true, email: admin.email, id: admin.id });
        } else {
            res.json({ found: false, email: req.params.email });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.use("/admin", adminRoutes);
app.use("/contato", contatoRoutes);
app.use("/encartes", encarteRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/empresa", empresaRoutes);
app.use("/sorteios", sorteioRoutes);

// ==========================================
// ERROS
// ==========================================

app.use((req, res, _next) => {
    res.status(404).json({
        error: 'Não encontrado',
        message: `A rota ${req.method} ${req.path} não existe.`,
    });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Erro não tratado:', err);
    res.status(err.status || err.statusCode || 500).json({
        error: err.name || 'Erro interno',
        message: err.message || 'Algo deu errado no servidor.',
    });
});

export default app;
