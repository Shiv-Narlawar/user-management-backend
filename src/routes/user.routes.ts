import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/permission.middleware";

const router = Router();
const userController = new UserController();

// View all users
router.get(
  "/",
  authMiddleware,
  authorize("USER_VIEW"),
  userController.getUsers
);

// Create user
router.post(
  "/",
  authMiddleware,
  authorize("USER_CREATE"),
  userController.createUser
);

// Update user
router.put(
  "/:id",
  authMiddleware,
  authorize("USER_UPDATE"),
  userController.updateUser
);

// Delete user
router.delete(
  "/:id",
  authMiddleware,
  authorize("USER_DELETE"),
  userController.deleteUser
);

export default router;