import orderModel from "../models/orderModel.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import dotenv from "dotenv";
import fs from "fs";
import productModel from "../models/productModel.js";
import pdfkit from "pdfkit";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import axios from "axios";
import easyinvoice from "easyinvoice";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagePath = path.join(__dirname, '../assets/stick.png');

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const generateInvoice = async (orderData) => {
  try {
    return new Promise(async (resolve, reject) => {
      const doc = new pdfkit();

      // // Load logo image
      // const logoUrl = "https://divinecoorgcoffee.co.in/logo.png"; // Replace with your logo URL
      // const logoResponse = await axios.get(logoUrl, {
      //   responseType: "arraybuffer",
      // });
      // fs.writeFileSync("logo.png", logoResponse.data);

      // // Add logo image to the PDF document
      // const logoPath = "logo.png";
      // // Header style from generateHeader
      doc
        .image(imagePath, 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(10)
        .text("Divine Coorg Coffee.", 200, 50, { align: "right" })
        .text("Bangalore", 200, 65, { align: "right" })
        .text("Karnataka, INDIA, 560098", 200, 80, { align: "right" })
        .moveDown();

      // Custom information from generateCustomerInformation
      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Invoice", 50, 120)
        .text("Shipping Details", 300, 120, { width: 200, align: "right" })
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, 150)
        .lineTo(550, 150)
        .stroke();

      const customerInformationTop = 160;

      // Left side: Order ID and Date
      doc
        .fontSize(10)
        .text("Order ID:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(orderData.paymentDetails.orderId, 150, customerInformationTop)
        .font("Helvetica")
        .text("Date:", 50, customerInformationTop + 15)
        .text(new Date().toLocaleDateString(), 150, customerInformationTop + 15)
        .text("Payment Mode:", 50, customerInformationTop + 30)
        .font("Helvetica-Bold")
        .text(
          orderData.paymentDetails.paymentMethod,
          150,
          customerInformationTop + 30
        );

      function calculateTextHeight(doc, text, options = {}) {
        return doc.heightOfString(text, options);
      }

      // Right side: Shipping Address
      let shippingPosition = customerInformationTop;
      const leadingValue = 20; // Adjust to your preferred line spacing

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(orderData.shippingDetails.name, 300, shippingPosition, {
          align: "right",
        });

      // Add the phone number after the name
      const phoneNumber = `+91 ${orderData.shippingDetails.phone}`;
      const phoneHeight = calculateTextHeight(doc, phoneNumber, {
        leading: leadingValue,
      });
      doc.text(phoneNumber, 300, shippingPosition + 15, {
        leading: leadingValue,
        align: "right",
      });

      // Adjust the position for the address
      const address = orderData.shippingDetails.address;
      const addressHeight = calculateTextHeight(doc, address, {
        leading: leadingValue,
      });
      doc
        .font("Helvetica")
        .text(address, 300, shippingPosition + 15 + phoneHeight, {
          align: "right",
        });

      // Adjust the position for the city
      const city = `${orderData.shippingDetails.city}, ${orderData.shippingDetails.state}, ${orderData.shippingDetails.pincode}`;
      const cityHeight = calculateTextHeight(doc, city, {
        leading: leadingValue,
      });
      doc.text(city, 300, shippingPosition + 15 + phoneHeight + addressHeight, {
        leading: leadingValue,
        align: "right",
      });

      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, 240)
        .lineTo(550, 240)
        .stroke();

      // Cart Items with styling from generateInvoiceTable
      const invoiceTableTop = 280;
      doc.font("Helvetica-Bold");
      doc
        .fontSize(10)
        .text("No.", 50, invoiceTableTop)
        .text("Name", 100, invoiceTableTop)
        .text("Quantity", 250, invoiceTableTop)
        .text("Price", 350, invoiceTableTop)
        .text("Discount", 425, invoiceTableTop)
        .text("Total", 475, invoiceTableTop, { align: "right" });
      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, invoiceTableTop + 20)
        .lineTo(550, invoiceTableTop + 20)
        .stroke();
      doc.font("Helvetica");

      let yPos = invoiceTableTop + 30;
      let itemNo = 1; // Initialize item number
      orderData.cartItems.forEach((item) => {
        doc
          .fontSize(10)
          .text(itemNo.toString(), 50, yPos, { width: 90, align: "left" }) // Add the item number here
          .text(item.name, 100, yPos)
          .text(item.quantity.toString(), 250, yPos, {
            width: 90,
            align: "left",
          })
          .text(`Rs.${item.price.toFixed(2)}`, 350, yPos, {
            width: 90,
            align: "left",
          })
          .text(`0%`, 425, yPos, {
            width: 90,
            align: "left",
          })
          .text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 475, yPos, {
            align: "right",
          });
        yPos += 30;
        itemNo++; // Increment the item number for the next iteration
      });
      let totalAmount = orderData.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let couponDiscount = orderData.coupounDetails
        ? totalAmount * (orderData.coupounDetails.discount / 100)
        : 0;
      let subtotal = totalAmount + orderData.shippingCharge - couponDiscount;

      // ... [items loop code here as before]

      // Now, after looping through all items, add the total, coupon discount, and subtotal to the bottom
      const bottomPosition = yPos + 10; // Adjust as necessary

      doc
        .font("Helvetica-Bold")
        .text("Total:", 400, bottomPosition)
        .text(`Rs.${totalAmount.toFixed(2)}`, 475, bottomPosition, {
          align: "right",
        });

      // Only display the coupon discount if it's available
      if (couponDiscount > 0) {
        doc
          .text("Coupon:", 400, bottomPosition + 20)
          .text(
            `- ${orderData.coupounDetails.discount} % on Total`,
            450,
            bottomPosition + 20,
            { align: "right" }
          );
      }
      doc
        .text("Shipping:", 400, bottomPosition + 40)
        .text(
          `+ Rs.${orderData.shippingCharge.toFixed(2)}`,
          475,
          bottomPosition + 40,
          { align: "right" }
        );

      doc
        .text("Subtotal:", 400, bottomPosition + 60)
        .text(`Rs.${subtotal.toFixed(2)}`, 475, bottomPosition + 60, {
          align: "right",
        });

      // Footer from generateFooter
      doc.fontSize(10).text("Thank you for your Purchase!", 50, 600, {
        align: "center",
        width: 500,
      });

      // Save the PDF document to the specified file path
      const buffers = [];
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);
        const name = orderData.paymentDetails.orderId;
        const uploadParams = {
          Bucket: process.env.BUCKET_NAME,
          Key: `invoices/${name}.pdf`, // Use a proper file path within your bucket
          Body: pdfBuffer,
          ContentType: "application/pdf",
        };
        const command = new PutObjectCommand(uploadParams);
        const data = await s3.send(command);
        const pdfUrl = `https://d26jxww88dzshe.cloudfront.net/invoices/${name}.pdf`;

        resolve(pdfUrl); // Resolve the promise with the PDF URL
      });

      doc.end();
    });
  } catch (error) {
    console.error(error);
    throw new Error("Error generating and uploading invoice");
  }
};

