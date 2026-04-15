import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
        );
    }
    return supabase;
}

import { CreateCategoriaDTO, UpdateCategoriaDTO, CategoriaResponseDTO } from "../entity/CategoriaDTO";

export class CategoriaRepository {

    async listarTodas(): Promise<CategoriaResponseDTO[]> {
        const { data, error } = await getSupabase()
            .from('categorias')
            .select('*')
            .order('ordem', { ascending: true })
            .order('nome', { ascending: true });
        
        if (error) throw new Error(error.message);
        return data || [];
    }

    async buscarPorId(id: number): Promise<CategoriaResponseDTO | null> {
        const { data, error } = await getSupabase()
            .from('categorias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async buscarPorNome(nome: string): Promise<CategoriaResponseDTO | null> {
        const { data, error } = await getSupabase()
            .from('categorias')
            .select('*')
            .ilike('nome', nome)
            .single();
        
        if (error) return null;
        return data;
    }

    async criar(categoria: CreateCategoriaDTO): Promise<CategoriaResponseDTO> {
        const { data, error } = await getSupabase()
            .from('categorias')
            .insert({
                nome: categoria.nome,
                descricao: categoria.descricao || null,
                cor: categoria.cor || '#ff6600',
                icone: categoria.icone || '🏷️',
                ativo: categoria.ativo ?? true,
                ordem: categoria.ordem ?? 0
            })
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async atualizar(id: number, categoria: UpdateCategoriaDTO): Promise<CategoriaResponseDTO | null> {
        const updateData: any = { atualizado_em: new Date().toISOString() };
        
        if (categoria.nome !== undefined) updateData.nome = categoria.nome;
        if (categoria.descricao !== undefined) updateData.descricao = categoria.descricao;
        if (categoria.cor !== undefined) updateData.cor = categoria.cor;
        if (categoria.icone !== undefined) updateData.icone = categoria.icone;
        if (categoria.ativo !== undefined) updateData.ativo = categoria.ativo;
        if (categoria.ordem !== undefined) updateData.ordem = categoria.ordem;

        const { data, error } = await getSupabase()
            .from('categorias')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async excluir(id: number): Promise<boolean> {
        const { error } = await getSupabase()
            .from('categorias')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error(error.message);
        return true;
    }
}