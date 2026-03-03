import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";

const permissionService = new PermissionService();

export class PermissionController {
  async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await permissionService.getAllPermissions();
      return res.json(permissions);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async createPermission(req: Request, res: Response) {
    try {
      const permission = await permissionService.createPermission(req.body);
      return res.status(201).json(permission);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async deletePermission(req: Request<{ id: string }>, res: Response) {
    try {
      const success = await permissionService.deletePermission(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }

      return res.status(200).json({ message: "Permission deleted successfully" });
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}