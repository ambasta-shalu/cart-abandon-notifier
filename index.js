// Environment Configuration and Library Imports

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./config/db");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/webhook", routes);

mongoose
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

app.listen(PORT, () => {
  console.log(`Go catch the server at PORT ${PORT}`);
});
