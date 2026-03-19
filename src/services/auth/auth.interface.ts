import { RoleName } from "../../entities/role.entity";

// user context
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status?: string;
  permissions?: string[];
  departmentId?: string;
}

// auth0 identity (raw)
export interface AuthIdentity {
  sub: string;
  email?: string;
  name?: string | null;
}

// auth provider contract (optional abstraction)
export interface AuthService {
  // validate token
  validate(token: string): Promise<AuthIdentity | null>;
}