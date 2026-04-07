// Para criar um novo admin (sem id e sem criado_em)
export interface CreateAdminDTO {
    nome: string;
    email: string;
    senha: string;
}

// Para atualizar um admin (todos opcionais)
export interface UpdateAdminDTO {
    nome?: string;
    email?: string;
    senha?: string;
}

// Para retornar na API (NUNCA retorne a senha!)
export interface AdminResponseDTO {
    id: number;
    nome: string;
    email: string;
    criado_em: Date;
}

// Para login (apenas email e senha)
export interface LoginDTO {
    email: string;
    senha: string;
}

// Para resposta de autenticação
export interface AuthResponseDTO {
    admin: AdminResponseDTO;
    token: string;
}