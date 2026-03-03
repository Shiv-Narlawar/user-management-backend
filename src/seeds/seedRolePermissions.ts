import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";

export const seedRolePermissions = async () => {
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);

  const admin = await roleRepo.findOne({
    where: { name: "ADMIN" },
    relations: ["permissions"],
  });

  const manager = await roleRepo.findOne({
    where: { name: "MANAGER" },
    relations: ["permissions"],
  });

  const user = await roleRepo.findOne({
    where: { name: "USER" },
    relations: ["permissions"],
  });

  const allPermissions = await permissionRepo.find();

  if (admin) {
    admin.permissions = allPermissions;
    await roleRepo.save(admin);
    console.log("Permissions assigned to ADMIN");
  }

  if (manager) {
    manager.permissions = allPermissions.filter(
      (p) => p.name !== "PERMISSION_ASSIGN"
    );
    await roleRepo.save(manager);
    console.log("Permissions assigned to MANAGER");
  }

  if (user) {
    user.permissions = allPermissions.filter(
      (p) => p.name === "USER_VIEW"
    );
    await roleRepo.save(user);
    console.log("Permissions assigned to USER");
  }

  console.log("Role-permission seeding completed");
};