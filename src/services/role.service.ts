import { AppDataSource } from "../config/data-source";
import { Role, RoleName } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { In } from "typeorm";

export class RoleService {
  private roleRepo = AppDataSource.getRepository(Role);
  private permissionRepo = AppDataSource.getRepository(Permission);

  async getAllRoles() {
    return this.roleRepo.find({
      relations: ["permissions"],
      order: { createdAt: "ASC" },
    });
  }

  async createRole(name: RoleName, permissionIds: string[]) {
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) {
      throw new Error("Role already exists");
    }

    const permissions = permissionIds.length
      ? await this.permissionRepo.find({
          where: { id: In(permissionIds) },
        })
      : [];

    const role = this.roleRepo.create({
      name,
      permissions,
    });

    return this.roleRepo.save(role);
  }

  // Get permissions of one role
  async getRolePermissions(roleId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ["permissions"],
    });

    if (!role) return null;

    return role.permissions;
  }

  // Update permissions only
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ["permissions"],
    });

    if (!role) return null;

    //  Protect ADMIN role
    if (role.name === RoleName.ADMIN) {
      const allPermissions = await this.permissionRepo.find();
      role.permissions = allPermissions;
      return this.roleRepo.save(role);
    }

    const permissions = permissionIds.length
      ? await this.permissionRepo.find({
          where: { id: In(permissionIds) },
        })
      : [];

    role.permissions = permissions;

    return this.roleRepo.save(role);
  }

  async deleteRole(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });

    if (!role) return false;

    //  Protect ADMIN role
    if (role.name === RoleName.ADMIN) {
      throw new Error("ADMIN role cannot be deleted");
    }

    const result = await this.roleRepo.delete(id);
    return result.affected !== 0;
  }
}