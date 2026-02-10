import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const controller = new UserController();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.createUser);
router.put("/:id", controller.updateUser);

export default router;
