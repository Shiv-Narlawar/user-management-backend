import { Request } from "express";
import { RoleName } from "../entities/role.entity";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: RoleName;
  permissions: string[];
  departmentId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}