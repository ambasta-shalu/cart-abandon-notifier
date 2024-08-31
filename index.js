require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const schedule = require("node-schedule");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    scheduleRemindersForExistingCheckouts();
  })
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Schemas and Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  shopifyCustomerId: String,
  hasPlacedOrder: { type: Boolean, default: false },
});

const checkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  abandonedAt: { type: Date, default: Date.now },
  messagesSent: { type: [String], default: [] },
  recoveryComplete: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  token: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", userSchema);
const AbandonedCheckout = mongoose.model("AbandonedCheckout", checkoutSchema);

// Webhooks
app.post("/webhook/checkout_abandoned", async (req, res) => {
  try {
    const { customer, token } = req.body;
    const { email, first_name, last_name, id: shopifyCustomerId } = customer;

    let user = await User.findOneAndUpdate(
      { email },
      { firstName: first_name, lastName: last_name, shopifyCustomerId },
      { upsert: true, new: true }
    );

    const abandonedCheckout = await AbandonedCheckout.create({
      userId: user._id,
      token: token,
    });
    await onNewAbandonedCheckout(abandonedCheckout);

    res
      .status(200)
      .json({ message: "Checkout Abandonment Recorded", token: token });
  } catch (error) {
    console.error("Error in checkout_abandoned webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/webhook/order_placed", async (req, res) => {
  try {
    const { email, token } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { hasPlacedOrder: true }
    );

    if (token) {
      // If a token is provided, update the specific abandoned checkout
      await AbandonedCheckout.findOneAndUpdate(
        { token: token },
        { recoveryComplete: true }
      );
    } else {
      // If no token is provided, update all abandoned checkouts for the user
      await AbandonedCheckout.updateMany(
        { userId: user._id, recoveryComplete: false },
        { recoveryComplete: true }
      );
    }

    res.status(200).send("Order Placement Recorded");
  } catch (error) {
    console.error("Error in order_placed webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper functions
async function sendMessage(checkout, message) {
  try {
    const user = await User.findById(checkout.userId);
    if (!user.hasPlacedOrder) {
      // TODO: Integrate with an email/SMS service to send the message
      console.log(`Sending message to ${user.email}: ${message}`);
      console.log(`Recovery token: ${checkout.token}`);
      await AbandonedCheckout.findByIdAndUpdate(checkout._id, {
        $push: { messagesSent: message },
      });
    } else {
      console.log(
        `User ${user.email} already placed an order. No message sent.`
      );
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function scheduleReminders(checkout) {
  const scheduleTimes = [
    { delay: 5 * 1000, message: "T + 5 sec", isLast: false },
    { delay: 10 * 1000, message: "T + 10 sec", isLast: false },
    { delay: 30 * 1000, message: "T + 30 sec", isLast: true },
  ];

  for (const { delay, message, isLast } of scheduleTimes) {
    const sendTime = new Date(checkout.abandonedAt.getTime() + delay);

    if (sendTime > new Date()) {
      schedule.scheduleJob(sendTime, async function () {
        try {
          const updatedCheckout = await AbandonedCheckout.findById(
            checkout._id
          );
          if (
            !updatedCheckout ||
            updatedCheckout.recoveryComplete ||
            updatedCheckout.isDeleted
          ) {
            return;
          }

          if (!updatedCheckout.messagesSent.includes(message)) {
            await sendMessage(updatedCheckout, message);

            if (isLast) {
              await AbandonedCheckout.findByIdAndUpdate(checkout._id, {
                $push: { messagesSent: message },
                isDeleted: true,
              });
            } else {
              await AbandonedCheckout.findByIdAndUpdate(checkout._id, {
                $push: { messagesSent: message },
              });
            }
          }
        } catch (error) {
          console.error("Error in scheduled job:", error);
        }
      });
    }
  }
}

async function onNewAbandonedCheckout(checkout) {
  await scheduleReminders(checkout);
}

async function scheduleRemindersForExistingCheckouts() {
  try {
    const abandonedCheckouts = await AbandonedCheckout.find({
      recoveryComplete: false,
      isDeleted: false,
    });

    for (const checkout of abandonedCheckouts) {
      await scheduleReminders(checkout);
    }
  } catch (error) {
    console.error("Error scheduling reminders for existing checkouts:", error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Go catch the server at PORT ${PORT}`);
});
