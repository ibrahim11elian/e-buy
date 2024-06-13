/* eslint-disable no-unused-vars */
import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  product: { _id: mongoose.Types.ObjectId; name: string; stockQuantity: number };
  quantity: number;
  price: number;
  populate: () => Promise<ICart>;
}

interface ICartModel extends Model<ICart> {
  calcTotalPrice(userId: string): Promise<number>;
}

const cartItemSchema: Schema<ICart> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
    },
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
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
  },
  {
    timestamps: true,
  },
);

cartItemSchema.index({ user: 1, product: 1 });

cartItemSchema.index({ user: 1 });

cartItemSchema.pre(/^find/, function (next) {
  this.populate({
    path: "product",
    select: "name stockQuantity",
  });
  next();
});

cartItemSchema.statics.calcTotalPrice = async function (userId: string) {
  const total = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
  ]);

  return total.length > 0 ? total[0].totalPrice : 0;
};

const CartItem: ICartModel = mongoose.model<ICart, ICartModel>("Cart", cartItemSchema);

export default CartItem;
