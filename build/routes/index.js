"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRouter = exports.adminRouter = exports.orderRouter = exports.cartRouter = exports.productRouter = exports.userRouter = void 0;
const admin_routes_1 = __importDefault(require("./user/admin-routes"));
exports.adminRouter = admin_routes_1.default;
const cart_routes_1 = __importDefault(require("./cart-routes"));
exports.cartRouter = cart_routes_1.default;
const order_routes_1 = __importDefault(require("./order-routes"));
exports.orderRouter = order_routes_1.default;
const product_routes_1 = __importDefault(require("./product/product-routes"));
exports.productRouter = product_routes_1.default;
const user_routes_1 = __importDefault(require("./user/user-routes"));
exports.userRouter = user_routes_1.default;
const review_routes_1 = __importDefault(require("./product/review-routes"));
exports.reviewRouter = review_routes_1.default;
