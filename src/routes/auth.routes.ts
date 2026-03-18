import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();
const controller = new AuthController();

// protected
router.get("/me", authMiddleware, controller.me.bind(controller));

export default router;