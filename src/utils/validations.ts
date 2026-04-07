import { z } from 'zod';

// ==========================================
// ADMIN SCHEMAS
// ==========================================

export const createAdminSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(1, 'Senha é obrigatória'),
});

export const updateAdminSchema = z.object({
    nome: z.string().min(3).optional(),
    email: z.string().email().optional(),
    senha: z.string().min(6).optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

// ==========================================
// ENCARTE SCHEMAS - CORRIGIDO COM IMAGENS
// ==========================================

// Schema para criar encarte (suporta imagem_url OU imagens)
export const createEncarteSchema = z.object({
    titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    imagem_url: z.string().min(1, 'URL da imagem é obrigatória').optional(),
    imagens: z.array(z.string()).optional(),  // ✅ NOVO: Array de URLs
    data_inicio: z.string().transform((str) => new Date(str)),
    data_fim: z.string().transform((str) => new Date(str)),
    ativo: z.boolean().optional(),
    categoria_id: z.number().int().positive().nullable().optional(),
}).refine((data) => data.imagem_url || (data.imagens && data.imagens.length > 0), {
    message: "É obrigatório fornecer imagem_url OU imagens",
    path: ["imagem_url"],
});

// Schema para atualizar encarte
export const updateEncarteSchema = z.object({
    titulo: z.string().min(3).optional(),
    imagem_url: z.string().min(1).optional(),
    imagens: z.array(z.string()).optional(),  // ✅ NOVO: Array de URLs
    data_inicio: z.string().transform((str) => new Date(str)).optional(),
    data_fim: z.string().transform((str) => new Date(str)).optional(),
    ativo: z.boolean().optional(),
    categoria_id: z.number().int().positive().nullable().optional(),
});

// Tipos inferidos
export type CreateEncarteInput = z.infer<typeof createEncarteSchema>;
export type UpdateEncarteInput = z.infer<typeof updateEncarteSchema>;

// ==========================================
// SORTEIO SCHEMAS
// ==========================================

export const createSorteioSchema = z.object({
    titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    descricao: z.string().optional(),
    imagem_url: z.string().min(1, 'URL da imagem é obrigatória'),
    data_inicio: z.string().transform((str) => new Date(str)),
    data_fim: z.string().transform((str) => new Date(str)),
    ativo: z.boolean().optional(),
});

export const updateSorteioSchema = z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    imagem_url: z.string().min(1).optional(),
    data_inicio: z.string().transform((str) => new Date(str)).optional(),
    data_fim: z.string().transform((str) => new Date(str)).optional(),
    ativo: z.boolean().optional(),
});

export type CreateSorteioInput = z.infer<typeof createSorteioSchema>;
export type UpdateSorteioInput = z.infer<typeof updateSorteioSchema>;