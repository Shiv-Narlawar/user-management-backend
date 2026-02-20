import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/user.entity";
import { Role, RoleName } from "../entities/role.entity";

export async function seedAdminUser() {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const adminName = process.env.ADMIN_NAME || "Super Admin";
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
    );
  }

  const adminRole = await roleRepo.findOne({
    where: { name: RoleName.ADMIN },
  });

  if (!adminRole) {
    throw new Error("ADMIN role not found");
  }

  const existing = await userRepo.findOne({
    where: { email: adminEmail },
    relations: ["role"],
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (existing) {
    let updated = false;

    if (existing.role?.id !== adminRole.id) {
      existing.role = adminRole;
      existing.roleName = RoleName.ADMIN;
      updated = true;
    }

    if (existing.status !== UserStatus.ACTIVE) {
      existing.status = UserStatus.ACTIVE;
      updated = true;
    }

    existing.password = hashedPassword;
    existing.mustChangePassword = true;
    existing.tempPasswordExpiry = expiresAt;
    updated = true;

    await userRepo.save(existing);

    console.log(
      updated
        ? "Admin user updated/reset (role/status/password ensured)."
        : "Admin user already exists."
    );
    console.log("Admin email loaded from env.");
    console.log("Temporary Password Expires:", expiresAt.toISOString());
    return;
  }

  const admin = userRepo.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    status: UserStatus.ACTIVE,
    role: adminRole,
    roleName: RoleName.ADMIN,
    mustChangePassword: true,
    tempPasswordExpiry: expiresAt,
  });

  await userRepo.save(admin);

  console.log("Admin user created successfully.");
  console.log("Admin email loaded from env.");
  console.log("Temporary Password Expires:", expiresAt.toISOString());
}