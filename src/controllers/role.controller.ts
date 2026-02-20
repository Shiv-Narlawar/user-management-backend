import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Role, RoleName } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { PermissionName } from "../constants/permission-name";

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

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

  
  createRole = async (req: Request, res: Response) => {
    try {
      const { name } = req.body as { name?: RoleName };

      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }

      if (!Object.values(RoleName).includes(name)) {
        return res.status(400).json({ message: "Invalid role name" });
      }

      const exists = await this.roleRepo.findOne({ where: { name } });
      if (exists) {
        return res.status(409).json({ message: "Role already exists" });
      }

      const role = this.roleRepo.create({ name, permissions: [] });
      const saved = await this.roleRepo.save(role);

      return res.status(201).json({ message: "Role created", role: saved });
    } catch (err) {
      console.error("createRole error:", err);
      return res.status(500).json({ message: "Failed to create role" });
    }
  };

  
  updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!isUuid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const { permissions } = req.body as { permissions?: PermissionName[] };

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "permissions must be an array" });
    }

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

      return res.json({
        message: "ADMIN always has all permissions",
        permissions: role.permissions.map((p) => p.name),
      });
    }

    // Fetch permissions by NAME
    const permissionEntities = await this.permissionRepo.find({
      where: permissions.map((name) => ({ name })),
    });

    role.permissions = permissionEntities;

    await this.roleRepo.save(role);

    return res.json({
      message: "Role permissions updated",
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions.map((p) => p.name),
    });

  } catch (err) {
    console.error("updateRolePermissions error:", err);
    return res.status(500).json({ message: "Failed to update role permissions" });
  }
};
  getRolePermissions = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid role id" });
      }

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
        permissions: (role.permissions || []).map((p) => p.name),
      });
    } catch (err) {
      console.error("getRolePermissions error:", err);
      return res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  };

  deleteRole = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid role id" });
      }

      const role = await this.roleRepo.findOne({ where: { id } });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Protect ADMIN role
      if (role.name === RoleName.ADMIN) {
        return res.status(403).json({ message: "ADMIN role cannot be deleted" });
      }

      await this.roleRepo.delete(id);

      return res.json({ message: "Role deleted successfully" });
    } catch (err) {
      console.error("deleteRole error:", err);
      return res.status(500).json({ message: "Failed to delete role" });
    }
  };
}