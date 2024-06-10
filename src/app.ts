import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();
const app: express.Application = express();

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Welcome To E-Buy API</h1>");
});

// NOT FOUND
app.all("*", (_, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

export default app;
