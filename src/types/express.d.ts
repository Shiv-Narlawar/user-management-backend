import type { JwtPayload } from "../services/auth/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export {};