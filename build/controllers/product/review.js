"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reviews_1 = __importDefault(require("../../models/product/reviews"));
const base_1 = __importDefault(require("../helpers/base"));
const error_1 = __importDefault(require("../../utils/error"));
const product_1 = __importDefault(require("../../models/product/product"));
const order_1 = __importDefault(require("../../models/order"));
class ReviewsController extends base_1.default {
    constructor() {
        super(reviews_1.default);
        this.createReview = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.params.productId)
                    req.body.product = req.params.productId;
                const { product, rating, review } = req.body;
                if (!product || !rating || !review) {
                    return next(new error_1.default("You need to add the product id, rating and review", 400));
                }
                const productExist = yield product_1.default.findById(product);
                if (!productExist) {
                    return next(new error_1.default("There is no product with that id", 400));
                }
                // Check if the user has ordered the product and the order is delivered
                const orderExist = yield order_1.default.findOne({
                    user: req.user.id,
                    "orderItems.product": product,
                    status: "Delivered",
                });
                if (!orderExist) {
                    return next(new error_1.default("You can only review products you have ordered and are delivered", 400));
                }
                req.body.user = req.user.id;
                return yield this.createOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.getReview = this.getOne();
        this.getReviews = (req, res, next) => {
            if (req.params.productId)
                req.query.product = req.params.productId;
            if (req.body.product)
                req.query.product = req.body.product;
            return this.getAll()(req, res, next); // immediately invoking the function returned by getAll
        };
        this.checkReviewOwner = ({ allowAdmin = false }) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { id } = req.params;
                    const review = yield reviews_1.default.findById(id);
                    if (!review) {
                        return next(new error_1.default("Review not found", 404));
                    }
                    // Allow admin users to proceed if it allowed
                    if (allowAdmin && req.user.role === "admin") {
                        return next();
                    }
                    // Allow review owner to proceed
                    if (review.user.id.toString() === req.user.id) {
                        return next();
                    }
                    // If the user is neither the owner nor an admin, deny access
                    return next(new error_1.default("You don't have permission to perform this action", 403));
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.updateReview = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                delete req.body.user;
                delete req.body.product;
                return yield this.updateOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteReview = this.deleteOne();
    }
}
exports.default = ReviewsController;
