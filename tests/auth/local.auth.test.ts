import { LocalAuthService } from "../../src/services/auth/local.auth";

describe("LocalAuthService", () => {
  const authService = new LocalAuthService();

  it("should login successfully with correct credentials", async () => {
    const result = await authService.login(
      "admin@test.com",
      "123456"
    );

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("admin@test.com");
  });

  it("should throw error for wrong password", async () => {
    await expect(
      authService.login("admin@test.com", "wrong")
    ).rejects.toThrow("Invalid email or password");
  });
});
