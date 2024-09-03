const mongoose = require("mongoose");

// Connects to a MongoDB database using a connection string
module.exports = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
