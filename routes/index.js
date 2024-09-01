const express = require("express");
const router = express.Router();

const webhookRoutes = require("./webhook.routes");

router.use(webhookRoutes);

module.exports = router;
