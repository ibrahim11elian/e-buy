"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const product_1 = __importDefault(require("../../controllers/product/product"));
const review_routes_1 = __importDefault(require("./review-routes"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
router.use("/:productId/reviews", review_routes_1.default);
const auth = new authentication_1.default();
const product = new product_1.default();
router
    .route("/")
    .post(auth.protect, auth.restrictTo("admin"), product.uploadProductImages, product.checkProduct, product.resizeProductImages, product.handleProductImagesUpload, product.createProduct)
    .get(product.getProducts);
router
    .route("/:id")
    .get(product.getProduct)
    .all(auth.protect, auth.restrictTo("admin"))
    .patch(product.uploadProductImages, product.checkProduct, product.resizeProductImages, product.handleProductImagesUpload, product.updateProduct)
    .delete(product.deleteProduct);
exports.default = router;
