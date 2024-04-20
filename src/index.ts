import express, { Request, Response, NextFunction } from "express";

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for GET request
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World from TypeScript!");
});

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new Error("Not Found") as any;
  err.status = 404;
  next(err);
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
