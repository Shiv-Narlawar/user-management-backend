import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {

  async getUsers(req: Request, res: Response) {
    const users = await userService.getAllUsers();
    return res.json(users);
  }

  async getUser(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  }

  async createUser(req: Request, res: Response) {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


  async updateUser(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const user = await userService.updateUser(id, req.body);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  }

  async deleteUser(req: Request<{ id: string }>, res: Response) {
    const success = await userService.deleteUser(req.params.id);

    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  }
}
