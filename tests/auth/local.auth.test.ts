import { LocalAuthService } from "../../src/services/auth/local.auth";
import { AppDataSource } from "../../src/config/data-source";
import bcrypt from "bcrypt";
import { ApiError } from "../../src/utils/apiError";
import { RoleName } from "../../src/entities/role.entity";
import { UserStatus } from "../../src/entities/user.entity";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../../src/services/auth/jwt";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../../src/services/auth/jwt", () => ({
  signAccessToken: jest.fn(() => "access-token"),
  signRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

describe("LocalAuthService", () => {
  let authService: LocalAuthService;
  let userRepo: any;
  let roleRepo: any;
  let refreshRepo: any;

  beforeEach(() => {
    userRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    roleRepo = {
      findOne: jest.fn(),
    };

    refreshRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(userRepo)
      .mockReturnValueOnce(roleRepo)
      .mockReturnValueOnce(refreshRepo);

    authService = new LocalAuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SIGNUP
  describe("signup", () => {
    it("should create a new user", async () => {
      const role = {
        name: RoleName.USER,
        permissions: [{ name: "USER_VIEW" }],
      };

      const user = {
        id: "1",
        name: "John",
        email: "john@test.com",
        status: UserStatus.ACTIVE,
        role,
      };

      userRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      roleRepo.findOne.mockResolvedValue(role);

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);

      refreshRepo.create.mockReturnValue({ id: "refresh1" });
      refreshRepo.save.mockResolvedValue({ id: "refresh1" });

      const result = await authService.signup(
        "John",
        "john@test.com",
        "password123",
        RoleName.USER
      );

      expect(signAccessToken).toHaveBeenCalled();
      expect(signRefreshToken).toHaveBeenCalled();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error if user already exists", async () => {
      userRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: "1" }),
      });

      await expect(
        authService.signup("John", "john@test.com", "password", RoleName.USER)
      ).rejects.toThrow(ApiError);
    });
  });

  // LOGIN
  describe("login", () => {
    it("should login successfully", async () => {
      const user = {
        id: "1",
        email: "test@test.com",
        password: "hashed",
        status: UserStatus.ACTIVE,
        role: {
          name: RoleName.USER,
          permissions: [{ name: "USER_VIEW" }],
        },
      };

      userRepo.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      refreshRepo.create.mockReturnValue({ id: "1" });
      refreshRepo.save.mockResolvedValue({ id: "1" });

      const result = await authService.login("test@test.com", "password");

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error if password incorrect", async () => {
      const user = {
        id: "1",
        email: "test@test.com",
        password: "hashed",
        status: UserStatus.ACTIVE,
        role: { name: RoleName.USER, permissions: [] },
      };

      userRepo.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login("test@test.com", "wrong")
      ).rejects.toThrow(ApiError);
    });

    it("should throw error if user not found", async () => {
      userRepo.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login("missing@test.com", "password")
      ).rejects.toThrow(ApiError);
    });
  });

  // LOGOUT
  describe("logout", () => {
    it("should revoke refresh token", async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ jti: "1" });

      refreshRepo.findOne.mockResolvedValue({ id: "1" });

      const result = await authService.logout("refresh");

      expect(result.message).toBe("Logged out successfully");
    });

    it("should still return success if refresh token not found", async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ jti: "999" });

      refreshRepo.findOne.mockResolvedValue(null);

      const result = await authService.logout("invalid");

      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });

  // VALIDATE
  describe("validate", () => {
    it("should validate access token", async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue({ id: "1" });

      const result = await authService.validate("token");

      expect(result).toEqual({ id: "1" });
    });

    it("should throw error for invalid token", async () => {
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.validate("bad-token")).rejects.toThrow();
    });
  });
});