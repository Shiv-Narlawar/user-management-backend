import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/department.entity";
import { User } from "../entities/user.entity";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";
import { AuditService } from "../services/audit.service";

export class DepartmentController {

  private deptRepo = AppDataSource.getRepository(Department);
  private userRepo = AppDataSource.getRepository(User);
  private auditService = new AuditService();

  // ================= GET DEPARTMENTS =================
  getDepartments = async (req: AuthRequest, res: Response) => {
    try {

      const departments = await this.deptRepo.find({
        relations: ["manager"],
        order: { createdAt: "DESC" },
      });

      return res.json({ data: departments });

    } catch (error) {
      console.error("Get departments error:", error);

      return res.status(500).json({
        message: "Failed to load departments",
      });
    }
  };

  // ================= CREATE DEPARTMENT =================
  createDepartment = async (req: AuthRequest, res: Response) => {
    try {

      const { name, managerId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Department name is required",
        });
      }

      const existingName = await this.deptRepo.findOne({
        where: { name: name.trim() },
      });

      if (existingName) {
        return res.status(400).json({
          message: "Department name already exists",
        });
      }

      let manager: User | null = null;

      if (managerId) {

        manager = await this.userRepo.findOne({
          where: { id: managerId },
        });

        if (!manager) {
          return res.status(404).json({
            message: "Manager not found",
          });
        }

        if (manager.roleName !== RoleName.MANAGER) {
          return res.status(400).json({
            message: "Selected user is not a MANAGER",
          });
        }

        const existingManager = await this.deptRepo.findOne({
          where: { managerId },
        });

        if (existingManager) {
          return res.status(400).json({
            message: "This manager already manages a department",
          });
        }
      }

      const department = this.deptRepo.create({
        name: name.trim(),
        managerId: manager ? manager.id : null,
      });

      const savedDepartment = await this.deptRepo.save(department);

      if (manager) {
        manager.departmentId = savedDepartment.id;
        await this.userRepo.save(manager);
      }

      // ✅ Audit log
      await this.auditService.log({
        action: "DEPARTMENT_CREATED",
        actorId: req.user?.id,
        entityType: "Department",
        entityId: savedDepartment.id,
        message: `Department ${savedDepartment.name} created`,
      });

