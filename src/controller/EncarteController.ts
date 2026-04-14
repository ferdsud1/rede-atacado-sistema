// src/controller/EncarteController.ts
import { Request, Response } from 'express';
import { EncarteService } from '../service/EncarteService';
import { CreateEncarteDTO, UpdateEncarteDTO } from '../entity/EncarteDTO';
import { AppError } from '../utils/AppError';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../config/logger';

export class EncarteController {
  private service: EncarteService;

  constructor() {
    this.service = new EncarteService();
  }

  // ✅ CRIAR COM MÚLTIPLAS IMAGENS
  criar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dados: CreateEncarteDTO = {
        titulo: req.body.titulo,
        data_inicio: req.body.data_inicio,
        data_fim: req.body.data_fim,
        ativo: req.body.ativo !== undefined ? req.body.ativo === 'true' : undefined,
        categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : undefined
      };

      if (dados.data_inicio && dados.data_fim) {
        if (new Date(dados.data_fim) < new Date(dados.data_inicio)) {
          throw new AppError(
            'Data de fim não pode ser anterior à data de início',
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // ✅ CORREÇÃO: usa req.files (array) ao invés de req.file (singular)
      const arquivos = req.files as Express.Multer.File[];

      if (!arquivos || arquivos.length === 0) {
        throw new AppError('Pelo menos uma imagem é obrigatória', StatusCodes.BAD_REQUEST);
      }

      // ✅ Chama o método que suporta múltiplas imagens
      const encarte = await this.service.criarComImagens(dados, arquivos);

      return res.status(StatusCodes.CREATED).json({
        sucesso: true,
        mensagem: 'Encarte criado com sucesso',
        dados: encarte
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  listar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        ativo,
        categoria_id,
        pagina = '1',
        limite = '10'
      } = req.query;

      const filtros = {
        ativo: ativo !== undefined ? ativo === 'true' : undefined,
        categoria_id: categoria_id ? parseInt(categoria_id as string) : undefined,
        pagina: parseInt(pagina as string),
        limite: parseInt(limite as string)
      };

      const resultado = await this.service.buscarTodos(filtros);

      return res.json({
        sucesso: true,
        dados: resultado.data,
        paginacao: {
          pagina: filtros.pagina,
          limite: filtros.limite,
          total: resultado.total,
          totalPaginas: Math.ceil(resultado.total / filtros.limite)
        }
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  listarAtivos = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { categoria_id } = req.query;

      const encartes = await this.service.listarAtivos(
        categoria_id ? parseInt(categoria_id as string) : undefined
      );

      return res.json({
        sucesso: true,
        dados: encartes,
        total: encartes.length
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  listarFuturos = async (req: Request, res: Response): Promise<Response> => {
    try {
      const encartes = await this.service.listarFuturos();

      return res.json({
        sucesso: true,
        dados: encartes,
        total: encartes.length
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  buscarPorId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new AppError('ID inválido', StatusCodes.BAD_REQUEST);
      }

      const encarte = await this.service.buscarPorId(id);

      return res.json({
        sucesso: true,
        dados: encarte
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  // ✅ ATUALIZAR COM MÚLTIPLAS IMAGENS
  atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new AppError('ID inválido', StatusCodes.BAD_REQUEST);
      }

      const dados: UpdateEncarteDTO = {
        titulo: req.body.titulo,
        data_inicio: req.body.data_inicio,
        data_fim: req.body.data_fim,
        ativo: req.body.ativo !== undefined ? req.body.ativo === 'true' : undefined,
        categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : undefined
      };

      if (dados.data_inicio && dados.data_fim) {
        if (new Date(dados.data_fim) < new Date(dados.data_inicio)) {
          throw new AppError(
            'Data de fim não pode ser anterior à data de início',
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // ✅ CORREÇÃO: usa req.files (array) ao invés de req.file (singular)
      const arquivos = req.files as Express.Multer.File[];

      // ✅ Chama o método atualizar que agora aceita array de arquivos
      const encarte = await this.service.atualizar(id, dados, arquivos);

      return res.json({
        sucesso: true,
        mensagem: 'Encarte atualizado com sucesso',
        dados: encarte
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  atualizarStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new AppError('ID inválido', StatusCodes.BAD_REQUEST);
      }

      const { ativo } = req.body;

      if (ativo === undefined) {
        throw new AppError('Campo "ativo" é obrigatório', StatusCodes.BAD_REQUEST);
      }

      const encarte = await this.service.atualizarStatus(id, ativo === true || ativo === 'true');

      return res.json({
        sucesso: true,
        mensagem: 'Status atualizado com sucesso',
        dados: encarte
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new AppError('ID inválido', StatusCodes.BAD_REQUEST);
      }

      await this.service.deletar(id);

      return res.json({
        sucesso: true,
        mensagem: 'Encarte deletado com sucesso'
      });
    } catch (error) {
      return this.handleErro(error, res);
    }
  };

  private handleErro(error: unknown, res: Response): Response {
    logger.error('Erro no EncarteController:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        sucesso: false,
        erro: error.message,
        codigo: error.code
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      sucesso: false,
      erro: 'Erro interno ao processar solicitação',
      detalhes: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
