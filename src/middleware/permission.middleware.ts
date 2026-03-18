import type { RequestHandler } from "express";
import { AuthRequest } from "../types/auth-request";
import { PermissionName } from "../constants/permission-name";
import { RoleName } from "../entities/role.entity";

// authorize
export const authorize = (
  requiredPermission: PermissionName
): RequestHandler => {
  return (req: AuthRequest, res, next) => {
    const user = req.user;

    // no user
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // admin bypass
    if (user.role === RoleName.ADMIN) {
      return next();
    }

    // permissions missing
    if (!Array.isArray(user.permissions)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // check
    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    next();
  };
};