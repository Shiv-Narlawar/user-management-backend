import { Request } from "express";
import { RoleName } from "../entities/role.entity";

export interface AuthUserPayload {
  id: string;
  email: string;
  name?: string;
  role: RoleName;
  permissions: string[];
  departmentId?: string;
}

export interface AuthRequest extends Request {
  // auth0 identity
  auth?: {
    sub: string;
    email?: string;
    name?: string | null;
    token: string;
  };

  // db user
  user?: AuthUserPayload;
}