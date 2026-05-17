/**
 * routes/orders.js
 * POST /api/orders
 */

const router                = require("express").Router();
const { submitOrder }       = require("../controllers/orderController");
const { formSubmitLimiter } = require("../middlewares/security");
const { asyncHandler }      = require("../utils/helpers");

router.post("/", formSubmitLimiter, asyncHandler(submitOrder));

module.exports = router;
