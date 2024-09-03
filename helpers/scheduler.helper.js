const schedule = require("node-schedule");
const AbandonedCheckout = require("../models/checkout.model");
const User = require("../models/user.model");

const userScheduledJobs = new Map();

async function sendMessage(checkout, message, isLast) {
  try {
    const user = await User.findById(checkout.userId);
    if (!user.hasPlacedOrder) {
      // TODO: Integrate with an email/SMS service to send the message
      console.log(`Sending message to ${user.email} : ${message} has lapsed`);
      if (isLast) {
        console.log(`Is Last  ${user.email} : ${isLast}`);
      }
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
    { delay: 30 * 60 * 1000, message: "T + 30 min", isLast: false }, // 30 minutes
    { delay: 24 * 60 * 60 * 1000, message: "T + 1 day", isLast: false }, // 1 day
    { delay: 3 * 24 * 60 * 60 * 1000, message: "T + 3 days", isLast: true }, // 3 days
  ];

  const jobs = [];

  for (const { delay, message, isLast } of scheduleTimes) {
    const sendTime = new Date(checkout.abandonedAt.getTime() + delay);

    if (sendTime > new Date()) {
      const job = schedule.scheduleJob(sendTime, async function () {
        try {
          const updatedCheckout = await AbandonedCheckout.findById(
            checkout._id
          );
          if (
            !updatedCheckout ||
            updatedCheckout.recoveryComplete ||
            updatedCheckout.isDeleted
          ) {
            console.log("Already placed an order");
            return;
          }

          if (!updatedCheckout.messagesSent.includes(message)) {
            await sendMessage(updatedCheckout, message, isLast);

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

      jobs.push(job);
    }
  }

  // Stores the scheduled jobs for the user to manage or cancel them later.
  userScheduledJobs.set(checkout.userId.toString(), jobs);
}

function cancelScheduledJobs(userId) {
  if (userScheduledJobs.has(userId.toString())) {
    const jobs = userScheduledJobs.get(userId.toString());
    jobs.forEach((job) => job.cancel());
    userScheduledJobs.delete(userId.toString());
    console.log(`Cancelled schedules for user with ID: ${userId}`);
  }
}

module.exports = { scheduleReminders, cancelScheduledJobs };
