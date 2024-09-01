const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  hasPlacedOrder: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
