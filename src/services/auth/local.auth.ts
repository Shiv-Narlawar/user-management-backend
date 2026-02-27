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
import { Role } from "../../entities/role.entity";
import { RefreshToken } from "../../entities/refresh-token.entity";

import bcrypt from "bcrypt";
import crypto from "crypto";

export class LocalAuthService implements AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);
  private refreshRepo = AppDataSource.getRepository(RefreshToken);

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private validatePassword(password: string) {
    if (!password || password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
  }

  
     //SIGNUP
  
  async signup(
    name: string,
    email: string,
    password: string,
    roleName: string
  ): Promise<AuthResponse> {
    if (!name?.trim()) throw new Error("Name is required");
    if (!email?.trim()) throw new Error("Email is required");

    this.validatePassword(password);

    const allowedRoles = ["USER", "MANAGER"];
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Invalid role selection");
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) throw new Error("User already exists");

    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) throw new Error("Invalid role");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepo.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepo.save(newUser);

    return {
      message: "User registered successfully",
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role.name,
        status: savedUser.status,
      },
    };
  }

  
     //LOGIN
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required");
    }

    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("role.permissions", "permission")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) throw new Error("Invalid email or password");
    if (user.status !== UserStatus.ACTIVE)
      throw new Error("Account is inactive");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    const permissions = (user.role.permissions || []).map(p => p.name);

    // Create refresh token record
    const refreshRecord = this.refreshRepo.create({
      user,
      tokenHash: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const saved = await this.refreshRepo.save(refreshRecord);

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
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
        role: user.role.name,
        status: user.status,
        permissions,
      },
    };
  }


     //REFRESH
  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) throw new Error("Refresh token is required");

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new Error("Invalid refresh token");

    const tokenHash = this.hashToken(refreshToken);

    const record = await this.refreshRepo.findOne({
      where: { id: payload.jti },
      relations: ["user", "user.role", "user.role.permissions"],
    });

    if (!record) throw new Error("Invalid refresh token");
    if (record.revokedAt) throw new Error("Refresh token revoked");
    if (record.expiresAt < new Date())
      throw new Error("Refresh token expired");
    if (record.tokenHash !== tokenHash)
      throw new Error("Invalid refresh token");

    const user = record.user;
    if (user.status !== UserStatus.ACTIVE)
      throw new Error("Account is inactive");

    const permissions = (user.role.permissions || []).map(p => p.name);

    // Rotate token
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
      role: user.role.name,
      permissions,
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        permissions,
      },
    };
  }

  
     //LOGOUT

  async logout(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) throw new Error("Refresh token is required");

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new Error("Invalid refresh token");

    const record = await this.refreshRepo.findOne({
      where: { id: payload.jti },
    });

    if (record && !record.revokedAt) {
      record.revokedAt = new Date();
      await this.refreshRepo.save(record);
    }

    return { message: "Logged out successfully" };
  }

  
     //FORGOT PASSWORD
  
  async forgotPassword(email: string): Promise<AuthResponse> {
    if (!email?.trim()) throw new Error("Email is required");

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    const resetCode = crypto.randomInt(100000, 999999).toString();

    user.resetCode = resetCode;
    user.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.save(user);

    return { message: "Reset code generated" };
  }


     //RESET PASSWORD
  
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResponse> {
    if (!email?.trim() || !code?.trim())
      throw new Error("Email and code are required");

    this.validatePassword(newPassword);

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    if (
      user.resetCode !== code ||
      !user.resetCodeExpiry ||
      user.resetCodeExpiry < new Date()
    ) {
      throw new Error("Invalid or expired reset code");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await this.userRepo.save(user);

    // Revoke all refresh tokens on password reset
    await this.refreshRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where("userId = :userId AND revokedAt IS NULL", { userId: user.id })
      .execute();

    return { message: "Password reset successful" };
  }

  
     //FORGOT USERNAME
  
  async forgotUsername(email: string): Promise<AuthResponse> {
    if (!email?.trim()) throw new Error("Email is required");

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    return { message: `Your username is ${user.name}` };
  }

  
     //VALIDATE ACCESS TOKEN

  async validate(token: string): Promise<AccessPayload | null> {
    return verifyAccessToken(token);
  }
}