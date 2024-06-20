/* eslint-disable no-unused-vars */
import mongoose, { Model, Schema, Document, Query } from "mongoose";
import Product from "./product";

export interface IReview extends Document {
  rating: number;
  review: string;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  populate: () => Promise<IReview>;
}

interface IReviewDocument extends IReview {}

export interface IReviewModel extends Model<IReview> {
  calcAverageRatings(productId: mongoose.Types.ObjectId): Promise<void>;
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
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
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

reviewsSchema.statics.calcAverageRatings = async function (
  productId: mongoose.Types.ObjectId,
) {
  const stats = await this.aggregate([
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

  await Product.findByIdAndUpdate(productId, {
    numOfReviews: stats.length > 0 ? stats[0].nRating : 0,
    ratingsAverage: stats.length > 0 ? stats[0].avgRating : 0,
  });
};

reviewsSchema.post("save", async function () {
  await (this.constructor as IReviewModel).calcAverageRatings(this.product);
});

reviewsSchema.pre<any>(/^findOneAnd/, async function (next) {
  // pass the data from pre to post middleware
  // reference the model to fetch the document before the update operation.
  const doc = await (this.model as IReviewModel).findOne(this.getQuery());

  if (doc) {
    (this as any).r = doc;
  }
  next();
});

reviewsSchema.post<any>(/^findOneAnd/, async function (doc) {
  if ((this as any).r) {
    await (this as any).r.constructor.calcAverageRatings(
      (this as any).r.product,
    );
  }
});

const Review: IReviewModel = mongoose.model<IReview, IReviewModel>(
  "Review",
  reviewsSchema,
);

export default Review;
