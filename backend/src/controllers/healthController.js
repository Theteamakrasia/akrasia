/**
 * controllers/healthController.js
 * GET /api/health — returns server + DB status.
 * Used by Docker, Railway, Render, and uptime monitors.
 */

const prisma = require("../database/prisma");
const logger = require("../utils/logger");

async function healthCheck(req, res) {
  let dbStatus = "ok";

  try {
    // Lightweight query to verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    logger.error("Health check DB ping failed", { message: err.message });
  }

  const status = dbStatus === "ok" ? 200 : 503;

  return res.status(status).json({
    status:    dbStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      api:      "ok",
    },
    version: process.env.npm_package_version || "1.0.0",
  });
}

module.exports = { healthCheck };
