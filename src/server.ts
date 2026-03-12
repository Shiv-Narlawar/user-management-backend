import "dotenv/config";
import "reflect-metadata";

import app from "./app";
import { AppDataSource } from "./config/data-source";

import { seedRoles } from "./seeds/seedRoles";
import { seedPermissions } from "./seeds/seedPermissions";
import { seedRolePermissions } from "./seeds/seedRolePermissions";
import { seedAdminUser } from "./seeds/seedAdminUser";

const PORT = Number(process.env.PORT || 7000);
const HOST = "0.0.0.0";

const RUN_SEEDS = (process.env.RUN_SEEDS || "true").toLowerCase() === "true";

async function start() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    if (RUN_SEEDS) {
      await seedRoles();
      await seedPermissions();
      await seedRolePermissions();
      await seedAdminUser();
      console.log("Seeding completed.");
    } else {
      console.log("Seeding skipped (RUN_SEEDS=false).");
    }

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

start();