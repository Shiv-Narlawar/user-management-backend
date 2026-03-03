import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/role.entity";

export const seedRoles = async () => {
  const roleRepo = AppDataSource.getRepository(Role);

  const roles = ["ADMIN", "MANAGER", "USER"];

  for (const roleName of roles) {
    const existing = await roleRepo.findOne({ where: { name: roleName } });

    if (!existing) {
      const role = roleRepo.create({ name: roleName });
      await roleRepo.save(role);
      console.log(`Role ${roleName} created`);
    } else {
      console.log(`Role ${roleName} already exists`);
    }
  }
};