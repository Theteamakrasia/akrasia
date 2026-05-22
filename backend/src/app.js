/**
 * app.js
 * Akrasia Backend — Express application bootstrap.
 *
 * Start:  node src/app.js
 * Dev:    nodemon src/app.js
 */

require("dotenv").config();

const express       = require("express");
const compression   = require("compression");
const config        = require("./config");           // validates required env vars
const apiRoutes     = require("./routes");
const requestLogger = require("./middlewares/requestLogger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const { helmetMiddleware, corsMiddleware, globalLimiter } = require("./middlewares/security");
const logger        = require("./utils/logger");
const prisma        = require("./database/prisma");

const app = express();

// ── Trust proxy (needed for correct IP behind Nginx / Railway / Render) ──
app.set("trust proxy", 1);

// ── Security headers first ────────────────────────────────────
app.use(helmetMiddleware);

// ── CORS ──────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "20kb" }));          // reject oversized payloads
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// ── Request logging ───────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limiter ───────────────────────────────────────
app.use("/api", globalLimiter);

// ── API routes ────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`Received ${signal} — shutting down gracefully…`);
  try { await prisma.$disconnect(); } catch { /* ignore */ }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// Catch unhandled rejections so the process doesn't crash silently
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

// ── Start server ──────────────────────────────────────────────
const PORT = parseInt(config.port, 10);

app.listen(PORT, () => {
  logger.info(`Akrasia API running`, {
    port:    PORT,
    env:     config.nodeEnv,
    origins: config.corsOrigins,
  });
});

module.exports = app; // for testing
