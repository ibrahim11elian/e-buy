"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const review_1 = __importDefault(require("../../controllers/product/review"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const reviews = new review_1.default();
router
    .route("/")
    .post(auth.protect, reviews.createReview)
    .get(reviews.getReviews);
router
    .route("/:id")
    .all(auth.protect)
    .get(reviews.getReview)
    .patch(reviews.checkReviewOwner({ allowAdmin: false }), reviews.updateReview)
    .delete(reviews.checkReviewOwner({ allowAdmin: true }), reviews.deleteReview);
exports.default = router;