      return res.status(201).json({
        message: "Department created successfully",
        department: savedDepartment,
      });

    } catch (error) {
      console.error("Create department error:", error);

      return res.status(500).json({
        message: "Failed to create department",
      });
    }
  };

  // ================= UPDATE DEPARTMENT =================
  updateDepartment = async (req: AuthRequest, res: Response) => {
    try {

      const { id } = req.params;
      const { name, managerId } = req.body;

      const department = await this.deptRepo.findOne({
        where: { id: String(id) },
      });

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
        });
      }

      if (name) {

        const existingName = await this.deptRepo.findOne({
          where: { name },
        });

        if (existingName && existingName.id !== id) {
          return res.status(400).json({
            message: "Department name already exists",
          });
        }

        department.name = name.trim();
      }

      if (managerId !== undefined) {

        if (managerId === null) {

          department.managerId = null;

        } else {
          if (department.managerId && department.managerId !== managerId) {
            return res.status(400).json({
              message:
                "This department already has a manager. Remove the current manager first.",
            });
          }

          const manager = await this.userRepo.findOne({
            where: { id: managerId },
          });

          if (!manager) {
            return res.status(404).json({
              message: "Manager not found",
            });
          }

          if (manager.roleName !== RoleName.MANAGER) {
            return res.status(400).json({
              message: "Selected user is not a MANAGER",
            });
          }

          const existingManager = await this.deptRepo.findOne({
            where: { managerId },
          });

          if (existingManager && existingManager.id !== id) {
            return res.status(400).json({
              message: "This manager already manages another department",
            });
          }

          manager.departmentId = department.id;
          await this.userRepo.save(manager);
          department.managerId = managerId;
        }
      }

      await this.deptRepo.save(department);

      // Audit log
      await this.auditService.log({
        action: "DEPARTMENT_UPDATED",
        actorId: req.user?.id,
        entityType: "Department",
        entityId: department.id,
        message: `Department ${department.name} updated`,
      });

      return res.json({
        message: "Department updated successfully",
        department,
      });

    } catch (error) {
      console.error("Update department error:", error);

      return res.status(500).json({
        message: "Failed to update department",
      });
    }
  };

  // ================= DELETE DEPARTMENT =================
  deleteDepartment = async (req: AuthRequest, res: Response) => {
    try {

      const { id } = req.params;

      const department = await this.deptRepo.findOne({
        where: { id: String(id) },
      });

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
        });
      }

      await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ departmentId: null })
        .where("departmentId = :id", { id })
        .execute();

      await this.deptRepo.delete(id);

      //  Audit log
      await this.auditService.log({
        action: "DEPARTMENT_DELETED",
        actorId: req.user?.id,
        entityType: "Department",
        entityId: String(id),
        message: `Department ${department.name} deleted`,
      });

      return res.json({
        message: "Department deleted successfully",
      });

    } catch (error) {
      console.error("Delete department error:", error);

      return res.status(500).json({
        message: "Failed to delete department",
      });
    }
  };

  // ================= ASSIGN USER =================
  assignUserToDepartment = async (req: AuthRequest, res: Response) => {
    try {

      const { id } = req.params;
      const { userId, userIds } = req.body as {
        userId?: string;
        userIds?: string[];
      };
      const targetUserIds = Array.from(
        new Set(
          Array.isArray(userIds)
            ? userIds.filter((value): value is string => Boolean(value))
            : userId
              ? [userId]
              : []
        )
      );

      if (targetUserIds.length === 0) {
        return res.status(400).json({
          message: "At least one user is required",
        });
      }

      const department = await this.deptRepo.findOne({
        where: { id: String(id) },
      });

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
        });
      }

      const users = await this.userRepo.find({
        where: targetUserIds.map((targetUserId) => ({ id: targetUserId })),
      });

      if (users.length !== targetUserIds.length) {
        return res.status(404).json({
          message: "One or more users were not found",
        });
      }

      const invalidUsers = users.filter((user) => user.roleName !== RoleName.USER);

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          message: "Only users with USER role can be assigned",
        });
      }

      users.forEach((user) => {
        user.departmentId = department.id;
      });

      await this.userRepo.save(users);

      await Promise.all(
        users.map((user) =>
          this.auditService.log({
            action: "USER_ASSIGNED_DEPARTMENT",
            actorId: req.user?.id,
            entityType: "User",
            entityId: user.id,
            message: `${user.email} assigned to department ${department.name}`,
          })
        )
      );

      return res.json({
        message:
          users.length === 1
            ? "User assigned successfully"
            : "Users assigned successfully",
        assignedCount: users.length,
      });

    } catch (error) {
      console.error("Assign user error:", error);

      return res.status(500).json({
        message: "Failed to assign user",
      });
    }
  };

  // ================= REMOVE USER =================
  removeUserFromDepartment = async (req: AuthRequest, res: Response) => {
    try {

      const { userId } = req.params;

      const user = await this.userRepo.findOne({
        where: { id: String(userId) },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.roleName === RoleName.MANAGER) {
        const managedDepartment = await this.deptRepo.findOne({
          where: { managerId: user.id },
        });

        if (managedDepartment) {
          managedDepartment.managerId = null;
          await this.deptRepo.save(managedDepartment);
        }
      }

      user.departmentId = null;
      await this.userRepo.save(user);

      // Audit log
      await this.auditService.log({
        action: "USER_REMOVED_DEPARTMENT",
        actorId: req.user?.id,
        entityType: "User",
        entityId: user.id,
        message: `${user.email} removed from department`,
      });

      return res.json({
        message: "User removed from department successfully",
      });

    } catch (error) {
      console.error("Remove user error:", error);

      return res.status(500).json({
        message: "Failed to remove user",
      });
    }
  };
}
