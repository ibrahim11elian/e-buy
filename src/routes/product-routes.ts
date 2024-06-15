import { Router } from "express";
import Authentication from "../controllers/authentication";
import Product from "../controllers/product";

const router = Router({
  mergeParams: true,
});
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
