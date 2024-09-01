const User = require("../models/user.model");
const AbandonedCheckout = require("../models/checkout.model");
const reminderController = require("./reminder.controller");

exports.checkoutAbandoned = async (req, res) => {
  try {
    const { customer, token } = req.body;
    const { email, first_name, last_name } = customer;

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

    await AbandonedCheckout.updateMany(
      { userId: user._id, isDeleted: false },
      { isDeleted: true }
    );

    const abandonedCheckout = await AbandonedCheckout.create({
      userId: user._id,
      token: token,
    });

    await reminderController.onNewAbandonedCheckout(abandonedCheckout);

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
      { hasPlacedOrder: true }
    );

    await reminderController.completeOrderPlacement(user, token);

    res.status(200).json({ message: "Order Placement Recorded" });
  } catch (error) {
    console.error("Error in order_placed webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
