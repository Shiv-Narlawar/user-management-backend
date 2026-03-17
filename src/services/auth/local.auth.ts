import { AuthService, AuthResponse } from "./auth.interface";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  type AccessPayload,
} from "./jwt";

import { AppDataSource } from "../../config/data-source";
import { User, UserStatus } from "../../entities/user.entity";
import { Role, RoleName } from "../../entities/role.entity";
import { RefreshToken } from "../../entities/refresh-token.entity";
import { Department } from "../../entities/department.entity";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { ApiError } from "../../utils/apiError";

export class LocalAuthService implements AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);
  private refreshRepo = AppDataSource.getRepository(RefreshToken);
  private departmentRepo = AppDataSource.getRepository(Department);

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private validatePassword(password: string) {
    if (!password || password.trim().length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }
  }

  // SIGNUP
  async signup(
    name: string,
    email: string,
    password: string,
    roleName: RoleName
  ): Promise<AuthResponse> {
    if (!name?.trim()) {
      throw new ApiError(400, "Name is required");
    }

    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }

    this.validatePassword(password);

    const allowedRoles: RoleName[] = [RoleName.USER, RoleName.MANAGER];

    if (!allowedRoles.includes(roleName)) {
      throw new ApiError(400, "Invalid role selection");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.userRepo
      .createQueryBuilder("user")
      .where("LOWER(user.email) = :email", { email: normalizedEmail })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    const role = await this.roleRepo.findOne({
      where: { name: roleName },
      relations: ["permissions"],
    });

    if (!role) {
      throw new ApiError(400, "Invalid role");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let department: Department | null = null;

    if (roleName === RoleName.MANAGER) {
      department = await this.departmentRepo.findOne({
        where: { name: "General Department" },
      });
    }

    const newUser = this.userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      roleName: role.name,
      department: department ?? undefined,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepo.save(newUser);

    const permissions = (role.permissions || []).map((p) => p.name);

    const refreshRecord = this.refreshRepo.create({
      user: savedUser,
      tokenHash: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const savedRefresh = await this.refreshRepo.save(refreshRecord);

    const accessToken = signAccessToken({
      id: savedUser.id,
      email: savedUser.email,
      role: role.name,
      permissions,
      departmentId: savedUser.departmentId ?? undefined,
    });

    const refreshToken = signRefreshToken({
      id: savedUser.id,
      jti: savedRefresh.id,
    });

    savedRefresh.tokenHash = this.hashToken(refreshToken);
    await this.refreshRepo.save(savedRefresh);

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: role.name,
        status: savedUser.status,
        permissions,
        departmentId: savedUser.departmentId ?? undefined,
      },
    };
  }

  // LOGIN
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email?.trim() || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("role.permissions", "permission")
      .where("LOWER(user.email) = :email", { email: normalizedEmail })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, "Account is inactive");
    }

    // Auth0-created users won't have a local password
    if (!user.password) {
      throw new ApiError(
        401,
        "This account uses Auth0 login. Please continue with Auth0."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const permissions = (user.role?.permissions || []).map((p) => p.name);

    const refreshRecord = this.refreshRepo.create({
      user,
      tokenHash: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const saved = await this.refreshRepo.save(refreshRecord);

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role?.name ?? RoleName.USER,
      permissions,
      departmentId: user.departmentId ?? undefined,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      jti: saved.id,
    });

    saved.tokenHash = this.hashToken(refreshToken);
    await this.refreshRepo.save(saved);

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name ?? RoleName.USER,
        status: user.status,
        permissions,
        departmentId: user.departmentId ?? undefined,
      },
    };
  }

  // UPDATE PASSWORD
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    if (!userId) {
      throw new ApiError(400, "User id is required");
    }

    this.validatePassword(newPassword);

    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: userId })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.password) {
      throw new ApiError(
        400,
        "This account uses Auth0 login and does not have a local password"
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.password);

    if (!ok) {
      throw new ApiError(400, "Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    await this.refreshRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where("userId = :userId AND revokedAt IS NULL", { userId })
      .execute();

    return { message: "Password updated successfully" };
  }

  // REFRESH TOKEN
  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const tokenHash = this.hashToken(refreshToken);

    const record = await this.refreshRepo.findOne({
      where: { id: payload.jti },
      relations: ["user", "user.role", "user.role.permissions"],
    });

    if (!record || record.tokenHash !== tokenHash) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (record.revokedAt) {
      throw new ApiError(401, "Refresh token revoked");
    }

    if (record.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token expired");
    }

    const user = record.user;
    const permissions = (user.role?.permissions || []).map((p) => p.name);

    record.revokedAt = new Date();
    await this.refreshRepo.save(record);

    const newRecord = this.refreshRepo.create({
      user,
      tokenHash: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const savedNew = await this.refreshRepo.save(newRecord);

    const newRefreshToken = signRefreshToken({
      id: user.id,
      jti: savedNew.id,
    });

    savedNew.tokenHash = this.hashToken(newRefreshToken);
    await this.refreshRepo.save(savedNew);

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role?.name ?? RoleName.USER,
      permissions,
      departmentId: user.departmentId ?? undefined,
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name ?? RoleName.USER,
        status: user.status,
        permissions,
        departmentId: user.departmentId ?? undefined,
      },
    };
  }

  // LOGOUT
  async logout(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token required");
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const record = await this.refreshRepo.findOne({
      where: { id: payload.jti },
    });

    if (record) {
      record.revokedAt = new Date();
      await this.refreshRepo.save(record);
    }

    return { message: "Logged out successfully" };
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string): Promise<AuthResponse> {
    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }

    const user = await this.userRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.password) {
      throw new ApiError(
        400,
        "This account uses Auth0 login and does not support local password reset"
      );
    }

    return { message: "Email verified. Proceed to reset password." };
  }

  // RESET PASSWORD
  async resetPassword(
    email: string,
    _code: string,
    newPassword: string
  ): Promise<AuthResponse> {
    if (!email?.trim()) {
      throw new ApiError(400, "Email required");
    }

    this.validatePassword(newPassword);

    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("LOWER(user.email) = :email", {
        email: email.trim().toLowerCase(),
      })
      .getOne();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.password) {
      throw new ApiError(
        400,
        "This account uses Auth0 login and does not support local password reset"
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    await this.refreshRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where("userId = :userId", { userId: user.id })
      .execute();

    return { message: "Password updated successfully" };
  }

  // FORGOT USERNAME
  async forgotUsername(email: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return { message: `Your username is ${user.name}` };
  }

  // VALIDATE TOKEN
  async validate(token: string): Promise<AccessPayload | null> {
    return verifyAccessToken(token);
  }
}