import app from "./app";
import dotenv from "dotenv";
import { pool, testConnection } from "./config/database";
import categoriaRoutes from "./routes/categoriaRoutes";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try {
        // 1. Testar conexão com o banco
        await testConnection();

        // 2. Registrar rotas de categorias
        app.use("/categorias", categoriaRoutes);

        // 3. Iniciar o servidor
        app.listen(PORT, () => {
            console.log('===========================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log('===========================================');
        });

    } catch (error) {
        console.error('❌ Falha ao iniciar o servidor:', error);
        pool.end();
        process.exit(1);
    }
}

// Iniciar o servidor
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recebido. Fechando servidor...');
    pool.end(() => {
        console.log('✅ Pool de conexões fechado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recebido (Ctrl+C). Fechando servidor...');
    pool.end(() => {
        console.log('✅ Pool de conexões fechado.');
        process.exit(0);
    });
});