import mongoose, { Document, Model } from "mongoose";
import Product from "./product/product";

export interface IOrder extends Document {
  user: string;
  orderItems: [
    {
      product: string;
      quantity: number;
    },
  ];
  shippingAddress: string;
  paymentMethod?: string;
  totalAmount: number;
  paymentStatus?: boolean;
  status?: string;
  currency?: string;
}

interface IOrderModel extends Model<IOrder> {}

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "ProductId is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be grater the zero"],
        },
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
      default: "USD",
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

orderSchema.post("save", async function (order, next) {
  try {
    const updateStockPromises = order.orderItems.map(async (item) => {
      await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: -item.quantity } }, { new: true, useFindAndModify: false });
    });

    // Wait for all the promises to complete
    await Promise.all(updateStockPromises);

    next();
  } catch (error: any) {
    next(error);
  }
});

const Order: IOrderModel = mongoose.model<IOrder, IOrderModel>("Order", orderSchema);

export default Order;
