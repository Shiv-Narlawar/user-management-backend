import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const controller = new DepartmentController();

// ================= VIEW DEPARTMENTS =================
router.get(
  "/",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_VIEW),
  controller.getDepartments
);

// ================= CREATE DEPARTMENT =================
router.post(
  "/",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_CREATE),
  controller.createDepartment
);

// ================= UPDATE DEPARTMENT =================
router.put(
  "/:id",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_UPDATE),
  controller.updateDepartment
);

// ================= DELETE DEPARTMENT =================
router.delete(
  "/:id",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_DELETE),
  controller.deleteDepartment
);

// ================= ASSIGN MANAGER =================
router.post(
  "/:id/assign-manager",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_UPDATE),
  controller.updateDepartment
);

// ================= ASSIGN USER =================
router.post(
  "/:id/assign-user",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  controller.assignUserToDepartment
);

// ================= REMOVE USER =================
router.delete(
  "/:id/remove-user/:userId",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  controller.removeUserFromDepartment
);

export default router;