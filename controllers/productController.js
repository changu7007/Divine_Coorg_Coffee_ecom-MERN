import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
// import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
// import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
// import shortid from "shortid";
import axios from "axios";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import couponModel from "../models/couponModel.js";
//config env
dotenv.config();

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

export const createProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      weigh,
      tax,
      sku,
      category,
      categoryName,
      stock,
      isFeatured,
      isNewArrival,
      discount,
      shipping,
    } = req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !weigh:
        return res.status(500).send({ error: "Weigh is Required" });
      case !tax:
        return res.status(500).send({ error: "TAX is Required" });
      case !sku:
        return res.status(500).send({ error: "SKU is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !categoryName:
        return res.status(500).send({ error: "CategoryName is Required" });
      case !stock:
        return res.status(500).send({ error: "stock is Required" });
      case !photo:
        return res.status(500).send({ error: "photo is Required " });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      const fileContent = fs.createReadStream(photo.path);
      const photoName = randomImageName();
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: photoName,
        Body: fileContent,
        ContentType: photo.type,
      };
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
      console.log(data);
      products.photo = "https://d26jxww88dzshe.cloudfront.net/" + photoName;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("photo")
      .populate("category")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "ALlProducts ",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .populate("photo")
      .populate("category");
    // .populate("ratings.postedby");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Eror while getitng single product",
      error,
    });
  }
};

//getFeaturedProducts
export const getAllFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await productModel
      .find({ isFeatured: true })
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Fetched All Featured Products",
      featuredProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went Wrong while fetching Featired Products",
      error,
    });
  }
};

//getNewArrivalProducts
export const getNewArrivalProducts = async (req, res) => {
  try {
    const newArrivalProducts = await productModel
      .find({ isNewArrival: true })
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Fetched All New Arrival Products",
      newArrivalProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went Wrong while fetching new Arrival Products",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    await productModel.findByIdAndDelete(req.params.pid);
    // const delParams = {
    //   Bucket: process.env.BUCKET_NAME,
    //   Key: product.photo,
    // };
    // const delCommand = new DeleteObjectCommand(delParams);
    // await s3.send(delCommand);
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//upate producta
export const updateProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      categoryName,
      stock,
      weigh,
      tax,
      sku,
      isFeatured,
      isNewArrival,
      discount,
      shipping,
    } = req.fields;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !weigh:
        return res.status(500).send({ error: "Weigh is Required" });
      case !tax:
        return res.status(500).send({ error: "TAX is Required" });
      case !sku:
        return res.status(500).send({ error: "SKU is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !categoryName:
        return res.status(500).send({ error: "CategoryName is Required" });
      case !stock:
        return res.status(500).send({ error: "Stock is Required" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (req.files.photo) {
      const { photo } = req.files;
      const fileContent = fs.createReadStream(photo.path);
      const photoName = randomImageName();
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: photoName,
        Body: fileContent,
        ContentType: photo.type,
      };
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
      products.photo = "https://d26jxww88dzshe.cloudfront.net/" + photoName;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Updte product",
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const resutls = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .populate("category");
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// // similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
};

// // get prdocyst by catgory
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

//phonepe
export const checkoutController = async (req, res) => {
  const amt = req.query.amount;
  const number = req.query.phoneNo;
  try {
    const data = {
      merchantId: "MERCHANTUAT",
      merchantTransactionId: "MT7850590068188103",
      merchantUserId: "MUID123",
      amount: amt * 100,
      redirectUrl: "http://localhost:8080/api/v1/product/redirect", // replace with your route
      redirectMode: "POST",
      callbackUrl: " http://localhost:8080/api/v1/product/response", // replace with your route
      mobileNumber: number,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const encode = Buffer.from(JSON.stringify(data)).toString("base64");

    const saltKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const saltIndex = 1;

    const string = `${encode}/pg/v1/pay${saltKey}`;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");

    const finalXHeader = `${sha256}###${saltIndex}`;

    const response = await axios.post(
      "https://api-preprod.phonepe.com/apis/merchant-simulator/pg/v1/pay",
      {
        request: encode,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": finalXHeader,
        },
      }
    );
    const rData = response.data;
    res.send({
      success: true,
      redirectUrl: rData.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Some error occurred");
  }
};

export const redirectController = async (req, res) => {
  const paymentDetails = req.body;

  // For example, you might extract the transaction ID like this:
  const transactionId = paymentDetails.transactionId;
  const merchantId = paymentDetails.merchantId;

  // Once validated, redirect to frontend
  res.redirect(
    `http://localhost:3000/cart?paymentStatus=success&transactionId=${transactionId}&merchantId=${merchantId}`
  ); // Include other necessary details
};

//razorpay
// export const checkoutRazorpayController = async (req, res) => {
//   try {
//     var instance = new Razorpay({
//       key_id: process.env.RAZORPAY_API_KEY,
//       key_secret: process.env.RAZORPAY_API_SECRET,
//     });

//     const options = {
//       amount: Number(req.body.amount * 100), // amount in the smallest currency unit
//       currency: "INR",
//       receipt: shortid.generate(),
//     };
//     const order = await instance.orders.create(options);
//     if (!order) return res.status(500).send("Some error occured");
//     res.status(200).send({
//       success: true,
//       order,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(400).send({
//       success: false,
//       error,
//       message: "Error while doing Checkout",
//     });
//   }
// };

//phone paymentVerification
export const paymentVerification = async (req, res) => {
  try {
    const input = req.body;

    const saltKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const saltIndex = 1;

    const finalXHeader =
      crypto
        .createHash("sha256")
        .update(
          `/pg/v1/status/${input.merchantId}/${input.transactionId}${saltKey}`
        )
        .digest("hex") + `###${saltIndex}`;

    const response = await axios.get(
      `https://api-preprod.phonepe.com/apis/merchant-simulator/pg/v1/status/${input.merchantId}/${input.transactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": finalXHeader,
          "X-MERCHANT-ID": input.transactionId,
        },
      }
    );

    console.log(response.data);
    const data = response.data;
    if (data.code === "PAYMENT_SUCCESS") {
      res.send({
        success: true,
        message: "Your payment is successful.",
        paymentDetails: data.data,
      });
    } else {
      res.send({
        success: false,
        message: "Your payment was not successful.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Some error occurred");
  }
};

//razorpay paymentVerification
// export const paymentRazorpayVerification = async (req, res) => {
//   try {
//     const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
//     const body = razorpayOrderId + "|" + razorpayPaymentId;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     const isAuthentic = expectedSignature === razorpaySignature;
//     if (isAuthentic) {
//       console.log(razorpayPaymentId);
//       res.status(200).send({ success: true, message: "Payment Successfull" });
//     } else {
//       res.status(400).json({
//         success: false,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).send({
//       success: false,
//       error,
//       message: "Error while payment Verification",
//     });
//   }
// };

//razorpay key
// export const getKey = async (req, res) => {
//   res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
// };

//product rating

export const rating = async (req, res) => {
  // console.log(req.body)
  const { id } = req.user;
  const { star, prodId, name, createdAt, message } = req.fields;
  const { photo } = req.files;

  try {
    const product = await productModel.findById(prodId).sort({ ratings: "-1" });
    let imgUrl = "";
    if (photo) {
      const fileContent = fs.createReadStream(photo.path);
      const photoName = randomImageName();
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: photoName,
        Body: fileContent,
        ContentType: photo.type,
      };
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
      imgUrl = `https://d26jxww88dzshe.cloudfront.net/${photoName}`;
    }
    const ratingData = {
      star,
      message,
      name,
      createdAt,
      postedby: id,
      imgUrl,
    };

    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === id.toString()
    );
    if (alreadyRated) {
      const updateRating = await productModel.updateOne(
        {
          "ratings._id": alreadyRated._id,
        },
        {
          $set: {
            "ratings.$.star": star,
            "ratings.$.message": message,
            "ratings.$.name": name,
            "ratings.$.createdAt": createdAt,
            "ratings.$.imgUrl": imgUrl,
          },
        },
        {
          timestamps: true,
        }
      );
      res.json(updateRating);
    } else {
      product.ratings.push(ratingData);
      await product.save();
      res.json(product);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error in server while updating rating",
    });
  }
};

export const getAllRatings = async (req, res) => {
  const { prodId } = req.body;
  try {
    const getAllRatings = await productModel.findById(prodId);
    let totalRating = getAllRatings.ratings.length;
    let ratingSum = getAllRatings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round((ratingSum / totalRating) * 10) / 10;
    if (Number(actualRating) === parseInt(actualRating)) {
      actualRating = actualRating + ".0"; // Add ".0" for whole numbers
    }

    let finalProduct = await productModel.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
      },
      { new: true }
    );
    res.json(finalProduct);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error in server",
    });
  }
};

