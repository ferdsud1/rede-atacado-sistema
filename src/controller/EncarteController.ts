// src/controller/EncarteController.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { EncarteService } from "../service/EncarteService";
import { 
    CreateEncarteDTO, 
    UpdateEncarteDTO, 
    CreateEncarteDTOSchema,
    UpdateEncarteDTOSchema 
} from "../dto/EncarteDTO";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";

const service = new EncarteService();

/**
 * Controller responsável pelas operações de Encarte
 */
export class EncarteController {

    // ========================================================================
    // HELPERS PRIVADOS
    // ========================================================================

    /**
     * Handler padrão para tratamento de erros
     */
    private handleError(res: Response, error: unknown, context: string): Response {
        logger.error(`[${context}]`, { error });

        // Erro conhecido da aplicação
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ 
                error: error.message,
                code: error.code 
            });
        }

        // Erro de validação do Zod/ZodError
        if (error instanceof Error && error.name === "ZodError") {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                error: "Dados inválidos",
                details: (error as any).errors 
            });
        }

        // Erro genérico - servidor interno
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            error: "Erro interno ao processar solicitação",
            ...(process.env.NODE_ENV === "development" && { stack: (error as Error).stack })
        });
    }

    /**
     * Parse seguro de boolean vindo do req.body (form-data ou JSON)
     */
    private parseBoolean(value: unknown): boolean {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
            return ["true", "1", "sim", "yes"].includes(value.toLowerCase());
        }
        return false;
    }

    /**
     * Parse seguro de número inteiro nullable
     */
    private parseNullableInt(value: unknown): number | null {
        if (value === null || value === undefined || value === "") return null;
        const parsed = parseInt(String(value), 10);
        return isNaN(parsed) ? null : parsed;
    }

    // ========================================================================
    // CREATE
    // ========================================================================

    /**
     * POST /encartes
     * Cria encarte com imagem em base64 ou sem imagem
     */
    async criar(req: Request, res: Response): Promise<Response> {
        try {
            // Validação dos dados de entrada
            const validatedData = CreateEncarteDTOSchema.parse(req.body);

            let encarte;

            if (validatedData.imagem_base64) {
                // Cria com imagem base64
                encarte = await service.criarComBase64(
                    {
                        titulo: validatedData.titulo,
                        data_inicio: validatedData.data_inicio,
                        data_fim: validatedData.data_fim,
                        ativo: validatedData.ativo ?? true,
                        categoria_id: validatedData.categoria_id
                    },
                    validatedData.imagem_base64
                );
            } else {
                // Cria sem imagem
                encarte = await service.criar({
                    titulo: validatedData.titulo,
                    data_inicio: validatedData.data_inicio,
                    data_fim: validatedData.data_fim,
                    ativo: validatedData.ativo ?? true,
                    categoria_id: validatedData.categoria_id
                });
            }

            return res.status(StatusCodes.CREATED).json(encarte);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.criar");
        }
    }

    /**
     * POST /encartes/upload
     * Cria encarte com upload de arquivo (multipart/form-data)
     */
    async criarComUpload(req: Request, res: Response): Promise<Response> {
        try {
            // Validação do arquivo
            if (!req.file) {
                throw new AppError(
                    "Nenhuma imagem enviada", 
                    StatusCodes.BAD_REQUEST, 
                    "MISSING_FILE"
                );
            }

            // Validação e parse dos campos do form
            const titulo = req.body.titulo?.toString().trim();
            const data_inicio = req.body.data_inicio;
            const data_fim = req.body.data_fim;
            const ativo = this.parseBoolean(req.body.ativo);
            const categoria_id = this.parseNullableInt(req.body.categoria_id);

            // Validação manual mínima (pode usar Zod para form-data também)
            if (!titulo || !data_inicio || !data_fim) {
                throw new AppError(
                    "Campos obrigatórios faltando: titulo, data_inicio, data_fim",
                    StatusCodes.BAD_REQUEST,
                    "MISSING_FIELDS"
                );
            }

            const data: Omit<CreateEncarteDTO, "imagem_url"> = {
                titulo,
                data_inicio: new Date(data_inicio),
                data_fim: new Date(data_fim),
                ativo,
                categoria_id
            };

            const encarte = await service.criarComImagem(data, req.file);
            return res.status(StatusCodes.CREATED).json(encarte);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.criarComUpload");
        }
    }

    // ========================================================================
    // READ
    // ========================================================================

    /**
     * GET /encartes/ativos
     * Lista apenas encartes ativos
     */
    async listarAtivos(req: Request, res: Response): Promise<Response> {
        try {
            const encartes = await service.listarAtivos();
            return res.json(encartes);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.listarAtivos");
        }
    }

    /**
     * GET /encartes
     * Lista todos os encartes (com filtro opcional)
     */
    async listarTodos(req: Request, res: Response): Promise<Response> {
        try {
            const { ativo, categoria_id, search } = req.query;
            
            const encartes = await service.listarTodos({
                ativo: ativo !== undefined ? this.parseBoolean(ativo) : undefined,
                categoria_id: this.parseNullableInt(categoria_id),
                search: search?.toString()
            });
            
            return res.json(encartes);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.listarTodos");
        }
    }

    /**
     * GET /encartes/:id
     * Busca encarte por ID
     */
    async buscarPorId(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            
            if (isNaN(id)) {
                throw new AppError("ID inválido", StatusCodes.BAD_REQUEST, "INVALID_ID");
            }

            const encarte = await service.buscarPorId(id);
            
            if (!encarte) {
                throw new AppError(
                    "Encarte não encontrado", 
                    StatusCodes.NOT_FOUND, 
                    "ENCARTE_NOT_FOUND"
                );
            }
            
            return res.json(encarte);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.buscarPorId");
        }
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    /**
     * PUT /encartes/:id
     * Atualiza encarte existente
     */
    async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            
            if (isNaN(id)) {
                throw new AppError("ID inválido", StatusCodes.BAD_REQUEST, "INVALID_ID");
            }

            // Validação parcial (apenas campos enviados)
            const validatedData = UpdateEncarteDTOSchema.partial().parse(req.body);

            const encarte = await service.atualizar(id, validatedData);
            return res.json(encarte);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.atualizar");
        }
    }

    /**
     * PATCH /encartes/:id/status
     * Altera apenas o status ativo/inativo
     */
    async alterarStatus(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            
            if (isNaN(id)) {
                throw new AppError("ID inválido", StatusCodes.BAD_REQUEST, "INVALID_ID");
            }

            const { ativo } = req.body;
            
            if (ativo === undefined) {
                throw new AppError(
                    "Campo 'ativo' é obrigatório", 
                    StatusCodes.BAD_REQUEST, 
                    "MISSING_FIELD"
                );
            }

            const encarte = await service.alterarStatus(id, this.parseBoolean(ativo));
            return res.json(encarte);

        } catch (error) {
            return this.handleError(res, error, "EncarteController.alterarStatus");
        }
    }

    // ========================================================================
    // DELETE
    // ========================================================================

    /**
     * DELETE /encartes/:id
     * Exclui encarte (soft delete ou hard delete conforme configuração)
     */
    async excluir(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            
            if (isNaN(id)) {
                throw new AppError("ID inválido", StatusCodes.BAD_REQUEST, "INVALID_ID");
            }

            const resultado = await service.excluir(id);
            
            return res.status(StatusCodes.NO_CONTENT).json({ 
                message: "Encarte excluído com sucesso",
                ...resultado 
            });

        } catch (error) {
            return this.handleError(res, error, "EncarteController.excluir");
        }
    }
}
