import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
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
      enum: { values: ["USD", "EUR", "EGP"], message: "Currency must be in USD or EUR or EGP" },
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
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
