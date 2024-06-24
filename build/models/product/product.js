"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        trim: true,
        maxLength: [40, "The Tour name must have max 40 character"],
        minLength: [10, "The Tour name must have min 10 character"],
        required: [true, "Product name is required"],
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
    },
    currency: {
        type: String,
        enum: {
            values: ["USD", "EUR", "EGP"],
            message: "Currency must be in USD or EUR or EGP",
        },
        default: "USD",
    },
    stockQuantity: {
        type: Number,
        required: [true, "Stock quantity is required"],
        min: [1, "Stock quantity must be at least 1"],
    },
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    images: [String],
    ratingsAverage: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    cloudinaryPublicId: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
// Adding a text index for full-text search on the name and description fields
productSchema.index({ name: "text", description: "text" });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
