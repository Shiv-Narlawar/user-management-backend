import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  getUsers(req: Request, res: Response) {
    res.json(userService.getAllUsers());
  }

  getUser(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const user = userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  }

  createUser(req: Request, res: Response) {
    const user = userService.createUser(req.body);
    res.status(201).json(user);
  }

  updateUser(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const user = userService.updateUser(id, req.body);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  }
}
