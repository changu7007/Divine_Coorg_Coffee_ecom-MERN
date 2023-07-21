import orderModel from "../models/orderModel.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import dotenv from "dotenv";
dotenv.config();

export const sendConfirmationEmail = async (req, res) => {
  try {
    const { email, name, orderId, transactionId, cartItems, subTotal } =
      req.body;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
      },
    });
    const simplifiedCartItems = cartItems.map(({name, price, quantity}) => ({name, price, quantity}));
    // Create a new mail generator object
    let mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Divine Coorg Coffee",
        link: "https://divinecoorgcoffee.co.in/logo.png",
      },
    });

    // Prepare email contents
    let emailBody = {
      body: {
        title: `Order confirmation - #${orderId}`,
        intro: `Your order has been placed successfully.\n\nHi ${name}, we're getting your order ready to be shipped.\n\nWe'll soon send your order tracking ID in 24-48 hours. The Tracking ID is generated by our shipping partner after they pick up the product from our warehouse.`,
        table: {
          data: simplifiedCartItems,
          columns: {
            // Optionally, customize the column titles
            custom: [
              { field: "name", title: "Product" },
              { field: "quantity", title: "Quantity" },
              { field: "price", title: "Price" },
            ],
          },
        },
        outro: `The total price is ${subTotal}.\n\nYour Transaction ID: ${transactionId} for Reference.\n\nThank you for your purchase!`,
      },
    };

    // Generate an HTML email with the provided contents
    let emailBodyHtml = mailGenerator.generate(emailBody);

    // Generate the plaintext version of the email
    let emailBodyText = mailGenerator.generatePlaintext(emailBody);

    // Send the email
    let info = await transporter.sendMail({
      from: `"Divine Coorg Coffee" <${process.env.MAIL}>`,
      to: email,
      subject: `Order confirmation - ${orderId}`,
      text: emailBodyText,
      html: emailBodyHtml,
    });
    console.log(`Message sent: ${info.messageId}`);
    return res.status(201).json({
      msg: "Order request Sent Successfully",
    });

  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error while sedning",
      error,
    });
  }
};

export const orderPostController = async (req, res) => {
  try {
    const order = await orderModel.create({ ...req.body, buyer: req.user._id });
    res.status(201).send({
      success: true,
      order,
      message: "Order Placed",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const orderGetController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products")
      .populate("cartItems")
      .populate("buyer")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While getting Order",
    });
  }
};

export const orderGetAllController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products")
      .populate("cartItems")
      .populate("buyer")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While getting Order",
    });
  }
};

export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};
