import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth-request";

import { verifyAccessToken } from "../services/auth/jwt";
import { getAuthProvider } from "../services/auth/auth-provider.factory";

import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/user.entity";
import { RoleName } from "../entities/role.entity";
import { AuditLog } from "../entities/audit.entity";

/* =========================================================
   Extract Bearer Token
========================================================= */

function getBearerToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) return null;

  return token;
}

/* =========================================================
   Detect Auth0 Token
========================================================= */

function isAuth0Token(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    return (
      payload.iss &&
      typeof payload.iss === "string" &&
      payload.iss.includes("auth0.com")
    );
  } catch {
    return false;
  }
}

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

export const authMiddleware = async (
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

    let decoded: any = null;
    let providerUsed: "local" | "auth0" | null = null;

    /* =========================================================
       DETECT TOKEN TYPE
    ========================================================= */

    if (isAuth0Token(token)) {
      const authProvider = getAuthProvider();

      decoded = await authProvider.validate(token);

      if (decoded) providerUsed = "auth0";
    } else {
      decoded = verifyAccessToken(token);

      if (decoded) providerUsed = "local";
    }

    if (!decoded) {
      return res.status(401).json({
        message: "Unauthorized: Invalid token",
      });
    }

    /* =========================================================
       LOAD USER FROM DATABASE
    ========================================================= */

    const userRepo = AppDataSource.getRepository(User);
    const auditRepo = AppDataSource.getRepository(AuditLog);

    const user = await userRepo.findOne({
      where: { id: decoded.id },
      relations: ["role", "role.permissions"],
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      return res.status(403).json({
        message: "Account inactive",
      });
    }

    /* =========================================================
       ATTACH RBAC USER TO REQUEST
    ========================================================= */

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role?.name ?? RoleName.USER,
      permissions: (user.role?.permissions || []).map((p) => p.name),
      departmentId: user.departmentId ?? undefined,
    };

    /* =========================================================
       AUDIT LOGIN (AUTH0 ONLY)
    ========================================================= */

    if (providerUsed === "auth0") {
      try {
        await auditRepo.save({
          action: "LOGIN_AUTH0",
          actorId: user.id,
          actorEmail: user.email,
          actorName: user.name,
          entityType: "USER",
          entityId: user.id,
          message: `${user.email} logged in using Auth0`,
        });
      } catch (err) {
        console.error("Audit log failed:", err);
      }
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};