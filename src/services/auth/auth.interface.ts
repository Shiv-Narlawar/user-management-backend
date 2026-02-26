import type { JwtPayload } from "./jwt";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string; 
  permissions?: string[];
}

export interface AuthResponse {
  token?: string;
  user?: AuthUser;
  message?: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  signup(name: string, email: string, password: string, role: string): Promise<AuthResponse>;
  forgotPassword(email: string): Promise<AuthResponse>;
  resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse>;
  validate(token: string): Promise<JwtPayload | null>; 
}