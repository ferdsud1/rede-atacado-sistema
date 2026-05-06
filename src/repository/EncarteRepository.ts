import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Encarte } from "../entity/Encarte";
import { CreateEncarteDTO, UpdateEncarteDTO, EncarteResponseDTO, EncarteAtivoDTO } from "../entity/EncarteDTO";

let supabase: SupabaseClient;

function getSupabase(): SupabaseClient {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('⚠️ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

export class EncarteRepository {

    // ==========================================
    // LEITURA - PÚBLICA (Site)
    // ==========================================

    // ✅ CORREÇÃO: JOIN com categorias para retornar nome, cor e ícone
    async listarAtivos(): Promise<EncarteAtivoDTO[]> {
        try {
            const { data, error } = await getSupabase()
                .from('encartes')
                .select('*, categorias(nome, cor, icone)')
                .eq('ativo', true)
                .lte('data_inicio', new Date().toISOString())
                .gte('data_fim', new Date().toISOString())
                .order('data_inicio', { ascending: false });
            
            if (error) throw error;
            
            // Transformar dados para formato correto
            return (data || []).map(e => ({
                id: e.id,
                titulo: e.titulo,
                imagem_url: e.imagem_url,
                imagens: e.imagens,
                data_inicio: e.data_inicio,
                data_fim: e.data_fim,
                ativo: e.ativo,
                categoria_id: e.categoria_id,
                categoria_nome: e.categorias?.nome,
                categoria_cor: e.categorias?.cor,
                categoria_icone: e.categorias?.icone
            }));
        } catch (error) {
            console.error('Erro ao listar encartes ativos:', error);
            throw error;
        }
    }

    async buscarPorId(id: number):Promise<EncarteResponseDTO | null> {
        try {
            const { data, error } = await getSupabase()
                .from('encartes')
                .select('*, categorias(nome, cor, icone)')
                .eq('id', id)
                .single();
            
            if (error) return null;
            
            return {
                ...data,
                categoria_nome: data.categorias?.nome,
                categoria_cor: data.categorias?.cor,
                categoria_icone: data.categorias?.icone
            };
        } catch (error) {
            console.error('Erro ao buscar encarte por ID:', error);
            throw error;
        }
    }

    // Listar TODOS os encartes (para o admin) - também com JOIN
    async listarTodos(): Promise<EncarteResponseDTO[]> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .select('*, categorias(nome, cor, icone)')
            .order('data_inicio', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(e => ({
            ...e,
            categoria_nome: e.categorias?.nome,
            categoria_cor: e.categorias?.cor,
            categoria_icone: e.categorias?.icone
        }));
    }

    // ==========================================
    // CRIAÇÃO
    // ==========================================

    async criar(encarte: CreateEncarteDTO): Promise<EncarteResponseDTO> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .insert({
                titulo: encarte.titulo,
                imagem_url: encarte.imagem_url || null,
                imagens: encarte.imagens || null,
                data_inicio: encarte.data_inicio,
                data_fim: encarte.data_fim,
                ativo: encarte.ativo ?? true,
                categoria_id: encarte.categoria_id || null
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // ==========================================
    // ATUALIZAÇÃO
    // ==========================================

    async atualizar(id: number, encarte: UpdateEncarteDTO): Promise<EncarteResponseDTO | null> {
        const updateData: any = {};
        
        if (encarte.titulo !== undefined) updateData.titulo = encarte.titulo;
        if (encarte.imagem_url !== undefined) updateData.imagem_url = encarte.imagem_url;
        if (encarte.imagens !== undefined) updateData.imagens = encarte.imagens;
        if (encarte.data_inicio !== undefined) updateData.data_inicio = encarte.data_inicio;
        if (encarte.data_fim !== undefined) updateData.data_fim = encarte.data_fim;
        if (encarte.ativo !== undefined) updateData.ativo = encarte.ativo;
        if (encarte.categoria_id !== undefined) updateData.categoria_id = encarte.categoria_id;

        if (Object.keys(updateData).length === 0) {
            return await this.buscarPorId(id);
        }

        const { data, error } = await getSupabase()
            .from('encartes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data || null;
    }

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    async excluir(id: number): Promise<boolean> {
        try {
            const { error } = await getSupabase()
                .from('encartes')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao excluir encarte:', error);
            throw error;
        }
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    async desativarExpirados(): Promise<number> {
        try {
            const { data, error } = await getSupabase()
                .from('encartes')
                .update({ ativo: false })
                .lt('data_fim', new Date().toISOString())
                .eq('ativo', true)
                .select();
            
            if (error) throw error;
            return data?.length || 0;
        } catch (error) {
            console.error('Erro ao desativar encartes expirados:', error);
            throw error;
        }
    }

    async buscarPorCategoria(categoriaId: number): Promise<any[]> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .select('*, categorias(nome, cor, icone)')
            .eq('categoria_id', categoriaId)
            .order('data_inicio', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(e => ({
            ...e,
            categoria_nome: e.categorias?.nome,
            categoria_cor: e.categorias?.cor,
            categoria_icone: e.categorias?.icone
        }));
    }

    async listarFuturos(): Promise<EncarteResponseDTO[]> {
        try {
            const { data, error } = await getSupabase()
                .from('encartes')
                .select('*, categorias(nome, cor, icone)')
                .gt('data_inicio', new Date().toISOString())
                .eq('ativo', true)
                .order('data_inicio', { ascending: true });
            
            if (error) throw error;
            
            return (data || []).map(e => ({
                ...e,
                categoria_nome: e.categorias?.nome,
                categoria_cor: e.categorias?.cor,
                categoria_icone: e.categorias?.icone
            }));
        } catch (error) {
            console.error('Erro ao listar encartes futuros:', error);
            throw error;
        }
    }
}
