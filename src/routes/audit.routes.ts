import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const controller = new AuditController();

router.use(authMiddleware);

router.get(
  "/",
  authorize(PermissionName.AUDIT_VIEW),
  controller.getLogs
);

export default router;