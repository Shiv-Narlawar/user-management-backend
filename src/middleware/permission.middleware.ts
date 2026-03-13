import type { RequestHandler } from "express";
import { AuthRequest } from "../types/auth-request";
import { PermissionName } from "../constants/permission-name";
import { RoleName } from "../entities/role.entity";

export const authorize = (
  requiredPermission: PermissionName
): RequestHandler => {
  return (req, res, next) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role === RoleName.ADMIN) {
      return next();
    }

    if (!Array.isArray(user.permissions)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }


    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: "You are not permitted to perform this action",
      });
    }

    return next();
  };
};