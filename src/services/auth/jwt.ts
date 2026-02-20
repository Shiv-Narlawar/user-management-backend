import jwt from "jsonwebtoken";
import { User } from "../../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const verifyToken = (token: string): boolean => {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};