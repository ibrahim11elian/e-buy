"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../controllers/helpers/authentication"));
const dashboard_1 = __importDefault(require("../controllers/dashboard"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const dashboard = new dashboard_1.default();
router.use(auth.protect, auth.restrictTo("admin"));
router.get("/sales", dashboard.getSales);
router.get("/products", dashboard.getTopProductSales);
router.get("/users", dashboard.getUserRegistrationsData);
router.get("/orders", dashboard.getOrdersStats);
router.get("/revenue", dashboard.getRevenueMetrics);
exports.default = router;
