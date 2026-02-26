import express from "express";
import { AuthController } from "../controllers/auth.controller";

const router = express.Router();
const controller = new AuthController();

router.post("/login", controller.login);
router.post("/signup", controller.signup);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/forgot-username", controller.forgotUsername);


export default router;
