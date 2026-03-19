import { UserService } from "../../src/services/user.service";
import { AppDataSource } from "../../src/config/data-source";
import { RoleName } from "../../src/entities/role.entity";
import { UserStatus } from "../../src/entities/user.entity";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: any;
  let mockRoleRepository: any;
  let mockQueryBuilder: any;

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

    mockUserRepository = {
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

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockUserRepository)
      .mockReturnValueOnce(mockRoleRepository);

    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findUserByAuth0Sub", () => {
    it("should return the user for a matching auth0 subject", async () => {
      const user = { id: "1", auth0Sub: "auth0|123" };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findUserByAuth0Sub("auth0|123");

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Sub: "auth0|123", deletedAt: expect.any(Object) },
        relations: ["role", "role.permissions"],
      });
      expect(result).toEqual(user);
    });
  });

  describe("findUserByEmail", () => {
    it("should return user by email", async () => {
      const user = { email: "test@test.com" };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findUserByEmail("test@test.com");

      expect(result).toEqual(user);
    });
  });

  describe("createUserFromAuth0", () => {
    it("should create a user with the default role", async () => {
      const role = { name: RoleName.USER, permissions: [] };
      const created = { name: "john", email: "john@test.com", role };
      const saved = { id: "1", ...created };

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockUserRepository.create.mockReturnValue(created);
      mockUserRepository.save.mockResolvedValue(saved);

      const result = await userService.createUserFromAuth0({
        sub: "auth0|1",
        email: "john@test.com",
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: "john",
        email: "john@test.com",
        auth0Sub: "auth0|1",
        role,
        roleName: RoleName.USER,
        status: UserStatus.ACTIVE,
      });
      expect(result).toEqual(saved);
    });

    it("should prefer the provided name over the email prefix", async () => {
      const role = { name: RoleName.USER, permissions: [] };
      mockRoleRepository.findOne.mockResolvedValue(role);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({ id: "1", name: "John Doe" });

      await userService.createUserFromAuth0({
        sub: "auth0|2",
        email: "john@test.com",
        name: "John Doe",
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "John Doe" })
      );
    });

    it("should throw when the default role does not exist", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.createUserFromAuth0({
          sub: "auth0|1",
          email: "john@test.com",
        })
      ).rejects.toThrow("Default role not found");
    });
  });

  describe("findOrCreateUser", () => {
    it("should throw if email is missing", async () => {
      await expect(
        userService.findOrCreateUser({
          sub: "auth0|1",
          email: "",
        })
      ).rejects.toThrow("Email missing in token");
    });

    it("should return a normalized user found by auth0 subject", async () => {
      const existingUser = {
        id: "1",
        email: "john@test.com",
        name: "John",
        status: UserStatus.ACTIVE,
        departmentId: "dept-1",
        role: {
          name: RoleName.ADMIN,
          permissions: [{ name: "USER_VIEW" }, { name: "USER_EDIT" }],
        },
      };

      const findByAuth0Spy = jest
        .spyOn(userService, "findUserByAuth0Sub")
        .mockResolvedValue(existingUser as any);
      const findByEmailSpy = jest.spyOn(userService, "findUserByEmail");

      const result = await userService.findOrCreateUser({
        sub: "auth0|1",
        email: "john@test.com",
        name: "John",
      });

      expect(findByAuth0Spy).toHaveBeenCalledWith("auth0|1");
      expect(findByEmailSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: "1",
        email: "john@test.com",
        name: "John",
        role: RoleName.ADMIN,
        permissions: ["USER_VIEW", "USER_EDIT"],
        departmentId: "dept-1",
      });
    });

    it("should link an existing email-only user to the auth0 subject", async () => {
      const existingUser = {
        id: "1",
        email: "john@test.com",
        name: "John",
        auth0Sub: null,
        status: UserStatus.ACTIVE,
        departmentId: null,
        role: {
          name: RoleName.USER,
          permissions: [{ name: "USER_VIEW" }],
        },
      };

      jest.spyOn(userService, "findUserByAuth0Sub").mockResolvedValue(null);
      jest.spyOn(userService, "findUserByEmail").mockResolvedValue(existingUser as any);
      mockUserRepository.save.mockImplementation(async (user: any) => user);

      const result = await userService.findOrCreateUser({
        sub: "auth0|linked",
        email: "john@test.com",
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ auth0Sub: "auth0|linked" })
      );
      expect(result).toEqual({
        id: "1",
        email: "john@test.com",
        name: "John",
        role: RoleName.USER,
        permissions: ["USER_VIEW"],
        departmentId: undefined,
      });
    });

    it("should create a user when none exists", async () => {
      const createdUser = {
        id: "2",
        email: "new@test.com",
        name: "New User",
        status: UserStatus.ACTIVE,
        departmentId: null,
        role: {
          name: RoleName.USER,
          permissions: [],
        },
      };

      jest.spyOn(userService, "findUserByAuth0Sub").mockResolvedValue(null);
      jest.spyOn(userService, "findUserByEmail").mockResolvedValue(null);
      const createSpy = jest
        .spyOn(userService, "createUserFromAuth0")
        .mockResolvedValue(createdUser as any);

      const result = await userService.findOrCreateUser({
        sub: "auth0|new",
        email: "new@test.com",
        name: "New User",
      });

      expect(createSpy).toHaveBeenCalledWith({
        sub: "auth0|new",
        email: "new@test.com",
        name: "New User",
      });
      expect(result.role).toBe(RoleName.USER);
    });

    it("should fall back to the USER role when the user has no role relation", async () => {
      const existingUser = {
        id: "1",
        email: "john@test.com",
        name: "John",
        status: UserStatus.ACTIVE,
        departmentId: null,
        role: null,
      };

      jest.spyOn(userService, "findUserByAuth0Sub").mockResolvedValue(existingUser as any);

      const result = await userService.findOrCreateUser({
        sub: "auth0|1",
        email: "john@test.com",
      });

      expect(result).toEqual({
        id: "1",
        email: "john@test.com",
        name: "John",
        role: RoleName.USER,
        permissions: [],
        departmentId: undefined,
      });
    });

    it("should throw for inactive users", async () => {
      const existingUser = {
        id: "1",
        email: "inactive@test.com",
        name: "Inactive",
        status: UserStatus.INACTIVE,
        role: { name: RoleName.USER, permissions: [] },
      };

      jest.spyOn(userService, "findUserByAuth0Sub").mockResolvedValue(existingUser as any);

      await expect(
        userService.findOrCreateUser({
          sub: "auth0|inactive",
          email: "inactive@test.com",
        })
      ).rejects.toThrow("Account inactive");
    });
  });

  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const users = [{ id: "1", name: "Test" }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 1]);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should apply search, role, department, sort, skip, and take filters", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await userService.getAllUsers({
        search: "  john  ",
        role: RoleName.MANAGER,
        departmentId: "dept1",
        page: 2,
        limit: 5,
        sort: "ASC",
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(user.name ILIKE :q OR user.email ILIKE :q)",
        { q: "%john%" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "role.name = :role",
        { role: RoleName.MANAGER }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "user.departmentId = :departmentId",
        { departmentId: "dept1" }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("user.createdAt", "ASC");
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it("should use default pagination and descending sort when params are invalid", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await userService.getAllUsers({ page: 0, limit: -1 });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("user.createdAt", "DESC");
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(0);
    });
  });

  describe("getUserById", () => {
    it("should return user", async () => {
      const user = { id: "1", name: "Test" };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserById("1");

      expect(result).toEqual(user);
    });

    it("should return null if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await userService.getUserById("99");

      expect(result).toBeNull();
    });
  });

  describe("getManagers", () => {
    it("should return managers", async () => {
      const managers = [{ id: "1", name: "Manager" }];
      mockQueryBuilder.getMany.mockResolvedValue(managers);

      const result = await userService.getManagers();

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith("user.role", "role");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("role.name = :role", {
        role: RoleName.MANAGER,
      });
      expect(result).toEqual(managers);
    });
  });

  describe("createUser", () => {
    it("should create and save user", async () => {
      const data = { name: "John", email: "john@test.com" };
      const savedUser = { id: "1", ...data };

      mockUserRepository.create.mockReturnValue(data);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await userService.createUser(data);

      expect(mockUserRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(savedUser);
    });

    it("should ignore deletedAt and set roleName from the role", async () => {
      const data = {
        name: "John",
        deletedAt: new Date(),
        role: { name: RoleName.MANAGER },
      };
      const created: any = { name: "John", role: { name: RoleName.MANAGER } };

      mockUserRepository.create.mockReturnValue(created);
      mockUserRepository.save.mockResolvedValue({
        id: "1",
        ...created,
        roleName: RoleName.MANAGER,
      });

      await userService.createUser(data as any);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: "John",
        role: { name: RoleName.MANAGER },
      });
      expect(created.roleName).toBe(RoleName.MANAGER);
    });
  });

  describe("updateUser", () => {
    it("should update user status and department successfully", async () => {
      const user = {
        id: "1",
        status: UserStatus.ACTIVE,
        departmentId: null,
        role: { name: RoleName.USER },
      };
      const updated = {
        ...user,
        status: UserStatus.INACTIVE,
        departmentId: "dept1",
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(updated);

      const result = await userService.updateUser("1", {
        status: UserStatus.INACTIVE,
        departmentId: "dept1",
      });

      expect(result).toEqual(updated);
    });

    it("should update the role when roleName is provided", async () => {
      const user = {
        id: "1",
        role: { name: RoleName.USER },
      };
      const managerRole = { name: RoleName.MANAGER };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRoleRepository.findOne.mockResolvedValue(managerRole);
      mockUserRepository.save.mockImplementation(async (value: any) => value);

      const result = await userService.updateUser("1", {
        roleName: RoleName.MANAGER,
      } as any);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RoleName.MANAGER },
      });
      expect(result).toEqual({
        id: "1",
        role: managerRole,
        roleName: RoleName.MANAGER,
      });
    });

    it("should throw if the provided role does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: "1",
        role: { name: RoleName.USER },
      });
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.updateUser("1", { roleName: RoleName.ADMIN } as any)
      ).rejects.toThrow("Role not found");
    });

    it("should return null if user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await userService.updateUser("99", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should soft delete user", async () => {
      const user = { id: "1" };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.softRemove.mockResolvedValue(user);

      const result = await userService.deleteUser("1");

      expect(result).toBe(true);
      expect(mockUserRepository.softRemove).toHaveBeenCalledWith(user);
    });

    it("should return false if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await userService.deleteUser("99");

      expect(result).toBe(false);
    });
  });

  describe("updateMyProfile", () => {
    it("should update profile name", async () => {
      const user = {
        id: "1",
        name: "Old",
        email: "test@test.com",
        roleName: RoleName.USER,
        status: UserStatus.ACTIVE,
        role: { name: RoleName.MANAGER },
      };
      const saved = { ...user, name: "New" };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(saved);

      const result = await userService.updateMyProfile("1", { name: "New" });

      expect(result).toEqual({
        id: "1",
        name: "New",
        email: "test@test.com",
        roleName: RoleName.MANAGER,
        status: UserStatus.ACTIVE,
      });
    });

    it("should fall back to saved roleName when role relation is missing", async () => {
      const user = {
        id: "1",
        name: "Old",
        email: "test@test.com",
        roleName: RoleName.USER,
        status: UserStatus.ACTIVE,
        role: null,
      };
      const saved = { ...user, name: "New" };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(saved);

      const result = await userService.updateMyProfile("1", { name: "New" });

      expect(result?.roleName).toBe(RoleName.USER);
    });

    it("should return null if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await userService.updateMyProfile("99", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("getUnassignedManagers", () => {
    it("should return managers not assigned to departments", async () => {
      const managers = [{ id: "1", name: "Manager" }];
      mockQueryBuilder.getMany.mockResolvedValue(managers);

      const result = await userService.getUnassignedManagers();

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        "department",
        "dept",
        "dept.managerId = user.id"
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("user.roleName = :role", {
        role: RoleName.MANAGER,
      });
      expect(result).toEqual(managers);
    });
  });

  describe("getUnassignedUsers", () => {
    it("should return users without department", async () => {
      const users = [{ id: "1", roleName: RoleName.USER }];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.getUnassignedUsers();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: {
          roleName: RoleName.USER,
          departmentId: expect.any(Object),
          deletedAt: expect.any(Object),
        },
        select: ["id", "name", "email", "roleName"],
        order: { name: "ASC" },
      });
      expect(result).toEqual(users);
    });
  });
});
