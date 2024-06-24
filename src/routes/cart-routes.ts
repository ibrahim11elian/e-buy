import { Router } from "express";
import Cart from "../controllers/cart";
import Authentication from "../controllers/helpers/authentication";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const cart = new Cart();

router
  .route("/")
  .all(auth.protect)
  .post(cart.addOrUpdateCartItem)
  .get(cart.getCartList);
router
  .route("/:id")
  .all(auth.protect, cart.checkCartOwner)
  .patch(cart.updateCartItem)
  .delete(cart.deleteCartItem);

export default router;
