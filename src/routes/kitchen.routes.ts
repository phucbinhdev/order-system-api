import { Router } from "express";
import * as KitchenController from "../controllers/kitchen.controller";
import auth from "../middlewares/auth.middleware";
import authorize from "../middlewares/role.middleware";

const router = Router();

// Protect all kitchen routes
router.use(auth);

// Get active orders
router.get("/orders", KitchenController.getActiveOrders);

// Mark out of stock
router.post("/inventory/out-of-stock", KitchenController.markOutOfStock);

export default router;
