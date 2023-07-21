import express from "express";
import formidable from "express-formidable";
import {
  checkoutController,
  createProductController,
  deleteProductController,
  getAllRatings,
  // getKey,
  getProductController,
  getSingleProductController,
  paymentVerification,
  productCategoryController,
  productCategoryFilter,
  productCategoryInstant,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  rating,
  realtedProductController,
  redirectController,
  searchProductController,
  updateProductController,
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
router.put("/rating", requireSignIn, rating);
router.put("/getAllRating", requireSignIn, getAllRatings);

//get products
router.get("/get-product", getProductController);

//single product
router.get("/get-product/:slug", getSingleProductController);

//get photo
router.get("/product-photo/:pid", productPhotoController);

//delete rproduct
router.delete("/delete-product/:pid", deleteProductController);

//filter product
router.post("/product-filters", productFiltersController);

//product count
router.get("/product-count", productCountController);

// //product per page
router.get("/product-list/:page", productListController);

//search product
router.get("/search/:keyword", searchProductController);

// //similar product
router.get("/related-product/:pid/:cid", realtedProductController);

//category wise product
router.get("/product-category/:slug", productCategoryController);

router.get("/filter-coffee", productCategoryFilter);

router.get("/instant-coffee", productCategoryInstant);

router.get("/phonepe", checkoutController);

router.post("/redirect", redirectController);

router.all("/response", paymentVerification);



// router.get("/getKey", getKey);

// //payments routes
// //token
// router.get("/braintree/token", braintreeTokenController);

// //payments
// router.post("/braintree/payment", requireSignIn, brainTreePaymentController);

export default router;
