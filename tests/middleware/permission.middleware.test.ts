import { PermissionName } from "../../src/constants/permission-name";

jest.mock("../../src/entities/role.entity", () => ({
  RoleName: {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    USER: "USER",
  },
}));

import { authorize } from "../../src/middleware/permission.middleware";

const RoleName = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
} as const;

describe("authorize", () => {
  const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when req.user is missing", () => {
    const middleware = authorize(PermissionName.USER_VIEW);
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow admins without checking permissions", () => {
    const middleware = authorize(PermissionName.USER_DELETE);
    const req: any = {
      user: {
        role: RoleName.ADMIN,
      },
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 403 when permissions are missing", () => {
    const middleware = authorize(PermissionName.USER_VIEW);
    const req: any = {
      user: {
        role: RoleName.USER,
      },
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 when the required permission is absent", () => {
    const middleware = authorize(PermissionName.USER_DELETE);
    const req: any = {
      user: {
        role: RoleName.MANAGER,
        permissions: [PermissionName.USER_VIEW],
      },
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Not allowed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when the user has the required permission", () => {
    const middleware = authorize(PermissionName.USER_VIEW);
    const req: any = {
      user: {
        role: RoleName.USER,
        permissions: [PermissionName.USER_VIEW, PermissionName.USER_UPDATE],
      },
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
