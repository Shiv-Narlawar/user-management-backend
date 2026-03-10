import { Response } from "express";
import { UserService } from "../services/user.service";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/department.entity";

const userService = new UserService();

/** ---------- Helpers ---------- */

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSearch(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s || s.length > 100) return undefined;
  return s;
}

export class UserController {

  // ================= GET USERS =================
  async getUsers(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const search = normalizeSearch(req.query.search);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      let departmentId: string | undefined;

      // ADMIN → see all users
      if (req.user.role !== RoleName.ADMIN) {

        // MANAGER → users from manager department
        if (req.user.role === RoleName.MANAGER) {

          const deptRepo = AppDataSource.getRepository(Department);

          const myDept = await deptRepo.findOne({
            where: { managerId: req.user.id },
          });

          if (!myDept) {
            return res.status(200).json({
              data: [],
              total: 0,
              page,
              limit,
              totalPages: 1,
            });
          }

          departmentId = myDept.id;
        }

        // USER → users from their department
        else {

          const me = await userService.getUserById(req.user.id);

          if (!me || !me.departmentId) {
            return res.status(200).json({
              data: [],
              total: 0,
              page,
              limit,
              totalPages: 1,
            });
          }

          departmentId = me.departmentId;
        }
      }

      const result = await userService.getAllUsers({
        search,
        departmentId,
        page,
        limit,
      });

      return res.status(200).json(result);

    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  }

  // ================= GET USER =================
  async getUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const id = String(req.params.id);

      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.user.role === RoleName.ADMIN) {
        return res.status(200).json(user);
      }

      const me = await userService.getUserById(req.user.id);

      if (!me || me.departmentId !== user.departmentId) {
        return res.status(403).json({
          message: "You can only view users from your department",
        });
      }

      return res.status(200).json(user);

    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  // ================= GET MANAGERS =================
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
      return res.status(500).json({ message: "Failed to fetch managers" });
    }
  }

  // ================= CREATE USER =================
  async createUser(req: AuthRequest, res: Response) {
    try {

      const { email, name, password, role } = req.body;

      if (!isEmail(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Name is required" });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ message: "Password is required" });
      }

      if (!role || !Object.values(RoleName).includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const normalizedEmail = normalizeEmail(email);

      const existingUser = await userService.findUserByEmail(normalizedEmail);

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const created = await userService.createUser({
        name,
        email: normalizedEmail,
        password,
        roleName: role,
      });

      return res.status(201).json(created);

    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  }

  // ================= UPDATE USER =================
  async updateUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = String(req.params.id);

      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const updatedUser = await userService.updateUser(id, req.body);

      return res.status(200).json(updatedUser);

    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  }

  // ================= DELETE USER =================
  async deleteUser(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = String(req.params.id);

      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const success = await userService.deleteUser(id);

      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "User deleted successfully",
      });

    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  }

  // ================= UPDATE MY PROFILE =================
  async updateMyProfile(req: AuthRequest, res: Response) {
    try {

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name } = req.body ?? {};

      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Name is required" });
      }

      const updated = await userService.updateMyProfile(req.user.id, {
        name: name.trim(),
      });

      return res.status(200).json(updated);

    } catch (error) {
      console.error("Error updating my profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  }

  // ================= GET UNASSIGNED USERS =================
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
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  }
}