"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_routes_1 = __importDefault(require("./user-routes"));
const product_routes_1 = __importDefault(require("../product/product-routes"));
const order_routes_1 = __importDefault(require("../order-routes"));
const dashboard_routes_1 = __importDefault(require("../dashboard-routes"));
const router = (0, express_1.Router)();
router.use("/users", user_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/orders", order_routes_1.default);
router.use("/dashboard", dashboard_routes_1.default);
exports.default = router;
