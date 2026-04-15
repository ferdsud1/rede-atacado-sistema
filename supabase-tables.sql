-- Script para criar todas as tabelas no Supabase
-- Execute este código no SQL Editor do Supabase

-- ==========================================
-- TABELA DE ADMIN (LOGIN)
-- ==========================================
CREATE TABLE IF NOT EXISTS admin (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABELA DE RECUPERAÇÃO DE SENHA
-- ==========================================
CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABELA DE CATEGORIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS categorias (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    cor TEXT DEFAULT '#ff6600',
    icone TEXT DEFAULT '🏷️',
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABELA DE SORTEIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS sorteios (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criador_id INTEGER,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABELA DE PARTICIPANTES DO SORTEIO
-- ==========================================
CREATE TABLE IF NOT EXISTS participantes_sorteio (
    id BIGSERIAL PRIMARY KEY,
    sorteio_id BIGINT NOT NULL REFERENCES sorteios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    criou_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- ==========================================
DROP INDEX IF EXISTS idx_categorias_ativo;
DROP INDEX IF EXISTS idx_sorteios_ativo;
DROP INDEX IF EXISTS idx_participantes_sorteio_id;

CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_sorteios_ativo ON sorteios(ativo);
CREATE INDEX IF NOT EXISTS idx_participantes_sorteio_id ON participantes_sorteio(sorteio_id);

-- ==========================================
-- CRIAR USUÁRIO ADMIN PADRÃO
-- ==========================================
-- INSERT INTO admin (nome, email, senha)
-- VALUES ('Administrador', 'admin@certoatacado.com', 'sua_senha_hash_aqui');