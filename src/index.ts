import express, { Response, NextFunction } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import authenticateToken from "./util/authenticateToken";
import { CustomRequest } from "./types";
import authRouter from "./routes/auth-router";
import userRouter from "./routes/user-router";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors());

// Basic route for GET request
app.get("/", (req: CustomRequest, res: Response) => {
  res.send("Hello World from TypeScript!");
});

app.use("/auth", authRouter);

app.use(authenticateToken);

app.use("/users", userRouter);

// Catch 404 and forward to error handler
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  const err = new Error("Not Found") as any;
  err.status = 404;
  next(err);
});

// Error handler
app.use((err: any, req: CustomRequest, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

if (MONGODB_URI)
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connection established"))
    .catch((err) => console.error("MongoDB connection error:", err));

// To handle initial connection errors
mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
