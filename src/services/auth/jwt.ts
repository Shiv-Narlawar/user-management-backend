import jwt from "jsonwebtoken";


const ACCESS_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!ACCESS_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined");
}


export interface AccessPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}


export type JwtPayload = AccessPayload;

export interface RefreshPayload {
  id: string;   // user id
  jti: string;  // refresh token DB id
}



export const signAccessToken = (payload: AccessPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: RefreshPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};



export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
  } catch {
    return null;
  }
};


export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};



export const verifyRefreshToken = (token: string): RefreshPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
  } catch {
    return null;
  }
};