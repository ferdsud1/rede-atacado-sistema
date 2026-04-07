export interface Sorteio {
    id: number;
    titulo: string;
    descricao: string;
    imagem_url: string;
    data_inicio: Date;
    data_fim: Date;
    ativo: boolean;
    criado_em: Date;
}

export interface CreateSorteioDTO {
    titulo: string;
    descricao?: string;
    imagem_url: string;
    data_inicio: Date;
    data_fim: Date;
    ativo?: boolean;
}

export interface UpdateSorteioDTO {
    titulo?: string;
    descricao?: string;
    imagem_url?: string;
    data_inicio?: Date;
    data_fim?: Date;
    ativo?: boolean;
}

export interface SorteioResponseDTO {
    id: number;
    titulo: string;
    descricao: string;
    imagem_url: string;
    data_inicio: Date;
    data_fim: Date;
    ativo: boolean;
    criado_em: Date;
}