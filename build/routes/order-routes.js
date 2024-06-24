"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../controllers/helpers/authentication"));
const order_1 = __importDefault(require("../controllers/order"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const order = new order_1.default();
router.route("/checkout").post(auth.protect, order.createOrder);
router.get("/", auth.protect, order.getUserOrders);
router
    .route("/:id")
    .all(auth.protect)
    .get(order.getOrder)
    .patch(auth.restrictTo("admin"), order.updateOrderStatus);
router.patch("/:id/cancel", auth.protect, order.cancelOrder);
exports.default = router;
