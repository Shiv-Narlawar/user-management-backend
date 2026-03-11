import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";
import {
  createPermissionSchema,
  permissionIdSchema,
} from "../validators/permission.validator";

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
      const data = createPermissionSchema.parse(req.body);

      const permission = await permissionService.createPermission(data);

      return res.status(201).json(permission);
    } catch (err: unknown) {

      if (err instanceof Error) {
        const message = err.message;

        if (
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("duplicate")
        ) {
          return res.status(409).json({ message });
        }
      }

      return res.status(400).json({
        message: "Validation failed",
      });
    }
  }

  async deletePermission(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = permissionIdSchema.parse(req.params);

      const success = await permissionService.deletePermission(id);

      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }

      return res.status(200).json({
        message: "Permission deleted successfully",
      });
    } catch {
      return res.status(400).json({
        message: "Invalid permission id",
      });
    }
  }
}