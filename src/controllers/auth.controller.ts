import { Request, Response } from "express";
import { LocalAuthService } from "../services/auth/local.auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";

/** ---------- Helpers ---------- */
function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isRoleName(v: unknown): v is RoleName {
  return (
    typeof v === "string" &&
    (Object.values(RoleName) as string[]).includes(v)
  );
}

export class AuthController {
  private authService = new LocalAuthService();

  // SIGNUP
  signup = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    };

    if (!isNonEmptyString(name)) throw new ApiError(400, "Name is required");
    if (!isEmail(email)) throw new ApiError(400, "Valid email is required");
    if (!isNonEmptyString(password))
      throw new ApiError(400, "Password is required");
    if (!isRoleName(role)) throw new ApiError(400, "Invalid role selection");

    const allowedSignupRoles: RoleName[] = [RoleName.USER, RoleName.MANAGER];
    if (!allowedSignupRoles.includes(role)) {
      throw new ApiError(400, "Invalid role selection");
    }

    const result = await this.authService.signup(
      name.trim(),
      normalizeEmail(email),
      password,
      role
    );

    return res.status(201).json(result);
  });

  // LOGIN
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    if (!isEmail(email)) throw new ApiError(400, "Valid email is required");
    if (!isNonEmptyString(password))
      throw new ApiError(400, "Password is required");

    const result = await this.authService.login(normalizeEmail(email), password);
    return res.status(200).json(result);
  });

  // REFRESH ACCESS TOKEN
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken?: unknown };

    if (!isNonEmptyString(refreshToken)) {
      throw new ApiError(400, "Refresh token is required");
    }

    const result = await this.authService.refresh(refreshToken);
    return res.status(200).json(result);
  });

  // LOGOUT
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken?: unknown };

    if (!isNonEmptyString(refreshToken)) {
      throw new ApiError(400, "Refresh token is required");
    }

    const result = await this.authService.logout(refreshToken);
    return res.status(200).json(result);
  });

  // FORGOT PASSWORD (email verification only)
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email?: unknown };

    if (!isEmail(email)) throw new ApiError(400, "Valid email is required");

    const result = await this.authService.forgotPassword(normalizeEmail(email));
    return res.status(200).json(result);
  });

  // RESET PASSWORD (NO CODE REQUIRED)
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, newPassword } = req.body as {
      email?: unknown;
      newPassword?: unknown;
    };

    if (!isEmail(email)) throw new ApiError(400, "Valid email is required");
    if (!isNonEmptyString(newPassword))
      throw new ApiError(400, "New password is required");

    // pass a dummy code since interface expects it (service ignores it)
    const result = await this.authService.resetPassword(
      normalizeEmail(email),
      "NA",
      newPassword
    );

    return res.status(200).json(result);
  });

  //  FORGOT USERNAME
  forgotUsername = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email?: unknown };

    if (!isEmail(email)) throw new ApiError(400, "Valid email is required");

    const result = await this.authService.forgotUsername(normalizeEmail(email));
    return res.status(200).json(result);
  });

  // UPDATE PASSWORD (logged-in user)
updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (!req.user) throw new ApiError(401, "Unauthorized");
  if (!isNonEmptyString(currentPassword))
    throw new ApiError(400, "Current password is required");
  if (!isNonEmptyString(newPassword))
    throw new ApiError(400, "New password is required");

  const result = await this.authService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  return res.status(200).json(result);
});
}