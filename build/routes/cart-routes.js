"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_1 = __importDefault(require("../controllers/cart"));
const authentication_1 = __importDefault(require("../controllers/helpers/authentication"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const cart = new cart_1.default();
router
    .route("/")
    .all(auth.protect)
    .post(cart.addOrUpdateCartItem)
    .get(cart.getCartList);
router
    .route("/:id")
    .all(auth.protect, cart.checkCartOwner)
    .patch(cart.updateCartItem)
    .delete(cart.deleteCartItem);
exports.default = router;
