import { Router } from "express";
import userRouter from "./user-routes";
import productRouter from "./product-routes";
import orderRouter from "./order-routes";

const router = Router();

router.use("/users", userRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);

export default router;
