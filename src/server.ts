import app from "./app";
import dotenv from "dotenv";
import { pool, testConnection } from "./config/database";

import categoriaRoutes from "./routes/categoriaRoutes";
import encarteRoutes from "./routes/encarteRoutes"; // ✅ ADICIONADO

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try {
        await testConnection();

        // ROTAS
        app.use("/categorias", categoriaRoutes);
        app.use("/encartes", encarteRoutes); // ✅ ESSENCIAL

        app.listen(PORT, () => {
            console.log("===========================================");
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log("===========================================");
        });

    } catch (error) {
        console.error("❌ Falha ao iniciar o servidor:", error);
        pool.end();
        process.exit(1);
    }
}

startServer();
