import { Router } from "express";
import { PermissionController } from "../controllers/permission.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const permissionController = new PermissionController();

// View all permissions
router.get(
  "/",
  authMiddleware,
  authorize(PermissionName.PERMISSION_VIEW),
  permissionController.getPermissions.bind(permissionController)
);

// Create permission
router.post(
  "/",
  authMiddleware,
  authorize(PermissionName.PERMISSION_CREATE),
  permissionController.createPermission.bind(permissionController)
);

// Delete permission
router.delete(
  "/:id",
  authMiddleware,
  authorize(PermissionName.PERMISSION_DELETE),
  permissionController.deletePermission.bind(permissionController)
);

export default router;