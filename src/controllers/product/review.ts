import { Request, Response, NextFunction } from "express";
import Review, { IReview } from "../../models/product/reviews";
import BaseController from "../helpers/base";
import AppError from "../../utils/error";
import Product from "../../models/product/product";
import Order from "../../models/order";

class ReviewsController extends BaseController<IReview> {
  constructor() {
    super(Review);
  }

  createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.params.productId) req.body.product = req.params.productId;
      const { product, rating, review } = req.body;

      if (!product || !rating || !review) {
        return next(
          new AppError(
            "You need to add the product id, rating and review",
            400,
          ),
        );
      }

      const productExist = await Product.findById(product);

      if (!productExist) {
        return next(new AppError("There is no product with that id", 400));
      }

      // Check if the user has ordered the product and the order is delivered
      const orderExist = await Order.findOne({
        user: req.user.id,
        "orderItems.product": product,
        status: "Delivered",
      });

      if (!orderExist) {
        return next(
          new AppError(
            "You can only review products you have ordered and are delivered",
            400,
          ),
        );
      }

      req.body.user = req.user.id;

      return await this.createOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  getReview = this.getOne();

  getReviews = (req: Request, res: Response, next: NextFunction) => {
    if (req.params.productId) req.query.product = req.params.productId;
    if (req.body.product) req.query.product = req.body.product;

    return this.getAll()(req, res, next); // immediately invoking the function returned by getAll
  };

  checkReviewOwner = ({ allowAdmin = false }: { allowAdmin?: boolean }) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const review = await Review.findById(id);

        if (!review) {
          return next(new AppError("Review not found", 404));
        }

        // Allow admin users to proceed if it allowed
        if (allowAdmin && req.user.role === "admin") {
          return next();
        }

        // Allow review owner to proceed
        if (review.user.id.toString() === req.user.id) {
          return next();
        }

        // If the user is neither the owner nor an admin, deny access
        return next(
          new AppError("You don't have permission to perform this action", 403),
        );
      } catch (error) {
        next(error);
      }
    };
  };
  updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      delete req.body.user;
      delete req.body.product;

      return await this.updateOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };
  deleteReview = this.deleteOne();
}

export default ReviewsController;
