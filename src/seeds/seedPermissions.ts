import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission.entity";
import { PermissionName } from "../constants/permission-name";

export const seedPermissions = async () => {
  const repo = AppDataSource.getRepository(Permission);

  const permissions = Object.values(PermissionName);

  for (const name of permissions) {
    const exists = await repo.findOne({ where: { name } });

    if (!exists) {
      await repo.save(repo.create({ name }));
      console.log("Seeded permission:", name);
    }
  }

  console.log("Permissions seeding completed.");
};