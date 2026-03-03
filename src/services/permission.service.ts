import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission.entity";

export class PermissionService {
  private permissionRepo = AppDataSource.getRepository(Permission);

  async getAllPermissions() {
    return this.permissionRepo.find();
  }

  async createPermission(data: Partial<Permission>) {
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async deletePermission(id: string) {
    const result = await this.permissionRepo.delete(id);
    return result.affected !== 0;
  }
}