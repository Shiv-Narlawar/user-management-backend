import { Response } from "express";
import { UserService } from "../services/user.service";
import { AuditService } from "../services/audit.service";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/department.entity";

import {
  userIdSchema,
  createUserSchema,
  updateMyProfileSchema,
  getUsersQuerySchema,
} from "../validators/user.validator";

const userService = new UserService();
const auditService = new AuditService();



export class UserController {

  async getUsers(req: AuthRequest, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = getUsersQuerySchema.parse(req.query);

    let departmentId: string | undefined;

    if (req.user.role !== RoleName.ADMIN) {

      if (req.user.role === RoleName.MANAGER) {

        const deptRepo = AppDataSource.getRepository(Department);

        const myDept = await deptRepo.findOne({
          where: { managerId: req.user.id },
        });

        if (!myDept) {
          return res.json({
            data: [],
            total: 0,
            page: query.page,
            limit: query.limit,
            totalPages: 1,
          });
        }

        departmentId = myDept.id;

      } else {

        const me = await userService.getUserById(req.user.id);

        if (!me || !me.departmentId) {
          return res.json({
            data: [],
            total: 0,
            page: query.page,
            limit: query.limit,
            totalPages: 1,
          });
        }

        departmentId = me.departmentId;
      }
    }

    const result = await userService.getAllUsers({
  search: query.search,
  role: query.role,
  departmentId,
  page: query.page,
  limit: query.limit,
  sort: query.sort,
});

    return res.json(result);

  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
}

  async getUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { id } = userIdSchema.parse(req.params);

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.user.role === RoleName.ADMIN) {
        return res.json(user);
      }

      const me = await userService.getUserById(req.user.id);

      if (!me || me.departmentId !== user.departmentId) {
        return res.status(403).json({
          message: "You can only view users from your department",
        });
      }

      return res.json(user);

    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(400).json({ message: "Invalid request" });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {

      const data = createUserSchema.parse(req.body);

      const existingUser = await userService.findUserByEmail(data.email);

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const created = await userService.createUser({
    name: data.name,
    email: data.email,
    password: data.password,
    roleName: data.role,
    });

    /**
     * Audit log
     */
    await auditService.log({
      action: "USER_CREATED",
      actorId: req.user?.id,
      entityType: "User",
      entityId: created.id,
      message: `Permissions updated for role ${RoleName}`,
    });

    return res.status(201).json(created);

    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(400).json({ message: "Invalid request data" });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = userIdSchema.parse(req.params);

      const updatedUser = await userService.updateUser(id, req.body);

      await auditService.log({
        action: "USER_UPDATED",
        actorId: req.user.id,
        entityType: "User",
        entityId: id,
        message: `User ${id} updated`,
      });

      return res.json(updatedUser);

    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(400).json({ message: "Invalid request" });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = userIdSchema.parse(req.params);

      const success = await userService.deleteUser(id);

        if (!success) {
          return res.status(404).json({ message: "User not found" });
        }

        await auditService.log({
          action: "USER_DELETED",
          actorId: req.user.id,
          entityType: "User",
          entityId: id,
          message:`User ${id} deleted`,
        });

        return res.json({
          message: "User deleted successfully",
        });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(400).json({ message: "Invalid request" });
    }
  }

  async updateMyProfile(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = updateMyProfileSchema.parse(req.body);

      const updated = await userService.updateMyProfile(req.user.id, {
        name: data.name,
      });

      return res.json(updated);

    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(400).json({ message: "Invalid request data" });
    }
  }

  async getManagers(req: AuthRequest, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const managers = await userService.getManagers();

    return res.status(200).json({
      data: managers,
    });

  } catch (error) {
    console.error("Error fetching managers:", error);

    return res.status(500).json({
      message: "Failed to fetch managers",
    });
  }
}

async getUnassignedUsers(req: AuthRequest, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (
      req.user.role !== RoleName.ADMIN &&
      req.user.role !== RoleName.MANAGER
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const users = await userService.getUnassignedUsers();

    return res.status(200).json({
      data: users,
    });

  } catch (error) {
    console.error("Error fetching unassigned users:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
}

async getUnassignedManagers(req: AuthRequest, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== RoleName.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const managers = await userService.getUnassignedManagers();

    return res.status(200).json({
      data: managers,
    });

  } catch (error) {
    console.error("Error fetching unassigned managers:", error);

    return res.status(500).json({
      message: "Failed to fetch managers",
    });
  }
}
}