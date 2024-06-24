"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const cart_routes_1 = __importDefault(require("../cart-routes"));
const order_routes_1 = __importDefault(require("../order-routes"));
const profile_routes_1 = __importDefault(require("./profile-routes"));
const address_routes_1 = __importDefault(require("./address-routes"));
const favorites_routes_1 = __importDefault(require("./favorites-routes"));
const user_1 = __importDefault(require("../../controllers/user/user"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const user = new user_1.default();
router.use("/cart", cart_routes_1.default);
router.use("/orders", order_routes_1.default);
router.use("/profile", profile_routes_1.default);
router.use("/address", address_routes_1.default);
router.use("/favorites", favorites_routes_1.default);
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
exports.default = router;
