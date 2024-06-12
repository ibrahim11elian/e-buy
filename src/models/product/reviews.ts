import mongoose, { Model, Schema } from "mongoose";

interface IReview {
  rating: number;
  review: string;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  populate: () => Promise<IReview>;
}

const reviewsSchema: Schema<IReview> = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
    },
    review: {
      type: String,
      required: [true, "Review is required"],
    },
  },
  {
    timestamps: true,
  },
);

reviewsSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "user",
      select: "name",
    },
  ]);

  next();
});

const Review: Model<IReview> = mongoose.model<IReview>("Review", reviewsSchema);

export default Review;
