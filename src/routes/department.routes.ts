import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const controller = new DepartmentController();

// View departments
router.get(
  "/",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_VIEW),
  controller.getDepartments
);

// Create department (ADMIN only)
router.post(
  "/",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_CREATE),
  controller.createDepartment
);

// Update department (ADMIN only)
router.put(
  "/:id",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_UPDATE),
  controller.updateDepartment
);

// Delete department (ADMIN only)
router.delete(
  "/:id",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_DELETE),
  controller.deleteDepartment
);

// Assign user to department
router.post(
  "/:id/assign-user",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  controller.assignUserToDepartment
);

router.delete(
  "/:id/remove-user/:userId",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  controller.removeUserFromDepartment
);

export default router;