export interface Encarte {
    id: number;
    titulo: string;
    imagem_url?: string;
    imagens?: string[];  // ✅ ADICIONE ISSO
    data_inicio: Date | string;
    data_fim: Date | string;
    ativo: boolean;
    categoria_id?: number | null;
    categoria_nome?: string;
    criado_em?: Date;
}

export interface CreateEncarteDTO {
    titulo: string;
    imagem_url?: string;
    imagens?: string[];  // ✅ ADICIONE ISSO
    data_inicio: Date | string;
    data_fim: Date | string;
    ativo?: boolean;
    categoria_id?: number | null;
}

export interface UpdateEncarteDTO {
    titulo?: string;
    imagem_url?: string;
    imagens?: string[];  // ✅ ADICIONE ISSO
    data_inicio?: Date | string;
    data_fim?: Date | string;
      imagem_base64?: string;
    ativo?: boolean;
    categoria_id?: number | null;
}

export interface EncarteResponseDTO {
    id: number;
    titulo: string;
    imagem_url?: string;
    imagens?: string[];  // ✅ ADICIONE ISSO
    data_inicio: Date;
    data_fim: Date;
    ativo: boolean;
    categoria_id?: number | null;
    categoria_nome?: string;
    criado_em?: Date;
}

export interface EncarteAtivoDTO {  // ✅ VERIFIQUE SE EXISTE
    id: number;
    titulo: string;
    imagem_url?: string;
    imagens?: string[];
    data_inicio: Date;
    data_fim: Date;
    categoria_id?: number | null;
    categoria_nome?: string;
}
