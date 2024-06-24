import { Router } from "express";
import Authentication from "../../controllers/helpers/authentication";
import ReviewsController from "../../controllers/product/review";

const router = Router({
  mergeParams: true,
});

const auth = new Authentication();
const reviews = new ReviewsController();

router
  .route("/")
  .post(auth.protect, reviews.createReview)
  .get(reviews.getReviews);

router
  .route("/:id")
  .all(auth.protect)
  .get(reviews.getReview)
  .patch(reviews.checkReviewOwner({ allowAdmin: false }), reviews.updateReview)
  .delete(reviews.checkReviewOwner({ allowAdmin: true }), reviews.deleteReview);

export default router;
