import { User } from "../../models/user.model";

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  validate(token: string): Promise<boolean>;
}