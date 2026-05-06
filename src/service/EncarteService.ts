import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { Encarte, CreateEncarteDTO, UpdateEncarteDTO } from '../entity/EncarteDTO';
import { AppError } from '../utils/AppError';
import { StatusCodes } from 'http-status-codes';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function getSupabase(): SupabaseClient {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
    );
}

export class EncarteService {
    private readonly FOLDER = 'encartes';

    async criar(data: CreateEncarteDTO, arquivo?: Express.Multer.File): Promise<Encarte> {
        let imagem_url = null;
        if (arquivo) {
            imagem_url = await this.uploadImagemCloudinary(arquivo, data.titulo);
        }

        const { data: encarte, error } = await getSupabase()
            .from('encartes')
            .insert({
                titulo: data.titulo,
                imagem_url,
                data_inicio: data.data_inicio,
                data_fim: data.data_fim,
                ativo: data.ativo ?? true,
                categoria_id: data.categoria_id,
                criado_em: new Date().toISOString()
            })
            .select('*, categorias!left(id, nome, cor, icone)')
            .single();

        if (error) throw new AppError(`Erro ao criar encarte: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        return encarte;
    }

    async buscarTodos(filtros?: { ativo?: boolean; categoria_id?: number; limite?: number; pagina?: number }): Promise<{ data: Encarte[]; total: number }> {
        const { pagina = 1, limite = 100, ativo, categoria_id } = filtros || {};
        const inicio = (pagina - 1) * limite;
        const fim = inicio + limite - 1;

        let query = getSupabase()
            .from('encartes')
            .select('*, categorias!left(id, nome, cor, icone)', { count: 'exact' });

        if (ativo !== undefined) query = query.eq('ativo', ativo);
        if (categoria_id) query = query.eq('categoria_id', categoria_id);
        query = query.order('criado_em', { ascending: false });

        const { data, error, count } = await query.range(inicio, fim);
        if (error) throw new AppError(`Erro ao buscar encartes: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);

        return { data: data || [], total: count || 0 };
    }

    async buscarPorId(id: number): Promise<Encarte> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .select('*, categorias!left(id, nome, descricao, cor, icone)')
            .eq('id', id)
            .single();

