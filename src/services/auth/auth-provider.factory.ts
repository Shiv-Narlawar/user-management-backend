import { LocalAuthService } from "./local.auth";
import { Auth0AuthService } from "./auth0-auth.service";

export function getAuthProvider() {
  const provider = process.env.AUTH_PROVIDER;

  if (provider === "auth0") {
    return new Auth0AuthService();
  }

  return new LocalAuthService();
}