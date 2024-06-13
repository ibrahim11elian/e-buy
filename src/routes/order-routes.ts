import { Router } from "express";
import Authentication from "../controllers/authentication";
import Order from "../controllers/order";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const order = new Order();

router.route("/checkout").post(auth.protect, order.createOrder);

router.get("/", auth.protect, order.getUserOrders);
router.get("/:id", auth.protect, order.getOrder);

export default router;
