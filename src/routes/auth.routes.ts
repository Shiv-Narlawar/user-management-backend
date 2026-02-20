import express, { Response } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { AuthRequest } from "../types/auth-request";

const router = express.Router();
const controller = new AuthController();

/* ---------- PUBLIC ROUTES ---------- */
router.post("/signup", controller.signup.bind(controller));
router.post("/login", controller.login.bind(controller));
router.post("/refresh", controller.refresh.bind(controller));
router.post("/logout", controller.logout.bind(controller));
router.post("/forgot-password", controller.forgotPassword.bind(controller));
router.post("/reset-password", controller.resetPassword.bind(controller));
router.post("/forgot-username", controller.forgotUsername.bind(controller));
router.post("/update-password", authMiddleware, controller.updatePassword.bind(controller));

/* ---------- PROTECTED ROUTE ---------- */
router.get(
  "/me",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    return res.status(200).json({
      user: req.user,
    });
  }
);



export default router;