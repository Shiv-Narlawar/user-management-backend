import { Request, Response } from "express";
import { LocalAuthService } from "../services/auth/local.auth";

function mapErrorToStatus(message: string): number {
  const msg = message.toLowerCase();

  // auth failures
  if (msg.includes("invalid email or password")) return 401;

  // conflicts
  if (msg.includes("already exists")) return 409;

  // not found
  if (msg.includes("not found")) return 404;

  // inactive user
  if (msg.includes("inactive")) return 403;

  // default: validation / bad request
  return 400;
}

export class AuthController {
  private authService = new LocalAuthService();

  signup = async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
      };

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "Name, email, password and role are required",
        });
      }

      const allowedRoles = ["USER", "MANAGER"] as const;
      if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
        return res.status(400).json({ message: "Invalid role selection" });
      }

      const result = await this.authService.signup(name, email, password, role);
      return res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed";
      return res.status(mapErrorToStatus(message)).json({ message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const result = await this.authService.login(email, password);
      return res.status(200).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      return res.status(mapErrorToStatus(message)).json({ message });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await this.authService.forgotPassword(email);
      return res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Forgot password failed";
      return res.status(mapErrorToStatus(message)).json({ message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body as {
        email?: string;
        code?: string;
        newPassword?: string;
      };

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          message: "Email, code and new password are required",
        });
      }

      const result = await this.authService.resetPassword(email, code, newPassword);
      return res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Reset password failed";
      return res.status(mapErrorToStatus(message)).json({ message });
    }
  };

  forgotUsername = async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await this.authService.forgotUsername(email);
      return res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Forgot username failed";
      return res.status(mapErrorToStatus(message)).json({ message });
    }
  };
}