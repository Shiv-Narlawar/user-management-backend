import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission.entity";

export const seedPermissions = async () => {
  const permissionRepo = AppDataSource.getRepository(Permission);

  const permissions = [
    "USER_VIEW",
    "USER_CREATE",
    "USER_UPDATE",
    "USER_DELETE",
    "ROLE_CREATE",
    "ROLE_UPDATE",
    "PERMISSION_ASSIGN"
  ];

  for (const permName of permissions) {
    const existing = await permissionRepo.findOne({
      where: { name: permName },
    });

    if (!existing) {
      const permission = permissionRepo.create({ name: permName });
      await permissionRepo.save(permission);
      console.log(`Permission ${permName} created`);
    } else {
      console.log(`Permission ${permName} already exists`);
    }
  }
};