"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = __importDefault(require("./controllers/helpers/error"));
const error_2 = __importDefault(require("./utils/error"));
const routes_1 = require("./routes");
const order_1 = __importDefault(require("./controllers/order"));
const snitize_input_1 = __importDefault(require("./utils/snitize-input"));
const logger_1 = __importDefault(require("./utils/logger"));
const cloudinary_config_1 = __importDefault(require("./utils/cloudinary-config"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// this prevent the rate limiter effectively a global one and blocking all requests once the limit is reached (and this solve this issue)
// Where numberOfProxies (in this case 3) is the number of proxies between the user and the server(in this case vercel).
app.set("trust proxy", 3);
// Middlewares
// set security http headers
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Use morgan middleware for logging HTTP requests
// Custom Morgan format string for JSON logging
app.use((0, morgan_1.default)((tokens, req, res) => {
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
}, {
    stream: {
        write: (message) => logger_1.default.info(JSON.parse(message)),
    },
}));
// Data sanitization against NoSQL injection
app.use((0, express_mongo_sanitize_1.default)());
// Data sanitization against XSS
// Use custom sanitize middleware
app.use(snitize_input_1.default);
// Prevent parameter pollution ex.(?sort=price&sort=name)
app.use((0, hpp_1.default)());
// Limit requests from the same IP
const limiter = (0, express_rate_limit_1.default)({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);
// Compress middleware
app.use((0, compression_1.default)());
// Stripe webhook
// Handling webhook endpoint before body parser to receive raw data
app.post("/webhook", express_1.default.raw({ type: "application/json" }), new order_1.default().handleStripeWebhook);
// Body parser
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: false, limit: "10kb" }));
// cookie parser
app.use((0, cookie_parser_1.default)());
// configure cloudinary
(0, cloudinary_config_1.default)();
app.get("/", (req, res) => {
    res.send("<h1>Welcome To E-Buy API</h1>");
});
app.use("/api/v1/users", routes_1.userRouter);
app.use("/api/v1/products", routes_1.productRouter);
app.use("/api/v1/reviews", routes_1.reviewRouter);
app.use("/api/v1/cart", routes_1.cartRouter);
app.use("/api/v1/orders", routes_1.orderRouter);
app.use("/api/v1/admin", routes_1.adminRouter);
// NOT FOUND
app.all("*", (req, res, next) => {
    next(new error_2.default("Route Not Found", 404));
});
// Global error handler
app.use(error_1.default);
exports.default = app;
