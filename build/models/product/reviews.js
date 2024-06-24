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
/* eslint-disable no-unused-vars */
const mongoose_1 = __importDefault(require("mongoose"));
const product_1 = __importDefault(require("./product"));
const reviewsSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "UserId is required"],
    },
    product: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "ProductId is required"],
    },
    rating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must be at most 5"],
        required: [true, "Rating is required"],
    },
    review: {
        type: String,
        required: [true, "Review is required"],
    },
}, {
    timestamps: true,
});
reviewsSchema.index({ createdAt: -1 });
reviewsSchema.pre(/^find/, function (next) {
    this.populate([
        {
            path: "user",
            select: "name",
        },
    ]);
    next();
});
reviewsSchema.statics.calcAverageRatings = function (productId) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield this.aggregate([
            {
                $match: { product: productId },
            },
            {
                $group: {
                    _id: "$product",
                    nRating: { $sum: 1 },
                    avgRating: { $avg: "$rating" },
                },
            },
        ]);
        yield product_1.default.findByIdAndUpdate(productId, {
            numOfReviews: stats.length > 0 ? stats[0].nRating : 0,
            ratingsAverage: stats.length > 0 ? stats[0].avgRating : 0,
        });
    });
};
reviewsSchema.post("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.constructor.calcAverageRatings(this.product);
    });
});
reviewsSchema.pre(/^findOneAnd/, function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // pass the data from pre to post middleware
        // reference the model to fetch the document before the update operation.
        const doc = yield this.model.findOne(this.getQuery());
        if (doc) {
            this.r = doc;
        }
        next();
    });
});
reviewsSchema.post(/^findOneAnd/, function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.r) {
            yield this.r.constructor.calcAverageRatings(this.r.product);
        }
    });
});
const Review = mongoose_1.default.model("Review", reviewsSchema);
exports.default = Review;
