import { Router } from "express";
import Authentication from "../controllers/authentication";
import cartRouter from "./cart-routes";
import orderRouter from "./order-routes";

const router = Router();
const auth = new Authentication();

router.use("/cart", cartRouter);
router.use("/orders", orderRouter);

router.post("/signup", auth.signup);
router.post("/login", auth.validateLoginAttempt, auth.login);
router.delete("/logout", auth.logout);

router.patch("/updatePassword", auth.protect, auth.updatePassword);

export default router;
