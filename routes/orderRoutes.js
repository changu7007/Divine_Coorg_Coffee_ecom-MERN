import express from "express";
import {
  orderBill,
  orderGetAllController,
  orderGetController,
  orderPostController,
  orderStatusController,
} from "../controllers/orderController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";

const router = express.Router();

router.post("/", requireSignIn, orderPostController);
router.get("/orders", requireSignIn, orderGetController);
router.get("/all-orders", requireSignIn, isAdmin, orderGetAllController);
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);
router.put("/getBill", requireSignIn, isAdmin, orderBill);

export default router;
