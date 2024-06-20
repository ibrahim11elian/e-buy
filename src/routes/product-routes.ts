import { Router } from "express";
import Authentication from "../controllers/authentication";
import Product from "../controllers/product";
import reviewRouter from "./review-routes";

const router = Router({
  mergeParams: true,
});

router.use("/:productId/reviews", reviewRouter);

const auth = new Authentication();
const product = new Product();

router
  .route("/")
  .post(auth.protect, auth.restrictTo("admin"), product.createProduct)
  .get(product.getProducts);

router
  .route("/:id")
  .get(product.getProduct)
  .all(auth.protect, auth.restrictTo("admin"))
  .patch(product.updateOne)
  .delete(product.deleteOne);

export default router;
