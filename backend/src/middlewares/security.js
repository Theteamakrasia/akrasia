/**
 * middlewares/security.js
 * All security middleware in one place.
 *
 * Applied in app.js before any routes.
 */

const helmet      = require("helmet");
const cors        = require("cors");
const rateLimit   = require("express-rate-limit");
const config      = require("../config");
const logger      = require("../utils/logger");

// ── Helmet — sets secure HTTP headers ────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Frontend is served separately (Vercel)
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ── CORS ─────────────────────────────────────────────────────
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes(origin) || config.nodeEnv === "development") {
      callback(null, true);
    } else {
      logger.warn("CORS blocked", { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods:          ["GET", "POST", "OPTIONS"],
  allowedHeaders:   ["Content-Type", "Authorization"],
  credentials:      true,
  optionsSuccessStatus: 200,
});

// ── Global rate limiter — applied to all /api/* routes ────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,       // default: 15 minutes
  max:      config.rateLimit.max,            // default: 20 requests per window
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests — please wait a few minutes and try again.",
  },
  handler: (req, res, next, options) => {
    logger.warn("RATE_LIMIT_HIT", {
      ip:   req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      path: req.path,
    });
    res.status(options.statusCode).json(options.message);
  },
});

// ── Strict limiter for form submission endpoints ───────────────
// 5 submissions per 15 minutes per IP — prevents spam bursts
const formSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "You have submitted too many times. Please wait 15 minutes.",
  },
  handler: (req, res, next, options) => {
    logger.warn("FORM_RATE_LIMIT_HIT", {
      ip:   req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      path: req.path,
    });
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  globalLimiter,
  formSubmitLimiter,
};
