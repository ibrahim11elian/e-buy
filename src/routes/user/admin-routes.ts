import { Router } from "express";
import userRouter from "./user-routes";
import productRouter from "../product/product-routes";
import orderRouter from "../order-routes";
import dashboardRouter from "../dashboard-routes";

const router = Router();

router.use("/users", userRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/dashboard", dashboardRouter);

export default router;
