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

  password: z.string().min(1, "Password is required"),

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
  search: z.string().max(100).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});