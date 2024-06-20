import mongoose, { Schema, Model, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  currency: "USD" | "EUR" | "EGP";
  stockQuantity: number;
  ratingsAverage: number;
  numOfReviews: number;
}

const productSchema: Schema<IProduct> = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);

export default Product;
