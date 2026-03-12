/* import { z } from "zod";

// ================= DEPARTMENT ID =================
export const departmentIdSchema = z.object({
  id: z.uuid(),
});

// ================= CREATE DEPARTMENT =================
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .transform((v) => v.trim()),

  // manager optional
  managerId: z.uuid().optional(),
});

// ================= UPDATE DEPARTMENT =================
export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(1)
    .transform((v) => v.trim())
    .optional(),

  managerId: z.uuid().optional().nullable(),
});

// ================= ASSIGN USER =================
export const assignUserSchema = z.object({
  userId: z.uuid(),
});

// ================= REMOVE USER =================
export const removeUserSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
}); */
