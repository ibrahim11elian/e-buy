import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import errorHandler from "./controllers/error";
import AppError from "./utils/error";
import { cartRouter, productRouter, userRouter } from "./routes";

dotenv.config();
const app: express.Application = express();

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
// cookie parser
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Welcome To E-Buy API</h1>");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);

// NOT FOUND
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError("Route Not Found", 404));
});

// Global error handler
app.use(errorHandler);

export default app;
