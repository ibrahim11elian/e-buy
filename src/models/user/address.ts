import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
}

const addressSchema: Schema<IAddress> = new mongoose.Schema<IAddress>(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      auto: false,
    },
    addressLine: {
      type: String,
      required: [true, "Address is required"],
    },
    city: {
      type: String,
      required: [true, "State is required"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal Code is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
  },
  {
    timestamps: true,
  },
);

const Address: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema,
);

export default Address;
