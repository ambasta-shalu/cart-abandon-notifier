const User = require("../models/user.model");
const AbandonedCheckout = require("../models/checkout.model");
const reminderController = require("./reminder.controller");

exports.checkoutAbandoned = async (req, res) => {
  try {
    const { customer, token } = req.body;
    const { email, first_name, last_name } = customer;

    // Finds or creates a User document based on the customer's email and updates their name.
    let user = await User.findOneAndUpdate(
      { email },
      { firstName: first_name, lastName: last_name },
      { upsert: true, new: true }
    );

    let isCheckoutTokenExists = await AbandonedCheckout.findOne({ token });
    if (isCheckoutTokenExists) {
      console.log(
        `${user.email} checkout token already exists. No message sent.`
      );
      return res
        .status(200)
        .json({ message: "Checkout Abandonment Recorded", token: token });
    }

    // Marks any previous abandoned checkouts as deleted, so they are not processed again.
    await AbandonedCheckout.updateMany(
      { userId: user._id, isDeleted: false },
      { isDeleted: true }
    );

    // Creates a new AbandonedCheckout document for the user.
    const abandonedCheckout = await AbandonedCheckout.create({
      userId: user._id,
      token: token,
    });

    // Schedules reminders for this abandoned checkout
    await reminderController.onNewAbandonedCheckout(abandonedCheckout);

    // Sends a success response back to the webhook sender.
    res
      .status(200)
      .json({ message: "Checkout Abandonment Recorded", token: token });
  } catch (error) {
    console.error("Error in checkout_abandoned webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.orderPlaced = async (req, res) => {
  try {
    const { email, token } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { hasPlacedOrder: true },
      { new: true }
    );

    await reminderController.completeOrderPlacement(user, token);

    // Sends a success response back to the webhook sender.
    res.status(200).json({ message: "Order Placement Recorded" });
  } catch (error) {
    console.error("Error in order_placed webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
