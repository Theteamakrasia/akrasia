/**
 * routes/index.js
 * Root API router — mounts all sub-routers.
 */

const router = require("express").Router();

router.use("/health",  require("./health"));
router.use("/contact", require("./contact"));
router.use("/orders",  require("./orders"));

module.exports = router;
