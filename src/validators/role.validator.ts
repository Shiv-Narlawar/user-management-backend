import { z } from "zod";
import { RoleName } from "../entities/role.entity";
import { PermissionName } from "../constants/permission-name";

export const roleIdSchema = z.object({
  id: z.uuid(),
});

export const createRoleSchema = z.object({
  name: z.enum(RoleName),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PermissionName)),
});