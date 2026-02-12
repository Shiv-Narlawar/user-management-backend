import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running successfully"
  });
});

export default app;
