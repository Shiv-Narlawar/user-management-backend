import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();

import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { Department } from "../entities/department.entity";

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  synchronize: false,
  logging: false,

  entities: isProd
    ? ["dist/src/entities/*.js"]
    : [User, Role, Permission, RefreshToken, Department],

  migrations: isProd
    ? ["dist/src/migrations/*.js"]
    : ["src/migrations/*.ts"],
});