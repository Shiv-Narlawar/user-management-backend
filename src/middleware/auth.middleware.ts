import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth-request";
import { verifyAuth0Token } from "../services/auth/auth0Verifier";
import { UserService } from "../services/user.service";
import { UserStatus } from "../entities/user.entity"; // ✅ added

const userService = new UserService();

function getBearerToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const decoded = await verifyAuth0Token(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const sub = decoded.sub;
    const email = decoded["https://user-management-api/email"];
    const name = decoded["https://user-management-api/name"] ?? null;

    if (!sub || !email) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    //try to find existing user
    let user: any = await userService.findByEmail(email);

    if (!user) {
      user = await userService.findOrCreateUser({
        sub,
        email,
        name,
      });
    } else {
      //  INVITE FLOW LOGIC

      // block inactive users
      if (user.status === UserStatus.INACTIVE) {
        return res.status(403).json({
          message: "Account inactive",
        });
      }

      //  first login for invited user
      if (!user.auth0Sub) {
        user.auth0Sub = sub;
        user.status = UserStatus.ACTIVE;

        await userService.save(user);
      }
    }

    // attach normalized user
    req.user = user;

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);

    if (error.message === "Account inactive") {
      return res.status(403).json({ message: "Account inactive" });
    }

    if (error.message === "Email missing in token") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};