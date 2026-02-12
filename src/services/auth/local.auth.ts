import { AuthService } from "./auth.interface";

export class LocalAuthService implements AuthService {
  async login(): Promise<string> {
    return "local-token";
  }

  async validate(): Promise<boolean> {
    return true;
  }
}