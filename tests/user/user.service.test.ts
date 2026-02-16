import { UserService } from "../../src/services/user.service";

describe("UserService", () => {
  const userService = new UserService();

  it("should create a new user", () => {
    const user = userService.createUser({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      role: "user",
      status: "ACTIVE",
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@test.com");
  });

  it("should return all users", () => {
    const users = userService.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
  });
});
