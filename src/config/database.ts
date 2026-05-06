import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL é OPCIONAL - só conecta se variáveis existirem
const dbVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const hasDbVars = dbVars.every(v => process.env[v]);

export const pool = hasDbVars ? new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}) : null;

if (pool) {
    pool.on('connect', () => {
        console.log('✅ Nova conexão estabelecida com o banco de dados');
    });

    pool.on('error', (err) => {
        console.error('❌ Erro inesperado no pool do banco de dados:', err);
    });
}

// Função para testar a conexão ao iniciar
export async function testConnection(): Promise<void> {
    if (!pool) {
        console.log('ℹ️ PostgreSQL não configurado - usando apenas Supabase');
        return;
    }
    try {
        const client = await pool.connect();
        console.log('🟢 Banco de dados conectado e pronto!');
        client.release();
    } catch (err:any) {
        console.error('🔴 Falha ao conectar no banco de dados:', err);
        throw err;
    }
}
