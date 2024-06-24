import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFavorites extends Document {
  products: mongoose.Schema.Types.ObjectId[];
}

const favoriteSchema: Schema<IFavorites> = new mongoose.Schema<IFavorites>(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      auto: false,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  },
);

favoriteSchema.index({ createdAt: 1 });

const Favorite: Model<IFavorites> = mongoose.model<IFavorites>(
  "Favorite",
  favoriteSchema,
);

export default Favorite;
