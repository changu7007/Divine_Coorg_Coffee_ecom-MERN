import orderModel from "../models/orderModel.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import dotenv from "dotenv";
dotenv.config();

export const orderBill = async (req, res) => {
  try {
    const { orderId, product, quantity, price, email } = req.body;
    let fromMail = process.env.MAIL;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromMail,
        pass: process.env.PASS,
      },
    });

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Mailgen",
        link: "https://mailgen.js/",
      },
    });

    let response = {
      body: {
        name: "Divine Coorg Coffee",
        intro: "We Have Recieved Your Order-Thank You For shopping!",
        table: {
          data: [
            {
              orderId: orderId,
              product: product,
              quantity: quantity,
              price: price,
            },
          ],
        },
        outro:
          "We will update our shipping once when shipped you can see your status in your orders",
      },
    };
    let mail = MailGenerator.generate(response);

    let message = {
      from: fromMail,
      to: email,
      subject: "Bulk Order Request",
      html: mail,
    };
    transporter.sendMail(message);
    return res.status(201).json({
      msg: "Order request Sent Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
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
