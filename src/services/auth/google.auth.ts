import { AuthService } from "./auth.interface";

export class GoogleAuthService implements AuthService {
  async login(): Promise<string> {
    return "google-token";
  }

  async validate(): Promise<boolean> {
    return true;
  }
}
