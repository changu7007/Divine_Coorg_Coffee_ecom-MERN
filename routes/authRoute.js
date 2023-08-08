import express from "express";
import {
  testController,
  loginController,
  registerController,
  forgotPasswordController,
  updateProfileController,
  sendForm,
  handleRefreshToken,
  logout,
  forgotPasswordToken,
  resetPassword,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

router.post("/sendform", sendForm);

//LOGIN || METHOD POST
router.post("/login", loginController);

router.get("/refresh",handleRefreshToken)
router.get("/logout",logout)


//FORGET PASSWORD
router.post("/forgot-password", forgotPasswordController);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);

//test routes
router.get("/test", requireSignIn, isAdmin, testController);

// protected user route
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// admin protected route
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//update-profile
router.put("/profile", requireSignIn, updateProfileController, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;
