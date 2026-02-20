import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const controller = new DashboardController();

router.get(
  "/stats",
  authMiddleware, // protect route
  controller.getStats
);

export default router;