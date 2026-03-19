const mockGetSigningKey = jest.fn();
const mockVerify = jest.fn();

jest.mock("jwks-rsa", () =>
  jest.fn(() => ({
    getSigningKey: mockGetSigningKey,
  }))
);

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: mockVerify,
  },
}));

describe("verifyAuth0Token", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.AUTH0_DOMAIN = "demo.auth0.com";
    process.env.AUTH0_AUDIENCE = "https://api.demo";
  });

  it("should resolve with the decoded payload", async () => {
    mockVerify.mockImplementation(
      (
        token: string,
        getKey: (header: { kid?: string }, callback: (err: Error | null, key?: string) => void) => void,
        options: Record<string, unknown>,
        callback: (err: Error | null, decoded?: Record<string, unknown>) => void
      ) => {
        expect(token).toBe("valid-token");
        expect(options).toEqual({
          audience: "https://api.demo",
          issuer: "https://demo.auth0.com/",
          algorithms: ["RS256"],
        });

        mockGetSigningKey.mockImplementation((kid: string, done: (err: Error | null, key?: any) => void) => {
          expect(kid).toBe("kid-1");
          done(null, { getPublicKey: () => "public-key" });
        });

        getKey({ kid: "kid-1" }, (err, key) => {
          expect(err).toBeNull();
          expect(key).toBe("public-key");
        });

        callback(null, { sub: "auth0|123", email: "user@test.com" });
      }
    );

    const { verifyAuth0Token } = await import("../../src/services/auth/auth0Verifier");

    await expect(verifyAuth0Token("valid-token")).resolves.toEqual({
      sub: "auth0|123",
      email: "user@test.com",
    });
  });

  it("should reject when the jwt verification callback returns an error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    mockVerify.mockImplementation(
      (
        _token: string,
        _getKey: unknown,
        _options: unknown,
        callback: (err: Error | null, decoded?: Record<string, unknown>) => void
      ) => {
        callback(new Error("invalid token"));
      }
    );

    const { verifyAuth0Token } = await import("../../src/services/auth/auth0Verifier");

    await expect(verifyAuth0Token("bad-token")).rejects.toThrow("invalid token");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should reject when the token header is missing a kid", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    mockVerify.mockImplementation(
      (
        _token: string,
        getKey: (header: { kid?: string }, callback: (err: Error | null, key?: string) => void) => void,
        _options: unknown,
        callback: (err: Error | null, decoded?: Record<string, unknown>) => void
      ) => {
        getKey({}, (err) => {
          callback(err ?? new Error("expected key error"));
        });
      }
    );

    const { verifyAuth0Token } = await import("../../src/services/auth/auth0Verifier");

    await expect(verifyAuth0Token("missing-kid")).rejects.toThrow("Missing kid");

    consoleErrorSpy.mockRestore();
  });

  it("should reject when jwks lookup fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    mockVerify.mockImplementation(
      (
        _token: string,
        getKey: (header: { kid?: string }, callback: (err: Error | null, key?: string) => void) => void,
        _options: unknown,
        callback: (err: Error | null, decoded?: Record<string, unknown>) => void
      ) => {
        mockGetSigningKey.mockImplementation((_kid: string, done: (err: Error | null, key?: any) => void) => {
          done(new Error("jwks error"));
        });

        getKey({ kid: "kid-2" }, (err) => {
          callback(err ?? new Error("expected jwks error"));
        });
      }
    );

    const { verifyAuth0Token } = await import("../../src/services/auth/auth0Verifier");

    await expect(verifyAuth0Token("jwks-failure")).rejects.toThrow("jwks error");

    consoleErrorSpy.mockRestore();
  });
});
