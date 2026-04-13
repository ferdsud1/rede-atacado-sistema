// src/entity/EncarteDTO.ts

export interface Encarte {
  id: number;
  titulo: string;
  imagem_url: string | null;
  imagens?: string[];
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_em: string;
  categoria_id: number | null;
  categorias?: {
    id: number;
    nome: string;
    descricao?: string;
    cor?: string;
    icone?: string;
  } | null;
}

export interface CreateEncarteDTO {
  titulo: string;
  imagem_url?: string;
  imagens?: string[];        // ← ADICIONAR
  data_inicio: string;
  data_fim: string;
  ativo?: boolean;
  categoria_id?: number;
}

export interface UpdateEncarteDTO {
  titulo?: string;
  imagem_url?: string;
  imagens?: string[];        // ← ADICIONAR
  data_inicio?: string;
  data_fim?: string;
  ativo?: boolean;
  categoria_id?: number;
}


export interface EncarteResponseDTO {
  id: number;
  titulo: string;
  imagem_url: string | null;
  imagens?: string[];
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_em: string;
  categoria_id: number | null;
  categoria?: {
    id: number;
    nome: string;
    descricao?: string;
    cor?: string;
    icone?: string;
  } | null;
}

export interface EncarteAtivoDTO {
  id: number;
  titulo: string;
  imagem_url: string | null;
  data_inicio: string;
  data_fim: string;
}
