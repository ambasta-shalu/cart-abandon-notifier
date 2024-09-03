const AbandonedCheckout = require("../models/checkout.model");
const scheduler = require("../helpers/scheduler.helper");

exports.onNewAbandonedCheckout = async (checkout) => {
  await scheduler.scheduleReminders(checkout);
};

exports.completeOrderPlacement = async (user, token) => {
  if (token) {
    await AbandonedCheckout.findOneAndUpdate(
      { token: token },
      { recoveryComplete: true }
    );
  }
  // else {
  //   await AbandonedCheckout.updateMany(
  //     { userId: user._id, recoveryComplete: false },
  //     { recoveryComplete: true }
  //   );
  // }

  scheduler.cancelScheduledJobs(user._id);
};
