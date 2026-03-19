import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";
import { PermissionName } from "../constants/permission-name";

const router = Router();
const userController = new UserController();

// auth
router.use(authMiddleware);

// routes
router.get(
  "/managers",
  authorize(PermissionName.USER_VIEW),
  userController.getManagers.bind(userController)
);

router.get(
  "/unassigned",
  authorize(PermissionName.DEPARTMENT_ASSIGN_USER),
  userController.getUnassignedUsers.bind(userController)
);

router.get(
  "/unassigned-managers",
  authorize(PermissionName.USER_VIEW),
  userController.getUnassignedManagers.bind(userController)
);

router.get(
  "/",
  authorize(PermissionName.USER_VIEW),
  userController.getUsers.bind(userController)
);

router.post(
  "/invite",
  authorize(PermissionName.USER_INVITE),
  userController.inviteUser.bind(userController)
);

router.post(
  "/",
  authorize(PermissionName.USER_CREATE),
  userController.createUser.bind(userController)
);

router.patch(
  "/me",
  userController.updateMyProfile.bind(userController)
);

router.put(
  "/:id",
  authorize(PermissionName.USER_UPDATE),
  userController.updateUser.bind(userController)
);

router.delete(
  "/:id",
  authorize(PermissionName.USER_DELETE),
  userController.deleteUser.bind(userController)
);

export default router;
