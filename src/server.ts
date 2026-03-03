import "dotenv/config";
import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/data-source";
import { seedRoles } from "./seeds/seedRoles";
import { seedPermissions } from "./seeds/seedPermissions";
import { seedRolePermissions } from "./seeds/seedRolePermissions";

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully");

    // Seed roles after DB connection
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });