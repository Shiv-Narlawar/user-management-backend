import { Response } from "express";
import { AuthRequest } from "../types/auth-request";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";

import { AuditService } from "../services/audit.service";

export class AuthController {
  private auditService = new AuditService();

  // get current user
  me = asyncHandler(async (req: AuthRequest, res: Response) => {

    // check user
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    // audit
    await this.auditService.log({
      action: "USER_ACCESS",
      actorId: req.user.id,
      entityType: "User",
      entityId: req.user.id,
      message: `${req.user.email} accessed system`,
    });

    return res.status(200).json(req.user);
  });
}