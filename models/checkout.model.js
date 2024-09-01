const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  abandonedAt: { type: Date, default: Date.now },
  messagesSent: { type: [String], default: [] },
  recoveryComplete: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  token: { type: String, required: true },
});

module.exports = mongoose.model("AbandonedCheckout", checkoutSchema);
