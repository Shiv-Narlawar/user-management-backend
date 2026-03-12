import { UserService } from "../../src/services/user.service";
import { AppDataSource } from "../../src/config/data-source";
import { RoleName } from "../../src/entities/role.entity";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
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

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    userService = new UserService();
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
      const managers = [{ id: "1", roleName: RoleName.MANAGER }];
      mockRepository.find.mockResolvedValue(managers);

      const result = await userService.getManagers();

      expect(result).toEqual(managers);
      expect(mockRepository.find).toHaveBeenCalled();
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