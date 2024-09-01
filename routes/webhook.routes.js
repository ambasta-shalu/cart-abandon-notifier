const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

router.post("/checkout_abandoned", webhookController.checkoutAbandoned);
router.post("/order_placed", webhookController.orderPlaced);

module.exports = router;
