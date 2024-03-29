import express from "express";
import formidable from "express-formidable";
import {
  applyCoupon,
  checkoutController,
  createProductController,
  deleteProductController,
  featureReview,
  getAllFeaturedProducts,
  getAllProductReviews,
  getAllRatings,
  getAllReviews,
  getNewArrivalProducts,
  // getKey,
  getProductController,
  getSingleProductController,
  paymentVerification,
  productCategoryController,
  rating,
  realtedProductController,
  redirectController,
  searchProductController,
  updateProductController,
  verifyReview,
} from "../controllers/productController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";

const router = express.Router();

//routes
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

// //routes
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

// //rating
router.put("/rating", requireSignIn,formidable(), rating);
router.put("/getAllRating", requireSignIn, getAllRatings);
router.put("/review/verify", requireSignIn,isAdmin, verifyReview);
router.put("/review/feature-review", requireSignIn,isAdmin, featureReview);
router.get("/all-reviews",requireSignIn, isAdmin, getAllProductReviews)
router.get("/only-reviews", getAllReviews)


//get products
router.get("/get-product", getProductController);
router.get("/get-featured", getAllFeaturedProducts);
router.get("/get-newArrivals", getNewArrivalProducts);

//single product
router.get("/get-product/:slug", getSingleProductController);

//delete rproduct
router.delete("/delete-product/:pid", deleteProductController);

//search product
router.get("/search/:keyword", searchProductController);

// //similar product
router.get("/related-product/:pid/:cid", realtedProductController);

//category wise product
router.get("/product-category/:slug", productCategoryController);

router.get("/phonepe", checkoutController);

router.post("/redirect", redirectController);

router.all("/response", paymentVerification);

router.post("/verify-coupon",applyCoupon)


// router.get("/getKey", getKey);


export default router;