export const getAllProductReviews = async (req, res) => {
  try {
    const products = await productModel.find().sort({ createdAt: -1 });
    const allProductReviews = products.map((product) => {
      // Sort the ratings array by ascending order of createdAt
      const sortedRatings = product.ratings.slice().sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return {
        prodId: product._id,
        prodName: product.name,
        ratings: sortedRatings,
      };
    });

    res.json({ reviews: allProductReviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const products = await productModel.find().sort({ createdAt: -1 });
    let totalReviews = 0;
    let totalRatingsSum = 0;

    const allProductReviews = products.map((product) => {
      // Sort the ratings array by ascending order of createdAt
      const sortedRatings = product.ratings.slice().sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      totalReviews += sortedRatings.length;
      totalRatingsSum += sortedRatings.reduce(
        (sum, rating) => sum + rating.star,
        0
      );
      return {
        prodId: product._id,
        prodName: product.name,
        ratings: sortedRatings,
      };
    });

    const totalAverageRating =
      totalReviews > 0 ? (totalRatingsSum / totalReviews).toFixed(1) : 0;
    res.json({ reviews: allProductReviews, totalReviews, totalAverageRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyReview = async (req, res) => {
  const { prodId, reviewId, isVerified } = req.body; // isVerified will be either true or false

  try {
    const product = await productModel.findById(prodId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const review = product.ratings.id(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    review.isVerified = isVerified;
    await product.save();

    res.json({ success: true, message: "Review verification status updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error,
      message: "Error updating review verification status",
    });
  }
};

export const featureReview = async (req, res) => {
  const { prodId, reviewId, featureReview } = req.body; // featureReview will be either true or false

  try {
    const product = await productModel.findById(prodId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const review = product.ratings.id(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    review.featureReview = featureReview;
    await product.save();

    res.json({ success: true, message: "featureReview status updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error,
      message: "Error updating review verification status",
    });
  }
};

export const applyCoupon = async (req, res) => {
  const { coupon } = req.body;
  const validCoupon = await couponModel.findOne({ name: coupon });
  if (validCoupon === null) {
    res.status(201).send({
      success: false,
      message: "Invalid Coupon",
    });
  } else {
    res.status(201).send({
      success: true,
      coupon: coupon,
      discount: validCoupon.discount,
      message: "Coupoun Verified",
    });
  }
};
