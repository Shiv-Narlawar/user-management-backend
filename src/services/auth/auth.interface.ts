import { RoleName } from "../../entities/role.entity";
import type { AccessPayload } from "./jwt";
import { RoleName } from "../../entities/role.entity";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status?: string;
  permissions?: string[];
  departmentId?: string;
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;

  mustChangePassword?: boolean;

  user?: AuthUser;
  message?: string;

  errors?: any;
}

export interface AuthService {

  // ===== LOCAL AUTH =====

  login?(email: string, password: string): Promise<AuthResponse>;

  signup?(
    name: string,
    email: string,
    password: string,
    role: RoleName
  ): Promise<AuthResponse>;

  forgotPassword?(email: string): Promise<AuthResponse>;

  resetPassword?(
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResponse>;

  forgotUsername?(email: string): Promise<AuthResponse>;

  refresh?(refreshToken: string): Promise<AuthResponse>;

  logout?(refreshToken: string): Promise<AuthResponse>;

  // ===== PROVIDER LOGIN (Auth0 / Google / etc) =====

  loginWithProvider?(token: string): Promise<AuthResponse>;

  // ===== TOKEN VALIDATION =====

  validate(token: string): Promise<AccessPayload | null>;
}