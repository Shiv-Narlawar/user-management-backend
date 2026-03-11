import { Request, Response } from "express";
import { LocalAuthService } from "../services/auth/local.auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";

import {
  signupSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "../validators/auth.validator";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class AuthController {
  private authService = new LocalAuthService();

  // SIGNUP
  signup = asyncHandler(async (req: Request, res: Response) => {
    const data = signupSchema.parse(req.body);

    const allowedSignupRoles: RoleName[] = [RoleName.USER, RoleName.MANAGER];
    if (!allowedSignupRoles.includes(data.role)) {
      throw new ApiError(400, "Invalid role selection");
    }

    const result = await this.authService.signup(
      data.name.trim(),
      normalizeEmail(data.email),
      data.password,
      data.role
    );

    return res.status(201).json(result);
  });

  // LOGIN
  login = asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const result = await this.authService.login(
      normalizeEmail(data.email),
      data.password
    );

    return res.status(200).json(result);
  });

  // REFRESH TOKEN
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const data = refreshSchema.parse(req.body);

    const result = await this.authService.refresh(data.refreshToken);
    return res.status(200).json(result);
  });

  // LOGOUT
  logout = asyncHandler(async (req: Request, res: Response) => {
    const data = refreshSchema.parse(req.body);

    const result = await this.authService.logout(data.refreshToken);
    return res.status(200).json(result);
  });

  // FORGOT PASSWORD
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const data = forgotPasswordSchema.parse(req.body);

    const result = await this.authService.forgotPassword(
      normalizeEmail(data.email)
    );

    return res.status(200).json(result);
  });

  // RESET PASSWORD
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const data = resetPasswordSchema.parse(req.body);

    const result = await this.authService.resetPassword(
      normalizeEmail(data.email),
      "NA",
      data.newPassword
    );

    return res.status(200).json(result);
  });

  // FORGOT USERNAME
  forgotUsername = asyncHandler(async (req: Request, res: Response) => {
    const data = forgotPasswordSchema.parse(req.body);

    const result = await this.authService.forgotUsername(
      normalizeEmail(data.email)
    );

    return res.status(200).json(result);
  });

  // UPDATE PASSWORD
  updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const data = updatePasswordSchema.parse(req.body);

    const result = await this.authService.updatePassword(
      req.user.id,
      data.currentPassword,
      data.newPassword
    );

    return res.status(200).json(result);
  });
}