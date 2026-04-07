import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: number;
  adminEmail?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ erro: "Token não fornecido" });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({ erro: "Formato de token inválido" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ erro: "Configuração de servidor inválida" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };

    req.adminId = decoded.id;
    req.adminEmail = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};