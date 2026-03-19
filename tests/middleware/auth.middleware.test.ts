const mockVerifyAuth0Token = jest.fn();
const mockFindOrCreateUser = jest.fn();

jest.mock("../../src/services/auth/auth0Verifier", () => ({
  verifyAuth0Token: (...args: unknown[]) => mockVerifyAuth0Token(...args),
}));

jest.mock("../../src/services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    findOrCreateUser: (...args: unknown[]) => mockFindOrCreateUser(...args),
  })),
}));

import { authMiddleware } from "../../src/middleware/auth.middleware";

describe("authMiddleware", () => {
  const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when authorization header is missing", async () => {
    const req: any = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized: No token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when bearer token format is invalid", async () => {
    const req: any = {
      headers: { authorization: "Basic token" },
    };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized: No token" });
  });

  it("should return 401 when decoded token is falsy", async () => {
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();

    mockVerifyAuth0Token.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(mockVerifyAuth0Token).toHaveBeenCalledWith("token-123");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token payload is missing sub or email", async () => {
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();

    mockVerifyAuth0Token.mockResolvedValue({
      sub: "auth0|123",
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token payload" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach the normalized user and call next", async () => {
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();
    const user = {
      id: "1",
      email: "john@test.com",
      name: "John",
      role: "USER",
      permissions: ["USER_VIEW"],
    };

    mockVerifyAuth0Token.mockResolvedValue({
      sub: "auth0|123",
      "https://user-management-api/email": "john@test.com",
      "https://user-management-api/name": "John",
    });
    mockFindOrCreateUser.mockResolvedValue(user);

    await authMiddleware(req, res, next);

    expect(mockFindOrCreateUser).toHaveBeenCalledWith({
      sub: "auth0|123",
      email: "john@test.com",
      name: "John",
    });
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it("should map inactive account errors to 403", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();

    mockVerifyAuth0Token.mockResolvedValue({
      sub: "auth0|123",
      "https://user-management-api/email": "john@test.com",
      "https://user-management-api/name": "John",
    });
    mockFindOrCreateUser.mockRejectedValue(new Error("Account inactive"));

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account inactive" });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should map missing-email errors to invalid payload", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();

    mockVerifyAuth0Token.mockRejectedValue(new Error("Email missing in token"));

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token payload" });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should map unexpected errors to unauthorized", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const req: any = {
      headers: { authorization: "Bearer token-123" },
    };
    const res = createRes();
    const next = jest.fn();

    mockVerifyAuth0Token.mockRejectedValue(new Error("boom"));

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
