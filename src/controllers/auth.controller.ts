import { Request, Response } from "express";
import { LocalAuthService } from "../services/auth/local.auth";

export class AuthController {
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const authService = new LocalAuthService();
      const result = await authService.login(email, password);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };
}
