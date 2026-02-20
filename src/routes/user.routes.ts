import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const userController = new UserController();

router.get(
  "/managers",
  authMiddleware,
  authorize(PermissionName.USER_VIEW),
  userController.getManagers.bind(userController)
);

router.get(
  "/unassigned",
  authMiddleware,
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  userController.getUnassignedUsers.bind(userController)
);

router.get(
  "/",
  authMiddleware,
  authorize(PermissionName.USER_VIEW),
  userController.getUsers.bind(userController)
);

router.post(
  "/",
  authMiddleware,
  authorize(PermissionName.USER_CREATE),
  userController.createUser.bind(userController)
);

router.patch(
  "/me",
  authMiddleware,
  userController.updateMyProfile.bind(userController)
);

router.put(
  "/:id",
  authMiddleware,
  authorize(PermissionName.USER_UPDATE),
  userController.updateUser.bind(userController)
);

router.delete(
  "/:id",
  authMiddleware,
  authorize(PermissionName.USER_DELETE),
  userController.deleteUser.bind(userController)
);

export default router;