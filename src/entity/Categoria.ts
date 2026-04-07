export interface Categoria {
    id: number;
    nome: string;
    descricao: string;
    ativo: boolean;
    ordem: number;
    cor: string;
    icone: string;
    criado_em: Date;
}