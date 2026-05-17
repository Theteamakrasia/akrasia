/**
 * middlewares/requestLogger.js
 * Logs every incoming request for observability.
 * Scrubs sensitive fields so credentials never appear in logs.
 */

const logger = require("../utils/logger");

const SENSITIVE_FIELDS = ["password", "pass", "secret", "token", "authorization"];

function scrub(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE_FIELDS.includes(k.toLowerCase()) ? [k, "[REDACTED]"] : [k, v]
    )
  );
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, path, query } = req;

  res.on("finish", () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const level  = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    logger[level](`${method} ${path}`, {
      status,
      ms,
      query: Object.keys(query).length ? scrub(query) : undefined,
    });
  });

  next();
}

module.exports = requestLogger;
