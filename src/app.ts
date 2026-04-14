import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
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

// Helmet: Adiciona headers de segurança HTTP (com CSP habilitado)
app.use(helmet());

// CORS: Restringir origens permitidas
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requisições sem origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting: Previne brute-force e DDoS
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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
// ARQUIVOS ESTÁTICOS
// ==========================================

app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ==========================================
// ROTAS
// ==========================================

app.get('/health', (_req, res) => {  // ← _req (não usado)
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/admin", adminRoutes);
app.use("/contato", contatoRoutes);
app.use("/encartes", encarteRoutes);
app.use("/categorias", categoriaRoutes); 
app.use("/empresa", empresaRoutes);
app.use("/sorteios", sorteioRoutes);

// ==========================================
// TRATAMENTO DE ERROS GLOBAL
// ==========================================

// Rota 404 - usa apenas req e res
app.use((req, res, _next) => {  // ← _next (não usado)
    res.status(404).json({
        error: 'Não encontrado',
        message: `A rota ${req.method} ${req.path} não existe.`,
    });
});

// Error handler global - usa err e res
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Erro não tratado:', err);

    const isProduction = process.env.NODE_ENV === 'production';

    res.status(err.status || 500).json({
        error: err.name || 'Erro interno',
        message: isProduction
            ? 'Algo deu errado no servidor.'
            : (err.message || 'Algo deu errado no servidor.'),
    });
});

export default app;
