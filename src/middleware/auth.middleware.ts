import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth-request";
import { verifyAuth0Token } from "../services/auth/auth0Verifier";
import { UserService } from "../services/user.service";

const userService = new UserService();

function getBearerToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const decoded = await verifyAuth0Token(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const sub = decoded.sub;
    const email = decoded["https://user-management-api/email"];
    const name = decoded["https://user-management-api/name"] ?? null;

    if (!sub || !email) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    const user = await userService.findOrCreateUser({
      sub,
      email,
      name,
    });

    // attach normalized user
    req.user = user;

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);

    // handle known errors
    if (error.message === "Account inactive") {
      return res.status(403).json({ message: "Account inactive" });
    }

    if (error.message === "Email missing in token") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};