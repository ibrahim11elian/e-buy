import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import errorHandler from "./controllers/error";
import AppError from "./utils/error";
import {
  adminRouter,
  cartRouter,
  orderRouter,
  productRouter,
  reviewRouter,
  userRouter,
} from "./routes";
import OrderController from "./controllers/order";
import sanitizeInput from "./utils/snitize-input";
import logger from "./utils/logger";
import cloudinaryConfig from "./utils/cloudinary-config";

dotenv.config();
const app: express.Application = express();

// Middlewares
// set security http headers
app.use(helmet());

app.use(cors());

// Use morgan middleware for logging HTTP requests
// Custom Morgan format string for JSON logging
app.use(
  morgan(
    (tokens: { [key: string]: any }, req, res) => {
      return JSON.stringify({
        remoteAddr: tokens["remote-addr"](req, res),
        date: tokens["date"](req, res, "clf"),
        method: tokens["method"](req, res),
        url: tokens["url"](req, res),
        httpVersion: tokens["http-version"](req, res),
        status: tokens["status"](req, res),
        contentLength: tokens["res"](req, res, "content-length"),
        referrer: tokens["referrer"](req, res),
        userAgent: tokens["user-agent"](req, res),
        responseTime: tokens["response-time"](req, res),
      });
    },
    {
      stream: {
        write: (message) => logger.info(JSON.parse(message)),
      },
    },
  ),
);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
// Use custom sanitize middleware
app.use(sanitizeInput);

// Prevent parameter pollution ex.(?sort=price&sort=name)
app.use(hpp());

// Limit requests from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

// Compress middleware
app.use(compression());

// Stripe webhook
// Handling webhook endpoint before body parser to receive raw data
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  new OrderController().handleStripeWebhook,
);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
// cookie parser
app.use(cookieParser());

// configure cloudinary
cloudinaryConfig();

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Welcome To E-Buy API</h1>");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/admin", adminRouter);

// NOT FOUND
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError("Route Not Found", 404));
});

// Global error handler
app.use(errorHandler);

export default app;
