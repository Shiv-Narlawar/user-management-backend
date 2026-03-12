import type { AccessPayload } from "./jwt";
import { RoleName } from "../../entities/role.entity";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status?: string;
  permissions?: string[];
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;

  mustChangePassword?: boolean;

  user?: AuthUser;
  message?: string;

  // optional error details
  errors?: any;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;

  signup(
    name: string,
    email: string,
    password: string,
    role: RoleName
  ): Promise<AuthResponse>;

  forgotPassword(email: string): Promise<AuthResponse>;

  resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResponse>;

  forgotUsername(email: string): Promise<AuthResponse>;

  refresh(refreshToken: string): Promise<AuthResponse>;

  logout(refreshToken: string): Promise<AuthResponse>;

  validate(token: string): Promise<AccessPayload | null>;
}