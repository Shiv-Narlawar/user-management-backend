import { verifyAuth0Token } from "./auth0Verifier";

import { AppDataSource } from "../../config/data-source";
import { User, UserStatus } from "../../entities/user.entity";
import { Role, RoleName } from "../../entities/role.entity";
import { Department } from "../../entities/department.entity";

export class Auth0AuthService {

  private async getAuth0UserInfo(token: string) {
    try {
      const res = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return null;

      return await res.json();
    } catch {
      return null;
    }
  }

  async validate(token: string) {

    try {

      const decoded: any = await verifyAuth0Token(token);

      if (!decoded) return null;

      const auth0Sub: string | undefined = decoded.sub;
      let email: string | undefined = decoded.email;
      let name: string | undefined = decoded.name;

      if (!auth0Sub) {
        console.error("Auth0 token missing sub");
        return null;
      }

      // 🔥 Only fallback to /userinfo if needed
      if (!email || !name) {
        const userInfo = await this.getAuth0UserInfo(token);
        if (userInfo) {
          email = email ?? userInfo.email;
          name = name ?? userInfo.name;
        }
      }

      // fallback safety
      email = email ?? `${auth0Sub.replace("auth0|", "")}@auth0.local`;
      const displayName = name ?? email.split("@")[0];

      const userRepo = AppDataSource.getRepository(User);
      const roleRepo = AppDataSource.getRepository(Role);
      const deptRepo = AppDataSource.getRepository(Department);

      let user = await userRepo.findOne({
        where: { auth0Sub },
        relations: ["role", "role.permissions"],
      });

      if (!user) {

        user = await userRepo.findOne({
          where: { email },
          relations: ["role", "role.permissions"],
        });

        if (user) {

          user.auth0Sub = auth0Sub;

          await userRepo.save(user);

          user = await userRepo.findOne({
            where: { id: user.id },
            relations: ["role", "role.permissions"],
          });

        }

      }

      if (!user) {

        const role = await roleRepo.findOne({
          where: { name: RoleName.USER },
          relations: ["permissions"],
        });

        if (!role) {
          throw new Error("Default USER role not found");
        }

        user = userRepo.create({
          name: displayName,
          email: email,
          auth0Sub,
          roleName: role.name,
          role: role,
          status: UserStatus.ACTIVE,
        });

        user = await userRepo.save(user);

        user = await userRepo.findOne({
          where: { id: user.id },
          relations: ["role", "role.permissions"],
        });

      }

      if (!user) return null;

      if (user.status !== UserStatus.ACTIVE) return null;

      let departmentId = user.departmentId ?? undefined;

      if (!departmentId) {

        const managedDept = await deptRepo.findOne({
          where: { managerId: user.id },
        });

        if (managedDept) {
          departmentId = managedDept.id;
        }

      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name ?? user.roleName ?? RoleName.USER,
        permissions: (user.role?.permissions || []).map((p) => p.name),
        departmentId,
      };

    } catch (error) {

      console.error("Auth0 validation failed:", error);
      return null;

    }
  }
}