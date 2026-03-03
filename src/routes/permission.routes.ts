import { Router } from "express";
import { PermissionController } from "../controllers/permission.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const permissionController = new PermissionController();

router.get("/",authMiddleware, permissionController.getPermissions);
router.post("/", authMiddleware, permissionController.createPermission);
router.delete("/:id", authMiddleware, permissionController.deletePermission);

export default router;