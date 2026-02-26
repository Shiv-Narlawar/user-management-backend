import { RequestHandler } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export const authorize = (requiredPermission: string): RequestHandler => {
  return (req, res, next) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!user.permissions?.includes(requiredPermission)) {
      return res
        .status(403)
        .json({ message: `Permission ${requiredPermission} required` });
    }

    next();
  };
};