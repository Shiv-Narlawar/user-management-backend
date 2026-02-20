import { LocalAuthService } from "../../src/services/auth/local.auth";
import { AppDataSource } from "../../src/config/data-source";
import bcrypt from "bcrypt";
import { ApiError } from "../../src/utils/apiError";
import { RoleName } from "../../src/entities/role.entity";
import { UserStatus } from "../../src/entities/user.entity";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock("bcrypt");

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
      const mockRole = {
        name: RoleName.USER,
        permissions: [{ name: "USER_VIEW" }],
      };

      const mockUser = {
        id: "1",
        name: "John",
        email: "john@test.com",
        status: UserStatus.ACTIVE,
      };

      userRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      roleRepo.findOne.mockResolvedValue(mockRole);

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      refreshRepo.create.mockReturnValue({ id: "refresh1" });
      refreshRepo.save.mockResolvedValue({ id: "refresh1" });

      const result = await authService.signup(
        "John",
        "john@test.com",
        "password123",
        RoleName.USER
      );

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user?.email).toBe("john@test.com");
    });

    it("should throw if user already exists", async () => {
      userRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: "1" }),
      });

      await expect(
        authService.signup("John", "john@test.com", "password123", RoleName.USER)
      ).rejects.toThrow(ApiError);
    });
  });

  // LOGIN
  describe("login", () => {
    it("should login user successfully", async () => {
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

    it("should throw if password is wrong", async () => {
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
  });

  // UPDATE PASSWORD
  describe("updatePassword", () => {
    it("should update password", async () => {
      const user = { id: "1", password: "hashed" };

      userRepo.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("newHash");

      userRepo.save.mockResolvedValue(user);

      const result = await authService.updatePassword(
        "1",
        "oldpass",
        "newpassword"
      );

      expect(result.message).toBe("Password updated successfully");
    });
  });

  // LOGOUT
  describe("logout", () => {
    it("should revoke refresh token", async () => {
      const { verifyRefreshToken } = require("../../src/services/auth/jwt");

      verifyRefreshToken.mockReturnValue({ jti: "1" });

      refreshRepo.findOne.mockResolvedValue({ id: "1" });

      const result = await authService.logout("refresh");

      expect(result.message).toBe("Logged out successfully");
    });
  });

  // VALIDATE TOKEN
  describe("validate", () => {
    it("should validate access token", async () => {
      const { verifyAccessToken } = require("../../src/services/auth/jwt");

      verifyAccessToken.mockReturnValue({ id: "1" });

      const result = await authService.validate("token");

      expect(result).toEqual({ id: "1" });
    });
  });
});