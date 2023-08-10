import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "category",
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    sold: {
      type: Number,
      default:0,
    },
    weigh: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
    },
    photo: {
        type: String,
        required: true,
      },
    photoUrl: {
        type: String,
      },
    shipping: {
      type: Number,
      required: false,

    },
    ratings: [
      {
        star: Number,
        message: String,
        name: String,
        createdAt: String,
        postedby: { type: mongoose.ObjectId, ref: "users" },
      },
    ],
    totalrating: {
      type: String,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Products", productSchema);
