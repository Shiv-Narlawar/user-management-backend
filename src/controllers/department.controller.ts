import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/department.entity";
import { User } from "../entities/user.entity";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";

export class DepartmentController {
  private deptRepo = AppDataSource.getRepository(Department);
  private userRepo = AppDataSource.getRepository(User);

  // GET DEPARTMENTS 
  getDepartments = async (req: AuthRequest, res: Response) => {
    const departments = await this.deptRepo.find({
      relations: ["manager"],
      order: { createdAt: "DESC" },
    });

    return res.json({ data: departments });
  };

  // CREATE DEPARTMENT
  createDepartment = async (req: AuthRequest, res: Response) => {
    const { name, managerId } = req.body as { name: string; managerId: string };

    if (!name?.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }

    if (!managerId) {
      return res.status(400).json({ message: "managerId is required" });
    }

    const manager = await this.userRepo.findOne({ where: { id: managerId } });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    if (manager.roleName !== RoleName.MANAGER) {
      return res.status(400).json({ message: "Selected user is not a MANAGER" });
    }

    const existingManager = await this.deptRepo.findOne({ where: { managerId } });
    if (existingManager) {
      return res.status(400).json({ message: "This manager already manages a department" });
    }

    const existingName = await this.deptRepo.findOne({ where: { name } });
    if (existingName) {
      return res.status(400).json({ message: "Department name already exists" });
    }

    const department = this.deptRepo.create({ name, managerId });
    const saved = await this.deptRepo.save(department);

    return res.status(201).json({
      message: "Department created successfully",
      department: saved,
    });
  };

  //  UPDATE DEPARTMENT 
  updateDepartment = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { name, managerId } = req.body as { name?: string; managerId?: string };

    const department = await this.deptRepo.findOne({ where: { id } });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Department name cannot be empty" });
      }

      const existingName = await this.deptRepo.findOne({ where: { name } });
      if (existingName && existingName.id !== id) {
        return res.status(400).json({ message: "Department name already exists" });
      }

      department.name = name;
    }

    if (managerId !== undefined) {
      const manager = await this.userRepo.findOne({ where: { id: managerId } });
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }

      if (manager.roleName !== RoleName.MANAGER) {
        return res.status(400).json({ message: "Selected user is not a MANAGER" });
      }

      const existingManager = await this.deptRepo.findOne({ where: { managerId } });
      if (existingManager && existingManager.id !== id) {
        return res.status(400).json({ message: "This manager already manages another department" });
      }

      department.managerId = managerId;
    }

    await this.deptRepo.save(department);

    return res.json({
      message: "Department updated successfully",
      department,
    });
  };

  // DELETE DEPARTMENT
  deleteDepartment = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);

    const department = await this.deptRepo.findOne({ where: { id } });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ departmentId: null })
      .where("departmentId = :id", { id })
      .execute();

    await this.deptRepo.delete(id);

    return res.json({ message: "Department deleted successfully" });
  };

  //  ASSIGN USER 
  assignUserToDepartment = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const id = String(req.params.id);
      const { userId } = req.body as { userId: string };

      if (!userId) return res.status(400).json({ message: "userId is required" });

      const department = await this.deptRepo.findOne({ where: { id } });
      if (!department) return res.status(404).json({ message: "Department not found" });

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      const currentUser = req.user;

      // ADMIN → assign anywhere
      if (currentUser.role === RoleName.ADMIN) {
        user.departmentId = department.id;
        await this.userRepo.save(user);
        return res.json({ message: "User assigned successfully" });
      }

      // MANAGER → assign only to his own department
      if (currentUser.role === RoleName.MANAGER) {
        if (department.managerId !== currentUser.id) {
          return res.status(403).json({ message: "You can only manage your own department" });
        }

        user.departmentId = department.id;
        await this.userRepo.save(user);
        return res.json({ message: "User assigned successfully" });
      }

      return res.status(403).json({ message: "Not authorized" });
    } catch (error) {
      console.error("Error assigning user:", error);
      return res.status(500).json({ message: "Failed to assign user" });
    }
  };

  //REMOVE USER FROM DEPARTMENT 
  
  removeUserFromDepartment = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const departmentId = String(req.params.id);
      const userId = String(req.params.userId);

      const department = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!department) return res.status(404).json({ message: "Department not found" });

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      // user must belong to this department
      if (user.departmentId !== department.id) {
        return res.status(400).json({ message: "User does not belong to this department" });
      }

      const currentUser = req.user;

      // ADMIN -> remove anywhere
      if (currentUser.role === RoleName.ADMIN) {
        user.departmentId = null;
        await this.userRepo.save(user);
        return res.json({ message: "User removed from department successfully" });
      }

      // MANAGER -> only for his own department
      if (currentUser.role === RoleName.MANAGER) {
        if (department.managerId !== currentUser.id) {
          return res.status(403).json({ message: "You can only manage your own department" });
        }

        user.departmentId = null;
        await this.userRepo.save(user);
        return res.json({ message: "User removed from department successfully" });
      }

      return res.status(403).json({ message: "Not authorized" });
    } catch (error) {
      console.error("Error removing user from department:", error);
      return res.status(500).json({ message: "Failed to remove user" });
    }
  };
}