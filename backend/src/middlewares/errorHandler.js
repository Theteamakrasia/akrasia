/**
 * middlewares/errorHandler.js
 * Centralised Express error handler.
 * NEVER exposes stack traces or internal details to clients in production.
 */

const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  // Log the full error internally
  logger.error(err.message || "Unhandled error", {
    stack:  process.env.NODE_ENV === "development" ? err.stack : undefined,
    path:   req.path,
    method: req.method,
  });

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS policy violation." });
  }

  const status  = err.status || err.statusCode || 500;

  // In production, never reveal internal error details
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An internal server error occurred. Please try again later."
      : err.message || "Internal Server Error";

  return res.status(status).json({ success: false, message });
}

// Catch unhandled 404s (route not found)
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

module.exports = { errorHandler, notFoundHandler };
