import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const roleController = new RoleController();

router.use(authMiddleware);

// View roles
router.get(
  "/",
  authorize(PermissionName.PERMISSION_VIEW),
  roleController.getRoles
);

// Create role
router.post(
  "/",
  authorize(PermissionName.ROLE_CREATE),
  roleController.createRole
);

// Update role permissions 
router.put(
  "/:id/permissions",
  authorize(PermissionName.PERMISSION_ASSIGN),
  roleController.updateRolePermissions
);

// Get role permissions 
router.get(
  "/:id/permissions",
  authorize(PermissionName.PERMISSION_VIEW),
  roleController.getRolePermissions
);

// Delete role
router.delete(
  "/:id",
  authorize(PermissionName.ROLE_UPDATE),
  roleController.deleteRole
);

export default router;