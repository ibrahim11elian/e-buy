import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
    },
    orderItems: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Cart",
        required: [true, "Order Items are required"],
      },
    ],
    shippingAddress: {
      type: String,
      required: [true, "Shipping Address is required"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["Credit Card", "Cash On Delivery"],
        message: "Invalid Payment Method",
      },
      required: [true, "Payment Method is required"],
      default: "Credit Card",
    },
    totalAmount: {
      type: Number,
      required: [true, "Total Amount is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Shipped", "Delivered", "Cancelled"],
        message: "Invalid Status",
      },
      required: [true, "Status is required"],
      default: "Pending",
    },
    currency: {
      type: String,
      enum: {
        values: ["USD", "EUR", "EGP"],
        message: "Invalid Currency",
      },
      required: [true, "Currency is required"],
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
