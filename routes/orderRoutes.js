import express from "express";
import {
  getOrderDetails,
  orderGetAllController,
  orderGetController,
  orderPostController,
  orderStatusController,
  sendConfirmationEmail,
} from "../controllers/orderController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";

const router = express.Router();

router.post("/", requireSignIn, orderPostController);
router.get("/orders", requireSignIn, orderGetController);
router.post("/confirmationorders", requireSignIn, sendConfirmationEmail);
router.get("/all-orders", requireSignIn, isAdmin, orderGetAllController);
router.get("/get-order/:orderId", getOrderDetails);
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);


export default router;
