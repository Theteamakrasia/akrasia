/**
 * routes/health.js
 * GET /api/health
 */

const router            = require("express").Router();
const { healthCheck }   = require("../controllers/healthController");
const { asyncHandler }  = require("../utils/helpers");

router.get("/", asyncHandler(healthCheck));

module.exports = router;
