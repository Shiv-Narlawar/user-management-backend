import { AppDataSource } from "../config/data-source";
import { Role, RoleName } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { PermissionName } from "../constants/permission-name";

export const seedRolePermissions = async () => {
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);

  const allPermissions = await permissionRepo.find();

  const permissionMap = new Map(
    allPermissions.map((p) => [p.name, p])
  );

  //  ADMIN 
  const admin = await roleRepo.findOne({
    where: { name: RoleName.ADMIN },
    relations: ["permissions"],
  });

  if (admin) {
    admin.permissions = allPermissions;
    await roleRepo.save(admin);
    console.log("ADMIN permissions assigned");
  }

  //  MANAGER 
  const manager = await roleRepo.findOne({
    where: { name: RoleName.MANAGER },
    relations: ["permissions"],
  });

  if (manager) {
    manager.permissions = [
      permissionMap.get(PermissionName.USER_VIEW),
      permissionMap.get(PermissionName.USER_UPDATE),
      permissionMap.get(PermissionName.DEPARTMENT_VIEW),
      permissionMap.get(PermissionName.DEPARTMENT_ASSIGN_USER),
    ].filter(Boolean) as Permission[];

    await roleRepo.save(manager);
    console.log("MANAGER permissions assigned");
  }

  // USER 
  const user = await roleRepo.findOne({
    where: { name: RoleName.USER },
    relations: ["permissions"],
  });

  if (user) {
    user.permissions = [
      permissionMap.get(PermissionName.USER_VIEW),
    ].filter(Boolean) as Permission[];

    await roleRepo.save(user);
    console.log("USER permissions assigned");
  }

  console.log("Role-permission seeding completed successfully.");
};