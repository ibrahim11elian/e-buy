import { Router } from "express";
import Authentication from "../controllers/helpers/authentication";
import Order from "../controllers/order";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const order = new Order();

router.route("/checkout").post(auth.protect, order.createOrder);

router.get("/", auth.protect, order.getUserOrders);
router
  .route("/:id")
  .all(auth.protect)
  .get(order.getOrder)
  .patch(auth.restrictTo("admin"), order.updateOrderStatus);

router.patch("/:id/cancel", auth.protect, order.cancelOrder);

export default router;
