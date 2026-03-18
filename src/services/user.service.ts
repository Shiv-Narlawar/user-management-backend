import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/user.entity";
import { IsNull } from "typeorm";
import { RoleName, Role } from "../entities/role.entity";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);

  // AUTH0 USER HANDLING

  async findUserByAuth0Sub(sub: string) {
    return this.userRepository.findOne({
    where: { auth0Sub: sub, deletedAt: IsNull() },
      relations: ["role", "role.permissions"],
    });
  }

  async findUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ["role", "role.permissions"],
    });
  }

  async createUserFromAuth0(auth: {
    sub: string;
    email: string;
    name?: string | null;
  }) {
    const defaultRole = await this.roleRepository.findOne({
      where: { name: RoleName.USER },
      relations: ["permissions"],
    });

    if (!defaultRole) {
      throw new Error("Default role not found");
    }

    const user = this.userRepository.create({
      name: auth.name ?? auth.email.split("@")[0],
      email: auth.email,
      auth0Sub: auth.sub,
      role: defaultRole,
      roleName: defaultRole.name,
      status: UserStatus.ACTIVE,
    });

    return this.userRepository.save(user);
  }

  async findOrCreateUser(auth: {
    sub: string;
    email: string;
    name?: string | null;
  }) {
    if (!auth.email) {
      throw new Error("Email missing in token");
    }

    // Try finding by auth0Sub
    let user = await this.findUserByAuth0Sub(auth.sub);

    // If not found → try by email 
    if (!user) {
      user = await this.findUserByEmail(auth.email);

      // If found by email but not linked → link it
      if (user && !user.auth0Sub) {
        user.auth0Sub = auth.sub;
        user = await this.userRepository.save(user);
      }
    }

    // If still not found → create
    if (!user) {
      user = await this.createUserFromAuth0({
        sub: auth.sub,
        email: auth.email,
        name: auth.name,
      });
    }

    // Check status
    if (user.status === UserStatus.INACTIVE) {
      throw new Error("Account inactive");
    }

    // Return normalized user
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name ?? RoleName.USER,
      permissions: (user.role?.permissions || []).map((p) => p.name),
      departmentId: user.departmentId ?? undefined,
    };
  }


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
      qb.andWhere("role.name = :role", { role: params.role });
    }

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

  async getUserById(id: string) {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["role"],
    });
  }

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

  async updateUser(id: string, data: Partial<User>) {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["role"],
    });

    if (!user) return null;

    const { deletedAt, roleName, ...safe } = data as Partial<User> & {
      deletedAt?: unknown;
    };

    if (safe.status !== undefined) {
      user.status = safe.status;
    }

    if (safe.departmentId !== undefined) {
      user.departmentId = safe.departmentId;
    }

    if (roleName !== undefined) {
      const role = await this.roleRepository.findOne({
        where: { name: roleName as RoleName },
      });

      if (!role) throw new Error("Role not found");

      user.role = role;
      user.roleName = role.name;
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) return false;

    await this.userRepository.softRemove(user);
    return true;
  }

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

  async getUnassignedManagers() {
    return this.userRepository
      .createQueryBuilder("user")
      .leftJoin("department", "dept", "dept.managerId = user.id")
      .where("user.roleName = :role", { role: RoleName.MANAGER })
      .andWhere("dept.id IS NULL")
      .select(["user.id", "user.name", "user.email"])
      .getMany();
  }

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