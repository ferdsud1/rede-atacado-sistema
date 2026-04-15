import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateSorteioDTO, UpdateSorteioDTO, SorteioResponseDTO, Sorteio } from "../entity/SorteioDTO";

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

export class SorteioRepository {

    async listarAtivos(): Promise<SorteioResponseDTO[]> {
        const hoje = new Date().toISOString().split('T')[0];
        const { data, error } = await getSupabase()
            .from('sorteios')
            .select('id, titulo, descricao, imagem_url, data_inicio, data_fim, ativo')
            .eq('ativo', true)
            .gte('data_fim', hoje)
            .order('data_inicio', { ascending: false });
        
        if (error) throw new Error(error.message);
        return data || [];
    }

    async listarTodos(): Promise<Sorteio[]> {
        const { data, error } = await getSupabase()
            .from('sorteios')
            .select('id, titulo, descricao, imagem_url, data_inicio, data_fim, ativo')
            .order('data_inicio', { ascending: false });
        
        if (error) throw new Error(error.message);
        return data || [];
    }

    async buscarPorId(id: number): Promise<SorteioResponseDTO | null> {
        const { data, error } = await getSupabase()
            .from('sorteios')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async criar(sorteio: CreateSorteioDTO): Promise<SorteioResponseDTO> {
        const { data, error } = await getSupabase()
            .from('sorteios')
            .insert({
                titulo: sorteio.titulo,
                descricao: sorteio.descricao || null,
                imagem_url: sorteio.imagem_url,
                data_inicio: sorteio.data_inicio,
                data_fim: sorteio.data_fim,
                ativo: sorteio.ativo ?? true
            })
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async atualizar(id: number, sorteio: UpdateSorteioDTO): Promise<SorteioResponseDTO | null> {
        const updateData: any = { atualizado_em: new Date().toISOString() };
        
        if (sorteio.titulo !== undefined) updateData.titulo = sorteio.titulo;
        if (sorteio.descricao !== undefined) updateData.descricao = sorteio.descricao;
        if (sorteio.imagem_url !== undefined) updateData.imagem_url = sorteio.imagem_url;
        if (sorteio.data_inicio !== undefined) updateData.data_inicio = sorteio.data_inicio;
        if (sorteio.data_fim !== undefined) updateData.data_fim = sorteio.data_fim;
        if (sorteio.ativo !== undefined) updateData.ativo = sorteio.ativo;

        const { data, error } = await getSupabase()
            .from('sorteios')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async excluir(id: number): Promise<boolean> {
        // Excluir participantes primeiro
        await getSupabase()
            .from('participantes_sorteio')
            .delete()
            .eq('sorteio_id', id);
        
        const { error } = await getSupabase()
            .from('sorteios')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error(error.message);
        return true;
    }

    // ==========================================
    // PARTICIPANTES
    // ==========================================

    async adicionarParticipante(sorteioId: number, nome: string, telefone: string | null): Promise<any> {
        const { data, error } = await getSupabase()
            .from('participantes_sorteio')
            .insert({
                sorteio_id: sorteioId,
                nome: nome,
                telefone: telefone
            })
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async listarParticipantes(sorteioId: number): Promise<any[]> {
        const { data, error } = await getSupabase()
            .from('participantes_sorteio')
            .select('*')
            .eq('sorteio_id', sorteioId)
            .order('criou_em', { ascending: true });
        
        if (error) throw new Error(error.message);
        return data || [];
    }

    async contarParticipantes(sorteioId: number): Promise<number> {
        const { count, error } = await getSupabase()
            .from('participantes_sorteio')
            .select('*', { count: 'exact', head: true })
            .eq('sorteio_id', sorteioId);
        
        if (error) throw new Error(error.message);
        return count || 0;
    }

    async buscarParticipanteAleatorio(sorteioId: number): Promise<any | null> {
        const { data, error } = await getSupabase()
            .from('participantes_sorteio')
            .select('*')
            .eq('sorteio_id', sorteioId);
        
        if (error || !data || data.length === 0) return null;
        
        // Random em memória (Supabase não tem RANDOM())
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex];
    }

    async verificarParticipacao(sorteioId: number, nome: string, telefone: string | null): Promise<boolean> {
        let query = getSupabase()
            .from('participantes_sorteio')
            .select('id')
            .eq('sorteio_id', sorteioId)
            .ilike('nome', nome);
        
        if (telefone) {
            query = query.eq('telefone', telefone);
        }
        
        const { data, error } = query.limit(1);
        
        if (error) return false;
        return data && data.length > 0;
    }
}
