import { Request, Response } from "express";
import { AuditService } from "../services/audit.service";
import { AuthRequest } from "../types/auth-request";
import { AppDataSource } from "../config/data-source";
import { Role, RoleName } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { PermissionName } from "../constants/permission-name";

import {
  roleIdSchema,
  createRoleSchema,
  updateRolePermissionsSchema,
} from "../validators/role.validator";

const auditService = new AuditService();

export class RoleController {
  private roleRepo = AppDataSource.getRepository(Role);
  private permissionRepo = AppDataSource.getRepository(Permission);

  getRoles = async (_req: Request, res: Response) => {
    try {
      const roles = await this.roleRepo.find({
        relations: ["permissions"],
        order: { createdAt: "ASC" },
      });

      return res.json({ data: roles });
    } catch (err) {
      console.error("getRoles error:", err);
      return res.status(500).json({ message: "Failed to fetch roles" });
    }
  };

  createRole = async (req: AuthRequest, res: Response) => {
  try {

    const data = createRoleSchema.parse(req.body);

    const exists = await this.roleRepo.findOne({
      where: { name: data.name },
    });

    if (exists) {
      return res.status(409).json({ message: "Role already exists" });
    }

    const role = this.roleRepo.create({
      name: data.name,
      permissions: [],
    });

    const saved = await this.roleRepo.save(role);

    // Audit log
    await auditService.log({
      action: "ROLE_CREATED",
      actorId: req.user?.id,
      entityType: "Role",
      entityId: saved.id,
      message: `Role ${saved.name} created`,
    });

    return res.status(201).json({
      message: "Role created",
      role: saved,
    });

  } catch (err) {
    console.error("createRole error:", err);

    return res.status(400).json({
      message: "Invalid request data",
    });
  }
};

  updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {

    const { id } = roleIdSchema.parse(req.params);
    const { permissions } = updateRolePermissionsSchema.parse(req.body);

    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ["permissions"],
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Protect ADMIN role
    if (role.name === RoleName.ADMIN) {

      const all = await this.permissionRepo.find();

      role.permissions = all;
      await this.roleRepo.save(role);

      await auditService.log({
        action: "ROLE_PERMISSION_UPDATED",
        actorId: req.user?.id,
        entityType: "Role",
        entityId: role.id,
        message: `Permissions updated for role ${role.name}`,
      });

      return res.json({
        message: "ADMIN always has all permissions",
        permissions: role.permissions.map((p) => p.name),
      });
    }

    const permissionEntities = await this.permissionRepo.find({
      where: permissions.map((name) => ({ name })),
    });

    role.permissions = permissionEntities;

    await this.roleRepo.save(role);

    //  Audit log
    await auditService.log({
      action: "ROLE_PERMISSION_UPDATED",
      actorId: req.user?.id,
      entityType: "Role",
      entityId: role.id,
      message: `Permissions updated for role ${role.name}`,
    });

    return res.json({
      message: "Role permissions updated",
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions.map((p) => p.name),
    });

  } catch (err) {
    console.error("updateRolePermissions error:", err);

    return res.status(400).json({
      message: "Invalid request data",
    });
  }
};

  getRolePermissions = async (req: Request, res: Response) => {
    try {
      const { id } = roleIdSchema.parse(req.params);

      const role = await this.roleRepo.findOne({
        where: { id },
        relations: ["permissions"],
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      return res.json({
        roleId: role.id,
        roleName: role.name,
        permissions: role.permissions.map((p) => p.name),
      });
    } catch (err) {
      console.error("getRolePermissions error:", err);
      return res.status(400).json({ message: "Invalid role id" });
    }
  };

  deleteRole = async (req: AuthRequest, res: Response) => {
  try {

    const { id } = roleIdSchema.parse(req.params);

    const role = await this.roleRepo.findOne({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.name === RoleName.ADMIN) {
      return res.status(403).json({
        message: "ADMIN role cannot be deleted",
      });
    }

    await this.roleRepo.delete(id);

    // Audit log
    await auditService.log({
      action: "ROLE_DELETED",
      actorId: req.user?.id,
      entityType: "Role",
      entityId: id,
      message: `Role ${role.name} deleted`,
    });

    return res.json({
      message: "Role deleted successfully",
    });

  } catch (err) {
    console.error("deleteRole error:", err);

    return res.status(400).json({
      message: "Invalid role id",
    });
  }
};}