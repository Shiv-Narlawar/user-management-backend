import { UserService } from "../../src/services/user.service";
import { AppDataSource } from "../../src/config/data-source";
import { RoleName } from "../../src/entities/role.entity";
import { Auth0ManagementService } from "../../src/services/auth/auth0Management.service";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock("../../src/services/auth/auth0Management.service", () => ({
  Auth0ManagementService: jest.fn().mockImplementation(() => ({
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    sendPasswordSetupEmail: jest.fn(),
    getAppLoginUrl: jest.fn(),
  })),
}));

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: any;
  let mockRoleRepository: any;
  let mockDepartmentRepository: any;
  let mockQueryBuilder: any;
  let mockAuth0ManagementService: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    };

    mockRoleRepository = {
      findOne: jest.fn(),
    };

    mockDepartmentRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockRepository)
      .mockReturnValueOnce(mockRoleRepository)
      .mockReturnValueOnce(mockDepartmentRepository);

    userService = new UserService();
    mockAuth0ManagementService = (Auth0ManagementService as jest.Mock).mock
      .results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // GET ALL USERS
  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const users = [{ id: "1", name: "Test" }];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 1]);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result.data).toEqual(users);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should apply search filter", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await userService.getAllUsers({ search: "john" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it("should apply department filter", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await userService.getAllUsers({ departmentId: "dept1" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  // GET USER BY ID
  describe("getUserById", () => {
    it("should return user", async () => {
      const user = { id: "1", name: "Test" };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserById("1");

      expect(result).toEqual(user);
    });

    it("should return null if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.getUserById("99");

      expect(result).toBeNull();
    });
  });

  // GET MANAGERS
  describe("getManagers", () => {
    it("should return managers", async () => {
      const managers = [{ id: "1", name: "Manager" }];

      mockQueryBuilder.getMany.mockResolvedValue(managers);

      const result = await userService.getManagers();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(result).toEqual(managers);
    });
  });

  // FIND USER BY EMAIL
  describe("findUserByEmail", () => {
    it("should return user by email", async () => {
      const user = { email: "test@test.com" };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.findUserByEmail("test@test.com");

      expect(result).toEqual(user);
    });
  });

  // CREATE USER
  describe("createUser", () => {
    it("should create and save user", async () => {
      const data = { name: "John", email: "john@test.com" };
      const savedUser = { id: "1", ...data };

      mockRepository.create.mockReturnValue(data);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await userService.createUser(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(savedUser);
    });
  });

  describe("createAdminUser", () => {
    it("should create user in Auth0 and database", async () => {
      const role = { id: "role-1", name: RoleName.USER, permissions: [] };
      const auth0User = { user_id: "auth0|123" };
      const dbUser = {
        name: "John",
        email: "john@test.com",
        auth0Sub: auth0User.user_id,
        role,
        roleName: RoleName.USER,
        departmentId: null,
        status: "ACTIVE",
      };
      const savedUser = { id: "1", ...dbUser };

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockAuth0ManagementService.createUser.mockResolvedValue(auth0User);
      mockAuth0ManagementService.sendPasswordSetupEmail.mockResolvedValue(
        undefined
      );
      mockAuth0ManagementService.getAppLoginUrl.mockReturnValue(
        "https://app.example.com/login"
      );
      mockRepository.create.mockReturnValue(dbUser);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await userService.createAdminUser({
        name: "John",
        email: "john@test.com",
        roleName: RoleName.USER,
      });

      expect(mockAuth0ManagementService.createUser).toHaveBeenCalledWith({
        name: "John",
        email: "john@test.com",
      });
      expect(mockAuth0ManagementService.sendPasswordSetupEmail).toHaveBeenCalledWith(
        "john@test.com"
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        user: savedUser,
        invitation: {
          emailSent: true,
          appLoginLink: "https://app.example.com/login",
        },
      });
    });

    it("should rollback Auth0 user if database save fails", async () => {
      const role = { id: "role-1", name: RoleName.USER, permissions: [] };
      const auth0User = { user_id: "auth0|123" };
      const dbUser = {
        name: "John",
        email: "john@test.com",
        auth0Sub: auth0User.user_id,
        role,
        roleName: RoleName.USER,
        departmentId: null,
        status: "ACTIVE",
      };

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockAuth0ManagementService.createUser.mockResolvedValue(auth0User);
      mockRepository.create.mockReturnValue(dbUser);
      mockRepository.save.mockRejectedValue(new Error("DB failure"));

      await expect(
        userService.createAdminUser({
          name: "John",
          email: "john@test.com",
          roleName: RoleName.USER,
        })
      ).rejects.toThrow("DB failure");

      expect(mockAuth0ManagementService.deleteUser).toHaveBeenCalledWith(
        auth0User.user_id
      );
    });
  });

  // UPDATE USER
  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const user = { id: "1", name: "Old" };
      const updated = { id: "1", name: "New" };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(updated);

      const result = await userService.updateUser("1", { name: "New" });

      expect(result).toEqual(updated);
    });

    it("should return null if user does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.updateUser("99", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  // DELETE USER
  describe("deleteUser", () => {
    it("should soft delete user", async () => {
      const user = { id: "1" };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.softRemove.mockResolvedValue(user);

      const result = await userService.deleteUser("1");

      expect(result).toBe(true);
      expect(mockRepository.softRemove).toHaveBeenCalled();
    });

    it("should return false if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.deleteUser("99");

      expect(result).toBe(false);
    });
  });

  // UPDATE MY PROFILE
  describe("updateMyProfile", () => {
    it("should update profile name", async () => {
      const user = {
        id: "1",
        name: "Old",
        email: "test@test.com",
        roleName: "USER",
        status: "ACTIVE",
      };

      const saved = { ...user, name: "New" };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(saved);

      const result = await userService.updateMyProfile("1", { name: "New" });

      expect(result?.name).toBe("New");
    });

    it("should return null if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.updateMyProfile("99", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  // GET UNASSIGNED USERS
  describe("getUnassignedUsers", () => {
    it("should return users without department", async () => {
      const users = [{ id: "1", roleName: RoleName.USER }];

      mockRepository.find.mockResolvedValue(users);

      const result = await userService.getUnassignedUsers();

      expect(result).toEqual(users);
    });
  });
});
