import { Router } from "express";
import Authentication from "../controllers/authentication";
import cartRouter from "./cart-routes";
import orderRouter from "./order-routes";
import UserController from "../controllers/user";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const user = new UserController();

router.use("/cart", cartRouter);
router.use("/orders", orderRouter);

router.post("/signup", auth.signup);
router.post("/login", auth.validateLoginAttempt, auth.login);
router.delete("/logout", auth.logout);
router.get("/verify-email", auth.verifyEmail);
router.post("/resend-verification-email", auth.resendVerificationEmail);

// password routes
router.post("/forgotPassword", auth.forgotPassword);
router.patch("/resetPassword/:token", auth.resetPassword);

router.use(auth.protect);

// current user control routes
router.patch("/updatePassword", auth.updatePassword);
router.route("/me").get(user.getMe).patch(user.updateMe).delete(user.deleteMe);

// adding restriction to all routes that are coming after that
router.use(auth.restrictTo("admin"));

router.get("/", user.getAllUsers);
router
  .route("/:id")
  .get(user.getUserByID)
  .patch(user.updateUser)
  .delete(user.deleteUser);

export default router;
