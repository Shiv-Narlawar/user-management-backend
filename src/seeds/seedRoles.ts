import { AppDataSource } from "../config/data-source";
import { Role, RoleName } from "../entities/role.entity";

export const seedRoles = async () => {
  const roleRepo = AppDataSource.getRepository(Role);

  const roles = Object.values(RoleName);

  for (const roleName of roles) {
    const existing = await roleRepo.findOne({
      where: { name: roleName },
    });

    if (!existing) {
      await roleRepo.save(
        roleRepo.create({
          name: roleName,
        })
      );
      console.log(`Role ${roleName} created`);
    }
  }

  console.log("Roles seeding completed.");
};