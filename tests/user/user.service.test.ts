import { UserService } from "../../src/services/user.service";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // CREATE USER TESTS
  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@test.com",
        password: "123456",
        status: "ACTIVE",
      };

      const mockUser = { id: "1", ...userData };

      mockRepository.create.mockReturnValue(userData);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(result.id).toBe("1");
      expect(result.email).toBe("john@test.com");
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      const invalidData = {
        name: "Test",
        email: "invalid-email",
        password: "123456",
      };

      mockRepository.create.mockReturnValue(invalidData);
      mockRepository.save.mockRejectedValue(new Error("Invalid email"));

      await expect(userService.createUser(invalidData)).rejects.toThrow("Invalid email");
    });

    it("should handle duplicate email error", async () => {
      const userData = {
        name: "Test",
        email: "duplicate@test.com",
        password: "123456",
      };

      mockRepository.create.mockReturnValue(userData);
      mockRepository.save.mockRejectedValue(new Error("Duplicate email"));

      await expect(userService.createUser(userData)).rejects.toThrow("Duplicate email");
    });
  });

  // GET ALL USERS TESTS
  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: "1", email: "user1@test.com", name: "User 1" },
        { id: "2", email: "user2@test.com", name: "User 2" },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["role", "applications"],
      });
    });

    it("should return empty array when no users exist", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle database errors when fetching all users", async () => {
      mockRepository.find.mockRejectedValue(new Error("Database error"));

      await expect(userService.getAllUsers()).rejects.toThrow("Database error");
    });
  });

  // GET USER BY ID TESTS
  describe("getUserById", () => {
    it("should return a user by id", async () => {
      const mockUser = { id: "1", email: "user@test.com", name: "Test User", role: {} };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserById("1");

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["role"],
      });
    });

    it("should return null when user does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.getUserById("non-existent-id");

      expect(result).toBeNull();
    });

    it("should handle database errors when fetching user by id", async () => {
      mockRepository.findOne.mockRejectedValue(new Error("Database error"));

      await expect(userService.getUserById("1")).rejects.toThrow("Database error");
    });
  });

  // UPDATE USER TESTS
  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const updateData = { name: "Updated Name", status: "INACTIVE" };
      const mockUser = { id: "1", email: "user@test.com", ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.updateUser("1", updateData);

      expect(result).toEqual(mockUser);
      expect(mockRepository.update).toHaveBeenCalledWith("1", updateData);
    });

    it("should perform partial update", async () => {
      const partialUpdate = { name: "New Name" };
      const mockUser = { id: "1", email: "user@test.com", ...partialUpdate };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.updateUser("1", partialUpdate);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("New Name");
    });

    it("should return user with updated data when user exists", async () => {
      const updateData = { status: "SUSPENDED" };
      const mockUser = { id: "1", email: "user@test.com", status: "SUSPENDED" };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.updateUser("1", updateData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe("SUSPENDED");
    });

    it("should handle non-existent user update", async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.updateUser("non-existent", { name: "Test" });

      expect(result).toBeNull();
    });

    it("should handle database errors during update", async () => {
      mockRepository.update.mockRejectedValue(new Error("Database error"));

      await expect(userService.updateUser("1", { name: "Test" })).rejects.toThrow("Database error");
    });
  });

  // DELETE USER TESTS
  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await userService.deleteUser("1");

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should return false when user does not exist", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await userService.deleteUser("non-existent-id");

      expect(result).toBe(false);
    });

    it("should handle database errors during deletion", async () => {
      mockRepository.delete.mockRejectedValue(new Error("Database error"));

      await expect(userService.deleteUser("1")).rejects.toThrow("Database error");
    });

    it("should return true for single deleted user", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await userService.deleteUser("1");

      expect(result).toBe(true);
    });

    it("should return false when delete result shows zero affected rows", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await userService.deleteUser("1");

      expect(result).toBe(false);
    });
  });
});
