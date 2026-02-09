import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());              
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend is running");
});

app.get("/health", (_req, res) => {
  res.json({ message: "Backend connected successfully" });
});

app.listen(PORT, () => {
  console.log(` Backend running at http://localhost:${PORT}`);
});
