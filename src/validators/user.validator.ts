import { z } from "zod";
import { RoleName } from "../entities/role.entity";

// ================= USER ID =================
export const userIdSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});

// ================= CREATE USER =================
export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),

  email: z
    .string()
    .email("Valid email is required")
    .transform((v) => v.trim().toLowerCase()),

  role: z.nativeEnum(RoleName),
});

export const inviteUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),

  email: z
    .string()
    .email("Valid email is required")
    .transform((v) => v.trim().toLowerCase()),

  role: z.nativeEnum(RoleName),
});

// ================= UPDATE PROFILE =================
export const updateMyProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),
});

// ================= USERS LIST QUERY =================
export const getUsersQuerySchema = z.object({
  search: z
    .string()
    .max(100)
    .transform((v) => v.trim())
    .optional(),

     role: z.enum([RoleName.USER, RoleName.MANAGER]).optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10),

  // ✅ Added for sorting users by createdAt
  sort: z
    .enum(["ASC", "DESC"])
    .default("DESC")
    .optional(),
});
