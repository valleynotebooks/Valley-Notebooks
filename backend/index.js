/* ================================
   Valley Notebooks - Backend
   index.js (Node.js + Express)
   Vercel Serverless Compatible
   ================================ */

const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const fetch = require("node-fetch");

const app = express();

/* ----------------
   ENV REQUIRED
-------------------
MONGODB_URI=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
------------------- */

app.use(express.json({ limit: "1mb" }));

/* ----------------
   Rate Limiting
------------------- */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try later." }
});
app.use("/api/order", orderLimiter);

/* ----------------
   MongoDB Connect
------------------- */
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/* ----------------
   Order Schema
------------------- */
const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  name: String,
  phone: String,
  address: String,
  pincode: String,
  items: Array,
  totalQty: Number,
  totalAmount: Number,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

/* ----------------
   Helpers
------------------- */
function generateOrderId() {
  return "VN" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function notifyTelegram(order) {
  const msg = `
🧾 *New Order Received*
Order ID: ${order.orderId}
Name: ${order.name}
Phone: ${order.phone}
Qty: ${order.totalQty}
Amount: ₹${order.totalAmount}
  `;
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: "Markdown"
    })
  });
}

/* ----------------
   Create Order
------------------- */
app.post("/api/order", async (req, res) => {
  try {
    await connectDB();

    const { name, phone, address, pincode, items } = req.body;

    if (!name || !phone || !address || !pincode || !items?.length) {
      return res.status(400).json({ error: "Invalid data" });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone" });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: "Invalid pincode" });
    }

    const totalQty = items.reduce((a, c) => a + c.qty, 0);
    const totalAmount = items.reduce((a, c) => a + c.qty * c.price, 0);

    if (totalQty < 500 || totalQty > 500000) {
      return res.status(400).json({ error: "Quantity limit violation" });
    }

    const orderId = generateOrderId();

    const exists = await Order.findOne({ phone, totalAmount });
    if (exists) {
      return res.status(409).json({ error: "Duplicate order detected" });
    }

    const order = await Order.create({
      orderId,
      name,
      phone,
      address,
      pincode,
      items,
      totalQty,
      totalAmount
    });

    await notifyTelegram(order);

    res.json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------
   Admin APIs
------------------- */
app.get("/api/admin/orders", async (req, res) => {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.put("/api/admin/order/:id", async (req, res) => {
  await connectDB();
  await Order.updateOne(
    { orderId: req.params.id },
    { status: req.body.status }
  );
  res.json({ success: true });
});

/* ----------------
   Export
------------------- */
module.exports = app;