export const sendConfirmationEmail = async (req, res) => {
  try {
    const {
      email,
      name,
      orderId,
      transactionId,
      paymentMethod,
      cartItems,
      subTotal,
    } = req.body;
    const order = await orderModel.findOne({ "paymentDetails.orderId": orderId });
    let invoice = order.invoiceUrl;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
      },
    });
    const shippingCharge = paymentMethod === "cod" ? 50 : "";
    const shippingMessage =
      paymentMethod === "cod"
        ? `Shipping charges: ${shippingCharge}`
        : "Free Shipping";
    const simplifiedCartItems = cartItems.map(({ name, price, quantity }) => ({
      name,
      price,
      quantity,
    }));
    if (paymentMethod === "cod") {
      simplifiedCartItems.push({
        name: "Shipping Charges",
        price: shippingCharge,
        quantity: 1,
      });
    }
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
        action: {
          // The action button to download the invoice
          instructions: "To view your invoice, please click the button below:",
          button: {
            color: "blue", // or any other color
            text: "Download Invoice",
            link: invoice, // the invoice URL
          },
        },
        outro: `The total price is ${subTotal}.\n\n${shippingMessage}\n\nYour Transaction ID / Payment Method: "${transactionId}" for Reference.\n\nThank you for your purchase!`,
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
  console.log(req.body);
  try {
    const { cartItems } = req.body;
    const order = await orderModel.create({ ...req.body, buyer: req.user.id });
    const pdfUrl = await generateInvoice(req.body);
    let update = cartItems.map((item) => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $inc: { stock: -item.quantity, sold: +item.quantity } },
        },
      };
    });
    const updated = await productModel.bulkWrite(update, {});
    order.invoiceUrl = pdfUrl;
    await order.save();
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
      .find({ buyer: req.user.id })
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

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await orderModel.findOne({ "paymentDetails.orderId" : orderId});
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
