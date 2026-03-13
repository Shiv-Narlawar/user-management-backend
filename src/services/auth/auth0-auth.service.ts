import bcrypt from "bcrypt";
import { verifyAuth0Token } from "./auth0Verifier";

import { AppDataSource } from "../../config/data-source";
import { User, UserStatus } from "../../entities/user.entity";
import { Role, RoleName } from "../../entities/role.entity";

export class Auth0AuthService {

  async validate(token: string) {

    try {

      /**
       * Verify Auth0 token
       */
      const decoded: any = await verifyAuth0Token(token);

      if (!decoded) {
        return null;
      }

      /**
       * Fetch Auth0 user profile
       */
      const response = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Auth0 userinfo request failed");
        return null;
      }

      const profile: any = await response.json();

      const email = profile.email;

      if (!email) {
        return null;
      }

      const name = profile.name ?? email.split("@")[0];
      const authProviderId = decoded.sub;

      const userRepo = AppDataSource.getRepository(User);
      const roleRepo = AppDataSource.getRepository(Role);

      let user = await userRepo.findOne({
        where: [{ email }, { authProviderId }],
        relations: ["role", "role.permissions"],
      });

      /**
       * Create user if first login
       */
      if (!user) {

        const role = await roleRepo.findOne({
          where: { name: RoleName.USER },
          relations: ["permissions"],
        });

        if (!role) {
          throw new Error("Default USER role not found");
        }

        /**
         * Auth0 users do not have passwords in our system
         * so we store a dummy password to satisfy DB constraint
         */
        const dummyPassword = await bcrypt.hash("AUTH0_USER", 10);

        user = userRepo.create({
          name,
          email,
          password: dummyPassword,
          authProviderId,
          roleName: role.name,
          role,
          status: UserStatus.ACTIVE,
        });

        user = await userRepo.save(user);
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role?.name ?? RoleName.USER,
        permissions: (user.role?.permissions || []).map((p) => p.name),
        departmentId: user.departmentId ?? undefined,
      };

    } catch (error) {

      console.error("Auth0 validation failed:", error);
      return null;

    }
  }
}