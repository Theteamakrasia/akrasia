/**
 * routes/contact.js
 * POST /api/contact
 */

const router                   = require("express").Router();
const { submitContact }        = require("../controllers/contactController");
const { formSubmitLimiter }    = require("../middlewares/security");
const { asyncHandler }         = require("../utils/helpers");

router.post("/", formSubmitLimiter, asyncHandler(submitContact));

module.exports = router;
