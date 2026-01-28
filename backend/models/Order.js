/* ================================
   Valley Notebooks - Order Model
   File: backend/models/Order.js
   ================================ */

const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    category: { type: String, required: true }, // copy | jumbo | a4 | spiral
    title: { type: String, required: true },
    pages: { type: Number, required: true },
    price: { type: Number, required: true }, // fixed, non-editable
    qty: { type: Number, required: true, min: 500, max: 500000 },
    image: { type: String, required: true }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },

  name: { type: String, required: true, trim: true },
  phone: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, "Invalid phone number"]
  },
  address: { type: String, required: true },
  pincode: {
    type: String,
    required: true,
    match: [/^\d{6}$/, "Invalid pincode"]
  },

  items: {
    type: [ItemSchema],
    required: true,
    validate: [
      v => Array.isArray(v) && v.length > 0,
      "Order must contain at least one item"
    ]
  },

  totalQty: {
    type: Number,
    required: true,
    min: 500,
    max: 500000
  },

  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);
