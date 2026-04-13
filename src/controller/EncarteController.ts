import { Request, Response } from "express";
import { EncarteService } from "../service/EncarteService";
import { CreateEncarteDTO, UpdateEncarteDTO } from "../entity/EncarteDTO";

const service = new EncarteService();

export class EncarteController {

    async criar(req: Request, res: Response) {
        try {
            const data: CreateEncarteDTO = req.body;

            // Verifica se veio base64 no corpo da requisição
            if (data.imagem_base64) {
                const encarte = await service.criarComBase64(
                    {
                        titulo: data.titulo,
                        data_inicio: data.data_inicio,
                        data_fim: data.data_fim,
                        ativo: data.ativo,
                        categoria_id: data.categoria_id
                    },
                    data.imagem_base64
                );
                return res.status(201).json(encarte);
            }

            // Se não veio base64, cria sem imagem
            const encarte = await service.criar(data);
            return res.status(201).json(encarte);

        } catch (error: any) {
            console.error("Erro ao criar encarte:", error);
            return res.status(400).json({ 
                error: error.message || "Erro ao criar encarte" 
            });
        }
    }

    async criarComUpload(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Nenhuma imagem enviada" });
            }

            const data: Omit<CreateEncarteDTO, "imagem_url"> = {
                titulo: req.body.titulo,
                data_inicio: req.body.data_inicio,
                data_fim: req.body.data_fim,
                ativo: req.body.ativo === 'true' || req.body.ativo === true,
                categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : null
            };

            const encarte = await service.criarComImagem(data, req.file);
            return res.status(201).json(encarte);

        } catch (error: any) {
            console.error("Erro ao criar encarte com upload:", error);
            return res.status(400).json({ 
                error: error.message || "Erro ao criar encarte" 
            });
        }
    }

    async listarAtivos(req: Request, res: Response) {
        try {
            const encartes = await service.listarAtivos();
            return res.json(encartes);
        } catch (error: any) {
            console.error("Erro ao listar encartes ativos:", error);
            return res.status(500).json({ 
                error: error.message || "Erro ao listar encartes" 
            });
        }
    }

    async listarTodos(req: Request, res: Response) {
        try {
            const encartes = await service.listarTodos();
            return res.json(encartes);
        } catch (error: any) {
            console.error("Erro ao listar todos encartes:", error);
            return res.status(500).json({ 
                error: error.message || "Erro ao listar encartes" 
            });
        }
    }

    async buscarPorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const encarte = await service.buscarPorId(id);
            
            if (!encarte) {
                return res.status(404).json({ error: "Encarte não encontrado" });
            }
            
            return res.json(encarte);
        } catch (error: any) {
            console.error("Erro ao buscar encarte:", error);
            return res.status(500).json({ 
                error: error.message || "Erro ao buscar encarte" 
            });
        }
    }

    async atualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const data: UpdateEncarteDTO = req.body;

            const encarte = await service.atualizar(id, data);
            return res.json(encarte);

        } catch (error: any) {
            console.error("Erro ao atualizar encarte:", error);
            return res.status(400).json({ 
                error: error.message || "Erro ao atualizar encarte" 
            });
        }
    }

    async excluir(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const resultado = await service.excluir(id);
            return res.json(resultado);

        } catch (error: any) {
            console.error("Erro ao excluir encarte:", error);
            return res.status(400).json({ 
                error: error.message || "Erro ao excluir encarte" 
            });
        }
    }

    async alterarStatus(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { ativo } = req.body;

            const encarte = await service.alterarStatus(id, ativo);
            return res.json(encarte);

        } catch (error: any) {
            console.error("Erro ao alterar status:", error);
            return res.status(400).json({ 
                error: error.message || "Erro ao alterar status" 
            });
        }
    }
}