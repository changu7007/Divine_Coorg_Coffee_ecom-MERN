import mongoose from "mongoose";

const reqString = { type: String, required: true };
const reqNumber = { type: Number, required: true };

const orderSchema = new mongoose.Schema(
  {
    subTotal: reqNumber,

    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
        quantity: reqNumber,
        totalPrice: reqNumber,
      },
    ],
    cartItems: [
      {
        name: reqString,
        categoryName: reqString,
        oneQuantityPrice: reqNumber,
        price: reqNumber,
        quantity: reqNumber,
        slug: reqString,
      },
    ],
    paymentDetails: {
      orderId: reqString,
      razorpayOrderId: reqString,
      razorpayPaymentId: reqString,
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      default: "Processing",
      enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
