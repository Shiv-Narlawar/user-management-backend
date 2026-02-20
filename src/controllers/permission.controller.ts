import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";

const permissionService = new PermissionService();

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

type CreatePermissionBody = {
  name?: unknown;
  description?: unknown;
};

function validateCreatePermissionBody(body: unknown): {
  ok: true;
  value: { name: string; description?: string };
} | {
  ok: false;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { body: "Request body must be a JSON object" } };
  }

  const allowedKeys = new Set(["name", "description"]);
  for (const key of Object.keys(body as Record<string, unknown>)) {
    if (!allowedKeys.has(key)) {
      errors[key] = "Unknown field";
    }
  }

  const { name, description } = body as CreatePermissionBody;

  if (!isNonEmptyString(name)) {
    errors.name = "name is required and must be a non-empty string";
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.description = "description must be a string";
    } else if (description.trim().length > 300) {
      errors.description = "description must be at most 300 characters";
    }
  }

  if (isNonEmptyString(name)) {
    const normalized = name.trim().toUpperCase();
    if (!/^[A-Z_]{3,50}$/.test(normalized)) {
      errors.name = "name must be 3-50 chars and contain only A-Z and _ (example: CREATE_USER)";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // normalize values
  const normalizedName = (name as string).trim().toUpperCase();
  const normalizedDescription =
    typeof description === "string" ? description.trim() : undefined;

  return { ok: true, value: { name: normalizedName, description: normalizedDescription } };
}

// Controller 
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
      //  validate first
      const validation = validateCreatePermissionBody(req.body);
      if (!validation.ok) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      //  only proceed if valid
      const permission = await permissionService.createPermission(validation.value);
      return res.status(201).json(permission);
    } catch (err: unknown) {
      //  better error mapping (optional but useful)
      const message = err instanceof Error ? err.message : "Internal Server Error";
      if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("duplicate")) {
        return res.status(409).json({ message });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async deletePermission(req: Request<{ id: string }>, res: Response) {
    try {
      //  validate id
      const { id } = req.params;
      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid permission id" });
      }

      const success = await permissionService.deletePermission(id);

      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }

      return res.status(200).json({ message: "Permission deleted successfully" });
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}