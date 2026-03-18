import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { IsNull } from "typeorm";
import { RoleName } from "../entities/role.entity";
import { Role } from "../entities/role.entity";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  // ================= GET ALL USERS =================
  async getAllUsers(params?: {
    search?: string;
    departmentId?: string;
    role?: RoleName;
    page?: number;
    limit?: number;
    sort?: "ASC" | "DESC";
  }) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;

    const sort = params?.sort === "ASC" ? "ASC" : "DESC";

    const qb = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.department", "department")
      .where("user.deletedAt IS NULL");

    const search = params?.search?.trim();

    if (search) {
      qb.andWhere("(user.name ILIKE :q OR user.email ILIKE :q)", {
        q: `%${search}%`,
      });
    }

    if (params?.role) {
  qb.andWhere("user.roleName = :role", {
    role: params.role,
  });
}

    // Department Filtering
    if (params?.departmentId) {
      qb.andWhere("user.departmentId = :departmentId", {
        departmentId: params.departmentId,
      });
    }

    qb.orderBy("user.createdAt", sort)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ================= GET USER BY ID =================
  async getUserById(id: string) {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["role"],
    });
  }

  // ================= GET MANAGERS =================
  async getManagers() {
    return this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("role.name = :role", { role: RoleName.MANAGER })
      .andWhere("user.deletedAt IS NULL")
      .select(["user.id", "user.name", "user.email", "role.name"])
      .orderBy("user.name", "ASC")
      .getMany();
  }

  // ================= FIND USER BY EMAIL =================
  async findUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  // ================= CREATE USER =================
  async createUser(data: Partial<User>) {
    const { deletedAt, ...safe } = data as Partial<User> & {
      deletedAt?: unknown;
    };

    const user = this.userRepository.create(safe);

    if (user.role) {
      user.roleName = user.role.name;
    }

    return this.userRepository.save(user);
  }

  // ================= UPDATE USER =================
  async updateUser(id: string, data: Partial<User>) {

  const user = await this.userRepository.findOne({
    where: { id, deletedAt: IsNull() },
    relations: ["role"],
  });

  if (!user) return null;

  const roleRepo = AppDataSource.getRepository(Role);

  const { deletedAt, roleName, ...safe } = data as Partial<User> & {
    deletedAt?: unknown;
  };

  // update status
  if (safe.status !== undefined) {
    user.status = safe.status;
  }

  // update department
  if (safe.departmentId !== undefined) {
    user.departmentId = safe.departmentId;
  }

  // ⭐ FIX ROLE UPDATE
  if (roleName !== undefined) {

    const role = await roleRepo.findOne({
  where: {
    name: roleName as RoleName,
  },
});

    if (!role) {
      throw new Error("Role not found");
    }

    user.role = role;          // sets roleId
    user.roleName = role.name; // keeps column synced
  }

  return this.userRepository.save(user);
}

  // ================= DELETE USER =================
  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) return false;

    await this.userRepository.softRemove(user);

    return true;
  }

  // ================= UPDATE MY PROFILE =================
  async updateMyProfile(userId: string, data: { name: string }) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: ["role"],
    });

    if (!user) return null;

    user.name = data.name;

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      roleName: saved.role?.name ?? saved.roleName,
      status: saved.status,
    };
  }

  // ================= GET UNASSIGNED MANAGERS =================
  async getUnassignedManagers() {
    return this.userRepository
      .createQueryBuilder("user")
      .leftJoin("department", "dept", "dept.managerId = user.id")
      .where("user.roleName = :role", { role: RoleName.MANAGER })
      .andWhere("dept.id IS NULL")
      .select(["user.id", "user.name", "user.email"])
      .getMany();
  }

  // ================= GET UNASSIGNED USERS =================
  async getUnassignedUsers() {
    return this.userRepository.find({
      where: {
        roleName: RoleName.USER,
        departmentId: IsNull(),
        deletedAt: IsNull(),
      },
      select: ["id", "name", "email", "roleName"],
      order: { name: "ASC" },
    });
  }
}