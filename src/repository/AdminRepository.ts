import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Admin } from "../entity/Admin";
import { CreateAdminDTO, UpdateAdminDTO, AdminResponseDTO } from "../entity/AdminDTO";

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

export class AdminRepository {

    async buscarPorEmail(email: string): Promise<Admin | null> {
        const { data, error } = await getSupabase()
            .from('admin')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) return null;
        return data;
    }

    async buscarPorId(id: number): Promise<Admin | null> {
        const { data, error } = await getSupabase()
            .from('admin')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async buscarTodos(): Promise<AdminResponseDTO[]> {
        const { data, error } = await getSupabase()
            .from('admin')
            .select('id, nome, email, criado_em')
            .order('nome', { ascending: true });
        
        if (error) throw new Error(error.message);
        return data || [];
    }

    async criar(admin: CreateAdminDTO): Promise<AdminResponseDTO> {
        const { data, error } = await getSupabase()
            .from('admin')
            .insert({
                nome: admin.nome,
                email: admin.email,
                senha: admin.senha
            })
            .select('id, nome, email, criado_em')
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async atualizar(id: number, admin: UpdateAdminDTO): Promise<AdminResponseDTO | null> {
        const updateData: any = {};
        
        if (admin.nome !== undefined) updateData.nome = admin.nome;
        if (admin.email !== undefined) updateData.email = admin.email;
        if (admin.senha !== undefined) updateData.senha = admin.senha;
        
        const { data, error } = await getSupabase()
            .from('admin')
            .update(updateData)
            .eq('id', id)
            .select('id, nome, email, criado_em')
            .single();
        
        if (error) throw new Error(error.message);
        return data;
    }

    async excluir(id: number): Promise<boolean> {
        const { error } = await getSupabase()
            .from('admin')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error(error.message);
        return true;
    }

    async criarTokenRecuperacao(adminId: number, token: string, expiracao: Date): Promise<void> {
        const { error } = await getSupabase()
            .from('recuperacao_senha')
            .insert({
                admin_id: adminId,
                token: token,
                expiracao: expiracao.toISOString(),
                usado: false
            });
        
        if (error) throw new Error(error.message);
    }

    async buscarTokenValido(token: string): Promise<{ admin_id: number; expiracao: Date; usado: boolean } | null> {
        const { data, error } = await getSupabase()
            .from('recuperacao_senha')
            .select('admin_id, expiracao, usado')
            .eq('token', token)
            .eq('usado', false)
            .gt('expiracao', new Date().toISOString())
            .single();
        
        if (error) return null;
        return data;
    }

    async marcarTokenComoUsado(token: string): Promise<void> {
        const { error } = await getSupabase()
            .from('recuperacao_senha')
            .update({ usado: true })
            .eq('token', token);
        
        if (error) throw new Error(error.message);
    }
}