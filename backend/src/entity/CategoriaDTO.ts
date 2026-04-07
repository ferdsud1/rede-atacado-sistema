export interface Categoria {
    id: number;
    nome: string;
    descricao?: string;
    cor?: string;
    icone?: string;
    ativo?: boolean;
    ordem?: number;
    criado_em?: Date;
}

export interface CreateCategoriaDTO {
    nome: string;
    descricao?: string;
    cor?: string;
    icone?: string;
    ativo?: boolean;
    ordem?: number;
}

export interface UpdateCategoriaDTO {
    nome?: string;
    descricao?: string;
    cor?: string;
    icone?: string;
    ativo?: boolean;
    ordem?: number;
}

export interface CategoriaResponseDTO {
    id: number;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    ativo: boolean;
    ordem: number;
    criado_em: Date;
}