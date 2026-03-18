import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import departmentRoutes from "./routes/department.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";
import auditRoutes from "./routes/audit.routes";

import { errorHandler } from "./middleware/errorHandler";

const app = express();


const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",

  // Production frontend
  "https://13.233.159.18.nip.io",

  // Optional environment variable
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];


app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests like curl or postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked by CORS:", origin);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit", auditRoutes);


app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running successfully",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is healthy",
  });
});


app.use(errorHandler);

export default app;