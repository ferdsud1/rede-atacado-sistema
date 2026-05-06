import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Empresa, EmpresaResponseDTO } from "../entity/EmpresaDTO";

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

export class EmpresaRepository {

    // Buscar dados da empresa (primeiro registro), cria registro padrão se não existir
    async buscarDados(): Promise<EmpresaResponseDTO | null> {
        try {
            const { data, error } = await getSupabase()
                .from('empresa')
                .select('*')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                return data;
            }

            // Auto-criar registro padrão se a tabela estiver vazia
            const { data: insertData, error: insertError } = await getSupabase()
                .from('empresa')
                .insert({
                    nome: 'Certo Atacado',
                    endereco: 'Endereço não informado',
                    telefone: '',
                    instagram: '',
                    facebook: '',
                    whatsapp: ''
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            return insertData || null;
        } catch (error) {
            console.error('Erro ao buscar dados da empresa:', error);
            throw error;
        }
    }

    // Atualizar dados da empresa
    async atualizar(id: number, dados: Partial<Empresa>): Promise<EmpresaResponseDTO | null> {
        try {
            const updateData: any = {};
            
            if (dados.nome !== undefined) updateData.nome = dados.nome;
            if (dados.endereco !== undefined) updateData.endereco = dados.endereco;
            if (dados.telefone !== undefined) updateData.telefone = dados.telefone;
            if (dados.instagram !== undefined) updateData.instagram = dados.instagram;
            if (dados.facebook !== undefined) updateData.facebook = dados.facebook;
            if (dados.whatsapp !== undefined) updateData.whatsapp = dados.whatsapp;

            if (Object.keys(updateData).length === 0) {
                return await this.buscarDados();
            }

            const { data, error } = await getSupabase()
                .from('empresa')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data || null;
        } catch (error) {
            console.error('Erro ao atualizar dados da empresa:', error);
            throw error;
        }
    }
}