        if (error || !data) throw new AppError('Encarte não encontrado', StatusCodes.NOT_FOUND);
        return data;
    }

    async atualizar(id: number, data: UpdateEncarteDTO, arquivos?: Express.Multer.File[]): Promise<Encarte> {
        const encarteExistente = await this.buscarPorId(id);

        let imagem_url = encarteExistente.imagem_url;
        let imagens = encarteExistente.imagens || [];

        if (arquivos && arquivos.length > 0) {
            // Deleta imagens antigas do Cloudinary
            if (encarteExistente.imagem_url) await this.deletarImagemCloudinary(encarteExistente.imagem_url);
            for (const img of imagens) await this.deletarImagemCloudinary(img);

            // Faz upload das novas
            const imagemUrls: string[] = [];
            for (const arquivo of arquivos) {
                const url = await this.uploadImagemCloudinary(arquivo, data.titulo || encarteExistente.titulo);
                imagemUrls.push(url);
            }
            imagem_url = imagemUrls[0] || null;
            imagens = imagemUrls;
        }

        const updateData: any = {};
        if (data.titulo !== undefined) updateData.titulo = data.titulo;
        if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio;
        if (data.data_fim !== undefined) updateData.data_fim = data.data_fim;
        if (data.ativo !== undefined) updateData.ativo = data.ativo;
        if (data.categoria_id !== undefined) updateData.categoria_id = data.categoria_id;
        if (imagem_url !== encarteExistente.imagem_url) updateData.imagem_url = imagem_url;
        if (imagens.length > 0) updateData.imagens = imagens;

        const { data: encarte, error } = await getSupabase()
            .from('encartes')
            .update(updateData)
            .eq('id', id)
            .select('*, categorias!left(id, nome, cor, icone)')
            .single();

        if (error) throw new AppError(`Erro ao atualizar encarte: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        return encarte;
    }

    async deletar(id: number): Promise<void> {
        const encarte = await this.buscarPorId(id);

        if (encarte.imagem_url) await this.deletarImagemCloudinary(encarte.imagem_url);
        for (const img of encarte.imagens || []) await this.deletarImagemCloudinary(img);

        const { error } = await getSupabase().from('encartes').delete().eq('id', id);
        if (error) throw new AppError(`Erro ao deletar encarte: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    async atualizarStatus(id: number, ativo: boolean): Promise<Encarte> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .update({ ativo })
            .eq('id', id)
            .select('*, categorias!left(id, nome, cor, icone)')
            .single();

        if (error || !data) throw new AppError('Encarte não encontrado', StatusCodes.NOT_FOUND);
        return data;
    }

    async listarAtivos(categoria_id?: number): Promise<Encarte[]> {
        let query = getSupabase()
            .from('encartes')
            .select('*, categorias!left(id, nome, cor, icone)')
            .eq('ativo', true)
            .lte('data_inicio', new Date().toISOString())
            .gte('data_fim', new Date().toISOString())
            .order('data_inicio', { ascending: false });

        if (categoria_id) query = query.eq('categoria_id', categoria_id);

        const { data, error } = await query;
        if (error) throw new AppError(`Erro ao buscar encartes ativos: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        return data || [];
    }

    async listarFuturos(): Promise<Encarte[]> {
        const { data, error } = await getSupabase()
            .from('encartes')
            .select('*, categorias!left(id, nome, cor, icone)')
            .eq('ativo', true)
            .gt('data_inicio', new Date().toISOString())
            .order('data_inicio', { ascending: true });

        if (error) throw new AppError(`Erro ao buscar encartes futuros: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        return data || [];
    }

    async criarComImagens(data: CreateEncarteDTO, arquivos: Express.Multer.File[]): Promise<Encarte> {
        console.log('📥 Criando encarte com imagens via Cloudinary:', data.titulo);

        // Upload em paralelo para melhorar velocidade
        const imagemUrls = await Promise.all(
            arquivos.map(arquivo => this.uploadImagemCloudinary(arquivo, data.titulo))
        );

        const insertData: any = {
            titulo: data.titulo,
            imagem_url: imagemUrls[0] || null,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim,
            ativo: data.ativo ?? true,
            categoria_id: data.categoria_id || null,
            imagens: imagemUrls,
            criado_em: new Date().toISOString()
        };

        const { data: encarte, error } = await getSupabase()
            .from('encartes')
            .insert(insertData)
            .select('*, categorias!left(id, nome, cor, icone)')
            .single();

        if (error) throw new AppError(`Erro ao criar encarte: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        return encarte;
    }

    // ==========================================
    // UPLOAD / DELETE CLOUDINARY
    // ==========================================

    private uploadImagemCloudinary(arquivo: Express.Multer.File, titulo: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const tituloSanitizado = titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const publicId = `${this.FOLDER}/${Date.now()}-${tituloSanitizado}`;

            cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    resource_type: 'image',
                    transformation: [
                        { width: 1920, height: 1920, crop: 'limit' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) return reject(new AppError(`Erro no upload: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR));
                    resolve(result!.secure_url);
                }
            ).end(arquivo.buffer);
        });
    }

    private async deletarImagemCloudinary(imagemUrl: string): Promise<void> {
        try {
            if (!imagemUrl || !imagemUrl.includes('cloudinary')) return;
            // Extrai o public_id da URL do Cloudinary
            const partes = imagemUrl.split('/');
            const uploadIndex = partes.indexOf('upload');
            if (uploadIndex === -1) return;
            // Remove versão (v123456) se presente
            const pathParts = partes.slice(uploadIndex + 1);
            if (pathParts[0] && pathParts[0].startsWith('v')) pathParts.shift();
            const publicIdComExtensao = pathParts.join('/');
            const publicId = publicIdComExtensao.replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Aviso: erro ao deletar imagem do Cloudinary:', error);
        }
    }
}
