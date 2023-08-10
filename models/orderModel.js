import mongoose from "mongoose";

const reqString = { type: String, required: true };
const reqNumber = { type: Number, required: true };

const orderSchema = new mongoose.Schema(
  {
    subTotal: reqNumber,

    products: [
      {
        product: { type: mongoose.ObjectId, ref: "Products" },
        quantity: reqNumber,
        totalPrice: reqNumber,
      },
    ],
    cartItems: [
      {
        product: { type: mongoose.ObjectId, ref: "Products" },
        name: reqString,
        categoryName: reqString,
        photo: reqString,
        photoUrl : reqString,
        oneQuantityPrice: reqNumber,
        price: reqNumber,
        quantity: reqNumber,
        slug: reqString,
      },
    ],
    paymentDetails: {
      orderId: reqString,
      merchantTransactionId: reqString,
      transactionId: reqString,
      paymentMethod:reqString
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
