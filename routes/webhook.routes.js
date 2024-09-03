const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

// POST endpoint to handle webhook notifications for abandoned checkouts.
router.post("/checkout_abandoned", webhookController.checkoutAbandoned);

// Defines a POST endpoint to handle webhook notifications for order placements.
router.post("/order_placed", webhookController.orderPlaced);

module.exports = router;
