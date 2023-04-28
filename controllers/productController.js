import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
// import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import shortid from "shortid";

//config env
dotenv.config();

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
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
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
      message: "Error in crearing product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
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
      .select("-photo")
      .populate("category")
      .populate("ratings.postedby");
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

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data.toString());
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
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
        return res.status(500).send({ error: "Stock is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
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

// // filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// // product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// // product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// // search product
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
      .select("-photo");
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
      .select("-photo")
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

//only filter coffee category products
export const productCategoryFilter = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: "filter-coffee" });
    const products = await productModel
      .find({ category })
      .select("-photo")
      .populate("category");
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

//only instant coffee category products
export const productCategoryInstant = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: "instant-coffee" });
    const products = await productModel
      .find({ category })
      .select("-photo")
      .populate("category");
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

//razorpay
export const checkoutController = async (req, res) => {
  try {
    var instance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const options = {
      amount: Number(req.body.amount * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: shortid.generate(),
    };
    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");
    res.status(200).send({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error while doing Checkout",
    });
  }
};

//razorpay paymentVerification
export const paymentVerification = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpaySignature;
    if (isAuthentic) {
      console.log(razorpayPaymentId);
      res.status(200).send({ success: true, message: "Payment Successfull" });
    } else {
      res.status(400).json({
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error while payment Verification",
    });
  }
};

//razorpay key
export const getKey = async (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
};

//product rating
export const rating = async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, message, createdAt, name } = req.body;
  try {
    const product = await productModel
      .findById(prodId)
      .select("-photo")
      .sort({ ratings: "-1" });
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await productModel.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: {
            "ratings.$.star": star,
            "ratings.$.message": message,
            "ratings.$.name": name,
            "ratings.$.createdAt": createdAt,
          },
        },
        {
          timestamps: true,
        }
      );
      res.json(updateRating);
    } else {
      const rateProduct = await productModel.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              message: message,
              name: name,
              createdAt: createdAt,
              postedby: _id,
            },
          },
        },
        {
          timestamps: true,
        }
      );
      res.json(rateProduct);
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
