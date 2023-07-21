import express from "express";
import {
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
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);


export default router;
