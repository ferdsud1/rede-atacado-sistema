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
  imagens: string[] | null;
  categorias?: {
    id: number;
    nome: string;
    cor: string | null;
    icone: string | null;
  };
}

export interface CreateEncarteDTO {
  titulo: string;
  data_inicio: string;
  data_fim: string;
  ativo?: boolean;
  categoria_id?: number | null;
}

export interface UpdateEncarteDTO {
  titulo?: string;
  data_inicio?: string;
  data_fim?: string;
  ativo?: boolean;
  categoria_id?: number | null;
}
