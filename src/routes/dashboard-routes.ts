import { Router } from "express";
import Authentication from "../controllers/authentication";
import Dashboard from "../controllers/dashboard";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const dashboard = new Dashboard();

router.use(auth.protect, auth.restrictTo("admin"));

router.get("/sales", dashboard.getSales);
router.get("/product-sales", dashboard.getTopProductSales);
router.get("/category-sales", dashboard.getTopCategorySales);
router.get("/daily-sales", dashboard.getDailySales);
router.get("/monthly-sales", dashboard.getMonthlySales);
router.get("/user-registrations", dashboard.getUserRegistrationsData);
router.get("/order-status", dashboard.getOrdersStatusData);
router.get(
  "/order-fulfillment-efficiency",
  dashboard.getOrderFulfillmentEfficiency,
);

export default router;
