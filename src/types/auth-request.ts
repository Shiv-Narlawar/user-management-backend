import { Request } from "express";
import { JwtPayload } from "../services/auth/jwt";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}