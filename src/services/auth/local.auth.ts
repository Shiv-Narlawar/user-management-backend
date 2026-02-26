import { AuthService, AuthResponse } from "./auth.interface";
import { generateToken, verifyToken, JwtPayload } from "./jwt";
import { AppDataSource } from "../../config/data-source";
import { User, UserStatus } from "../../entities/user.entity";
import { Role } from "../../entities/role.entity";
import bcrypt from "bcrypt";
import crypto from "crypto";

export class LocalAuthService implements AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);

  private validatePassword(password: string) {
    if (!password || password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
  }

  // signup
  async signup(
    name: string,
    email: string,
    password: string,
    roleName: string
  ): Promise<AuthResponse> {
    const allowedRoles = ["USER", "MANAGER"];
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Invalid role selection");
    }

    if (!name?.trim()) throw new Error("Name is required");
    if (!email?.trim()) throw new Error("Email is required");

    // ✅ password rule
    this.validatePassword(password);

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
      },
    };
  }

  // login
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required");
    }

    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password") // because password is select:false
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("role.permissions", "permission")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) throw new Error("Invalid email or password");

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("Account is inactive");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    const permissions = (user.role.permissions || []).map((p) => p.name);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });

    // ✅ return a safe DTO (no entity spread, no password)
    return {
      token,
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

  // forgot password
  async forgotPassword(email: string): Promise<AuthResponse> {
    if (!email?.trim()) throw new Error("Email is required");

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    const resetCode = crypto.randomInt(100000, 999999).toString();

    user.resetCode = resetCode;
    user.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.save(user);

    return {
      message: "Reset code generated",
      // In production send via email, don't return code in response
    };
  }

  // reset password
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResponse> {
    if (!email?.trim() || !code?.trim()) {
      throw new Error("Email and code are required");
    }

    // ✅ password rule
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await this.userRepo.save(user);

    return { message: "Password reset successful" };
  }

  // forgot username
  async forgotUsername(email: string): Promise<AuthResponse> {
    if (!email?.trim()) throw new Error("Email is required");

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    return { message: `Your username is ${user.name}` };
  }

  // validate token
  async validate(token: string): Promise<JwtPayload | null> {
    return verifyToken(token);
  }
}