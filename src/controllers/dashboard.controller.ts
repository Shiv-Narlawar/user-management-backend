import { Response } from "express";
import { FindOptionsWhere, IsNull } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/user.entity";
import { RoleName } from "../entities/role.entity";
import { AuthRequest } from "../types/auth-request";
import { Department } from "../entities/department.entity";


export class DashboardController {
  private userRepo = AppDataSource.getRepository(User);
  private deptRepo = AppDataSource.getRepository(Department);

  getStats = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let departmentId: string | undefined;

      if (req.user.role !== RoleName.ADMIN) {
        if (req.user.role === RoleName.MANAGER) {
          const myDept = await this.deptRepo.findOne({
            where: { managerId: req.user.id },
          });

          if (!myDept) {
            return res.status(200).json({
              totalUsers: 0,
              activeUsers: 0,
              inactiveUsers: 0,
              admins: 0,
              managers: 0,
              users: 0,
            });
          }
        
          departmentId = myDept.id;
        } else {
          // USER -> use own departmentId
          const me = await this.userRepo.findOne({
            where: { id: req.user.id, deletedAt: IsNull() },
          });
             
          if (!me) {
            return res.status(401).json({ message: "User not found" });
          }

          if (!me.departmentId) {
            return res.status(200).json({
              totalUsers: 0,
              activeUsers: 0,
              inactiveUsers: 0,
              admins: 0,
              managers: 0,
              users: 0,
            });
          }

          departmentId = me.departmentId;
        }
      }

      
      const whereBase: FindOptionsWhere<User> = {
  deletedAt: IsNull(),
};

if (departmentId) {
  whereBase.departmentId = departmentId;
}
      const totalUsers = await this.userRepo.count({ where: whereBase });

      const activeUsers = await this.userRepo.count({
        where: { ...whereBase, status: UserStatus.ACTIVE },
      });

      const inactiveUsers = await this.userRepo.count({
        where: { ...whereBase, status: UserStatus.INACTIVE },
      });

      const admins = await this.userRepo.count({
        where: { ...whereBase, roleName: RoleName.ADMIN },
      });

      const managers = await this.userRepo.count({
        where: { ...whereBase, roleName: RoleName.MANAGER },
      });

      const users = await this.userRepo.count({
        where: { ...whereBase, roleName: RoleName.USER },
      });

      return res.status(200).json({
        totalUsers,
        activeUsers,
        inactiveUsers,
        admins,
        managers,
        users,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  };
}