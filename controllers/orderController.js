import orderModel from "../models/orderModel.js";

export const orderPostController = async (req, res) => {
  try {
    console.log(req.body);
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
