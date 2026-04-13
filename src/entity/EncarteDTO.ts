// src/dtos/EncarteDTO.ts

export interface Encarte {
  id: number;
  titulo: string;
  imagem_url: string | null;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_em: string;
  categoria_id: number | null;
}

export interface CreateEncarteDTO {
  titulo: string;
  imagem_url?: string | null;
  data_inicio: string;
  data_fim: string;
  ativo?: boolean;
  categoria_id?: number | null;
}

export interface UpdateEncarteDTO {
  titulo?: string;
  imagem_url?: string | null;
  data_inicio?: string;
  data_fim?: string;
  ativo?: boolean;
  categoria_id?: number | null;
}

export interface EncarteResponseDTO {
  id: number;
  titulo: string;
  imagem_url: string | null;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_em: string;
  categoria_id: number | null;
  categoria?: {
    id: number;
    nome: string;
  } | null;
}

export interface EncarteAtivoDTO {
  id: number;
  titulo: string;
  imagem_url: string | null;
  data_inicio: string;
  data_fim: string;
}
