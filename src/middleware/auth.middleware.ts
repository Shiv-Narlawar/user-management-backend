import { RequestHandler } from "express";
import { verifyToken, JwtPayload } from "../services/auth/jwt";

export type AuthenticatedRequest = Express.Request & { user?: JwtPayload };

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid token" });
  }

  (req as AuthenticatedRequest).user = decoded;
  next();
};