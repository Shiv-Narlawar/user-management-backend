import jwt from "jsonwebtoken";
import { RoleName } from "../../entities/role.entity";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined");
}

export interface AccessPayload {
  id: string;
  email: string;
  role: RoleName;
  departmentId?: string;
  permissions: string[];
}

export interface RefreshPayload {
  id: string;
  jti: string;
}

export type JwtPayload = AccessPayload;


export const signAccessToken = (payload: AccessPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: RefreshPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};



export const verifyAccessToken = (
  token: string
): AccessPayload | null => {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    if (typeof decoded === "object" && decoded !== null) {
      return decoded as AccessPayload;
    }

    return null;
  } catch {
    return null;
  }
};


export const verifyRefreshToken = (
  token: string
): RefreshPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    if (typeof decoded === "object" && decoded !== null) {
      return decoded as RefreshPayload;
    }

    return null;
  } catch {
    return null;
  }
};


export const verifyToken = verifyAccessToken;