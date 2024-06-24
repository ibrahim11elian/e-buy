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
router.get("/products", dashboard.getTopProductSales);
router.get("/users", dashboard.getUserRegistrationsData);
router.get("/orders", dashboard.getOrdersStats);
router.get("/revenue", dashboard.getRevenueMetrics);

export default router;
