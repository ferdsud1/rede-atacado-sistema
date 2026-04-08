import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Validação das variáveis de ambiente
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`❌ Variável de ambiente ausente: ${envVar}`);
    }
}

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,                    // Máximo de conexões simultâneas
    idleTimeoutMillis: 30000,   // Fecha conexões ociosas após 30s
    connectionTimeoutMillis: 2000, // Timeout de conexão (2s)
});

// Listener de sucesso na conexão
pool.on('connect', () => {
    console.log('✅ Nova conexão estabelecida com o banco de dados');
});

// Listener de erros
pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool do banco de dados:', err);
    process.exit(-1); // Encerra o processo para evitar comportamento estranho
});

// Função para testar a conexão ao iniciar
export async function testConnection(): Promise<void> {
    try {
        const client = await pool.connect();
        console.log('🟢 Banco de dados conectado e pronto!');
        client.release();
    } catch (err:any) {
        console.error('🔴 Falha ao conectar no banco de dados:', err);
        throw err;
    }
}
