import { AuthService, AuthResponse } from "./auth.interface";
import { generateToken, verifyToken } from "./jwt";
import { User } from "../../models/user.model";

// Temporary mock users 
const users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@test.com",
    password: "123456",
    role: "admin",
    status: "ACTIVE",
  },
];

export class LocalAuthService implements AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = users.find((u) => u.email === email);

    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken(user);

    // Remove password before sending response
    const { password: _removed, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async validate(token: string): Promise<boolean> {
    return verifyToken(token);
  }
}