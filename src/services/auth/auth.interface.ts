export interface AuthService {
  login(email: string, password: string): Promise<string>;
  validate(token: string): Promise<boolean>;
}
