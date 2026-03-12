import { z } from "zod";
import { RoleName } from "../entities/role.entity";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").transform(v => v.trim()),
  email: z.email().transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
  role: z.enum(RoleName),
});

export const loginSchema = z.object({
  email: z.email().transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email().transform(v => v.trim().toLowerCase()),
});

export const resetPasswordSchema = z.object({
  email: z.email().transform(v => v.trim().toLowerCase()),
  newPassword: z.string().min(1, "New password is required"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});