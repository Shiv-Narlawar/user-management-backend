import { Response, NextFunction } from "express";
import { verifyToken } from "../services/auth/jwt";
import { AuthRequest } from "../types/auth-request";

function getBearerToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "Unauthorized: Invalid token",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};