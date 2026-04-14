// src/service/EncarteService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Encarte, CreateEncarteDTO, UpdateEncarteDTO } from '../entity/EncarteDTO';
import { AppError } from '../utils/AppError';
import { StatusCodes } from 'http-status-codes';

export class EncarteService {
  private supabase: SupabaseClient;
  private readonly STORAGE_BUCKET = 'encartes';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async criar(data: CreateEncarteDTO, arquivo?: Express.Multer.File): Promise<Encarte> {
    try {
      let imagem_url = null;

      if (arquivo) {
        imagem_url = await this.uploadImagem(arquivo, data.titulo);
      }

      const { data: encarte, error } = await this.supabase
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
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .single();

      if (error) {
        throw new AppError(
          `Erro ao criar encarte: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return encarte;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao criar encarte',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async buscarTodos(filtros?: {
    ativo?: boolean;
    categoria_id?: number;
    limite?: number;
    pagina?: number;
  }): Promise<{ data: Encarte[]; total: number }> {
    try {
      const { pagina = 1, limite = 100, ativo, categoria_id } = filtros || {};
      const inicio = (pagina - 1) * limite;
      const fim = inicio + limite - 1;

      let query = this.supabase
        .from('encartes')
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `, { count: 'exact' });

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      query = query.order('criado_em', { ascending: false });

      const { data, error, count } = await query.range(inicio, fim);

      if (error) {
        throw new AppError(
          `Erro ao buscar encartes: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao buscar encartes',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async buscarPorId(id: number): Promise<Encarte> {
    try {
      const { data, error } = await this.supabase
        .from('encartes')
        .select(`
          *,
          categorias!left (
            id,
            nome,
            descricao,
            cor,
            icone
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new AppError(
          `Erro ao buscar encarte: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (!data) {
        throw new AppError(
          'Encarte não encontrado',
          StatusCodes.NOT_FOUND
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao buscar encarte',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async atualizar(
    id: number,
    data: UpdateEncarteDTO,
    arquivos?: Express.Multer.File[]
  ): Promise<Encarte> {
    try {
      const encarteExistente = await this.buscarPorId(id);

      let imagem_url = encarteExistente.imagem_url;
      let imagens = encarteExistente.imagens || [];

      if (arquivos && arquivos.length > 0) {
        if (encarteExistente.imagem_url) {
          await this.deletarImagem(encarteExistente.imagem_url);
        }
        if (imagens.length > 0) {
          for (const img of imagens) {
            await this.deletarImagem(img);
          }
        }

        const imagemUrls: string[] = [];
        for (const arquivo of arquivos) {
          const url = await this.uploadImagem(arquivo, data.titulo || encarteExistente.titulo);
          imagemUrls.push(url);
        }

        imagem_url = imagemUrls[0] || null;
        imagens = imagemUrls;
      }

      const updateData: any = {
        titulo: data.titulo,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        ativo: data.ativo,
        categoria_id: data.categoria_id
      };

      if (imagem_url !== encarteExistente.imagem_url) {
        updateData.imagem_url = imagem_url;
      }
      if (imagens.length > 0) {
        updateData.imagens = imagens;
      }

      const { data: encarte, error } = await this.supabase
        .from('encartes')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .single();

      if (error) {
        throw new AppError(
          `Erro ao atualizar encarte: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return encarte;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao atualizar encarte',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async deletar(id: number): Promise<void> {
    try {
      const encarte = await this.buscarPorId(id);

      if (encarte.imagem_url) {
        await this.deletarImagem(encarte.imagem_url);
      }
      if (encarte.imagens && encarte.imagens.length > 0) {
        for (const img of encarte.imagens) {
          await this.deletarImagem(img);
        }
      }

      const { error } = await this.supabase
        .from('encartes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(
          `Erro ao deletar encarte: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao deletar encarte',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async atualizarStatus(id: number, ativo: boolean): Promise<Encarte> {
    try {
      const { data, error } = await this.supabase
        .from('encartes')
        .update({ ativo })
        .eq('id', id)
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .single();

      if (error) {
        throw new AppError(
          `Erro ao atualizar status: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (!data) {
        throw new AppError('Encarte não encontrado', StatusCodes.NOT_FOUND);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao atualizar status',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async listarAtivos(categoria_id?: number): Promise<Encarte[]> {
    try {
      let query = this.supabase
        .from('encartes')
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .eq('ativo', true)
        .lte('data_inicio', new Date().toISOString())
        .gte('data_fim', new Date().toISOString())
        .order('data_inicio', { ascending: false });

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      const { data, error } = await query;

      if (error) {
        throw new AppError(
          `Erro ao buscar encartes ativos: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao buscar encartes ativos',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async listarFuturos(): Promise<Encarte[]> {
    try {
      const { data, error } = await this.supabase
        .from('encartes')
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .eq('ativo', true)
        .gt('data_inicio', new Date().toISOString())
        .order('data_inicio', { ascending: true });

      if (error) {
        throw new AppError(
          `Erro ao buscar encartes futuros: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao buscar encartes futuros',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  async criarComImagens(data: CreateEncarteDTO, arquivos: Express.Multer.File[]): Promise<Encarte> {
    try {
      console.log('📥 Criando encarte:', data);
      
      const imagemUrls: string[] = [];

      for (const arquivo of arquivos) {
        const url = await this.uploadImagem(arquivo, data.titulo);
        imagemUrls.push(url);
      }

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

      console.log('📤 Dados para insert:', insertData);

      const { data: encarte, error } = await this.supabase
        .from('encartes')
        .insert(insertData)
        .select(`
          *,
          categorias!left (
            id,
            nome,
            cor,
            icone
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao criar:', error);
        throw new AppError(
          `Erro ao criar encarte: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      console.log('✅ Encarte criado:', encarte);
      return encarte;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao criar encarte com imagens',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  private async uploadImagem(arquivo: Express.Multer.File, titulo: string): Promise<string> {
    const tituloSanitizado = titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const nomeArquivo = `${Date.now()}-${tituloSanitizado}`;
    const caminho = `${nomeArquivo}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(caminho, arquivo.buffer, {
        contentType: arquivo.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new AppError(
        `Erro ao fazer upload: ${uploadError.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const { data } = this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  private async deletarImagem(imagemUrl: string): Promise<void> {
    try {
      const partes = imagemUrl.split('/');
      const nomeArquivo = partes[partes.length - 1];

      await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([nomeArquivo]);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  }
}
