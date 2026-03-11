import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z_]+$/, "Name must contain only A-Z and _")
    .transform((v) => v.trim().toUpperCase()),

  description: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v ? v.trim() : v)),
});

export const permissionIdSchema = z.object({
  id: z.uuid(),
});