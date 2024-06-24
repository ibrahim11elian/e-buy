import { Router } from "express";
import Authentication from "../../controllers/helpers/authentication";
import cartRouter from "../cart-routes";
import orderRouter from "../order-routes";
import profileRouter from "./profile-routes";
import addressRouter from "./address-routes";
import favoritesRouter from "./favorites-routes";
import UserController from "../../controllers/user/user";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const user = new UserController();

router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/profile", profileRouter);
router.use("/address", addressRouter);
router.use("/favorites", favoritesRouter);

// user routes
router.post("/signup", auth.signup);
router.post("/login", auth.validateLoginAttempt, auth.login);
router.delete("/logout", auth.logout);
router.delete("/logout-all", auth.logoutAll);
router.get("/verify-email", auth.verifyEmail);
router.post("/resend-verification-email", auth.resendVerificationEmail);
router.post("/refresh-token", auth.refreshToken);

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
