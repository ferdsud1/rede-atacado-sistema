// src/services/EncarteService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Encarte, CreateEncarteDTO, UpdateEncarteDTO } from '../dtos/EncarteDTO';
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

  /**
   * Criar encarte com upload de imagem
   */
  async criar(data: CreateEncarteDTO, arquivo?: Express.Multer.File): Promise<Encarte> {
    try {
      let imagem_url = null;

      // Upload da imagem se existir
      if (arquivo) {
        imagem_url = await this.uploadImagem(arquivo, data.titulo);
      }

      // Inserir no banco
      const { data: encarte, error } = await this.supabase
        .from('encartes')
        .insert({
          titulo: data.titulo,
          imagem_url,
          data_inicio: data.data_inicio,
          data_fim: data_fim,
          ativo: data.ativo ?? true,
          categoria_id: data.categoria_id,
          criado_em: new Date().toISOString()
        })
        .select(`
          *,
          categorias (
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

  /**
   * Buscar todos os encartes
   */
  async buscarTodos(filtros?: {
    ativo?: boolean;
    categoria_id?: number;
    limite?: number;
    pagina?: number;
  }): Promise<{ data: Encarte[]; total: number }> {
    try {
      const { pagina = 1, limite = 10, ativo, categoria_id } = filtros || {};
      const inicio = (pagina - 1) * limite;
      const fim = inicio + limite - 1;

      let query = this.supabase
        .from('encartes')
        .select(`
          *,
          categorias (
            id,
            nome,
            cor,
            icone
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('criado_em', { ascending: false });

      // Paginação
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

  /**
   * Buscar encarte por ID
   */
  async buscarPorId(id: number): Promise<Encarte> {
    try {
      const { data, error } = await this.supabase
        .from('encartes')
        .select(`
          *,
          categorias (
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

  /**
   * Atualizar encarte
   */
  async atualizar(
    id: number,
    data: UpdateEncarteDTO,
    arquivo?: Express.Multer.File
  ): Promise<Encarte> {
    try {
      // Verificar se existe
      const encarteExistente = await this.buscarPorId(id);

      let imagem_url = encarteExistente.imagem_url;

      // Upload de nova imagem se existir
      if (arquivo) {
        // Deletar imagem antiga se existir
        if (encarteExistente.imagem_url) {
          await this.deletarImagem(encarteExistente.imagem_url);
        }
        imagem_url = await this.uploadImagem(arquivo, data.titulo || encarteExistente.titulo);
      }

      const updateData: any = {
        titulo: data.titulo,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        ativo: data.ativo,
        categoria_id: data.categoria_id
      };

      // Só atualizar imagem_url se mudou
      if (imagem_url !== encarteExistente.imagem_url) {
        updateData.imagem_url = imagem_url;
      }

      const { data: encarte, error } = await this.supabase
        .from('encartes')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categorias (
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

  /**
   * Deletar encarte
   */
  async deletar(id: number): Promise<void> {
    try {
      // Buscar encarte para deletar imagem
      const encarte = await this.buscarPorId(id);

      // Deletar imagem do storage
      if (encarte.imagem_url) {
        await this.deletarImagem(encarte.imagem_url);
      }

      // Deletar do banco
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

  /**
   * Atualizar status (ativo/inativo)
   */
  async atualizarStatus(id: number, ativo: boolean): Promise<Encarte> {
    try {
      const { data, error } = await this.supabase
        .from('encartes')
        .update({ ativo })
        .eq('id', id)
        .select(`
          *,
          categorias (
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

  /**
   * Buscar encartes ativos
   */
  async buscarAtivos(categoria_id?: number): Promise<Encarte[]> {
    try {
      let query = this.supabase
        .from('encartes')
        .select(`
          *,
          categorias (
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

  /**
   * Upload de imagem para Supabase Storage
   */
  private async uploadImagem(arquivo: Express.Multer.File, titulo: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const nomeArquivo = `${timestamp}-${titulo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()}-${arquivo.originalname}`;

      const { data, error } = await this.supabase
        .storage
        .from(this.STORAGE_BUCKET)
        .upload(nomeArquivo, arquivo.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: arquivo.mimetype
        });

      if (error) {
        throw new AppError(
          `Erro ao fazer upload da imagem: ${error.message}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      // Obter URL pública
      const { data: { publicUrl } } = this.supabase
        .storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Erro ao fazer upload da imagem',
        StatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error
      );
    }
  }

  /**
   * Deletar imagem do storage
   */
  private async deletarImagem(imagemUrl: string): Promise<void> {
    try {
      // Extrair caminho do arquivo da URL
      const caminho = imagemUrl.split('/').pop();
      
      if (caminho) {
        await this.supabase
          .storage
          .from(this.STORAGE_BUCKET)
          .remove([caminho]);
      }
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      // Não lançar erro para não falhar a operação principal
    }
  }
}
