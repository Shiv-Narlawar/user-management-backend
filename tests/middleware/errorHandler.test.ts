import { errorHandler } from "../../src/middleware/errorHandler";
import { ApiError } from "../../src/utils/apiError";

describe("errorHandler", () => {
  const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return ApiError status and message", () => {
    const req: any = {};
    const res = createRes();
    const next = jest.fn();
    const error = new ApiError(400, "Validation failed");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Validation failed" });
  });

  it("should include ApiError details when present", () => {
    const req: any = {};
    const res = createRes();
    const next = jest.fn();
    const error = new ApiError(422, "Invalid input", [{ field: "email" }]);

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid input",
      errors: [{ field: "email" }],
    });
  });

  it("should map postgres unique violations to 409", () => {
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    errorHandler({ code: "23505" }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Resource already exists",
    });
  });

  it("should return 500 for unexpected errors", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    errorHandler(new Error("boom"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });

    consoleErrorSpy.mockRestore();
  });
});
