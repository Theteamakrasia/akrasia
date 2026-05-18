/**
 * utils/helpers.js
 * Small utility helpers used across the backend.
 */

const crypto = require("crypto");

/**
 * hashIp(ip)
 * One-way SHA-256 hash of an IP address for GDPR-friendly storage.
 * We don't need to reverse it — only to detect repeated submissions.
 */
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip + "akrasia-salt").digest("hex");
}

/**
 * asyncHandler(fn)
 * Wraps an async Express route handler so unhandled promise rejections
 * are forwarded to next(err) instead of crashing the process.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * getClientIp(req)
 * Returns the real client IP, respecting common proxy headers.
 */
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    null
  );
}

/**
 * isHoneypotFilled(body)
 * Returns true if the bot-trap honeypot field has content.
 */
function isHoneypotFilled(body) {
  return typeof body.honeypot === "string" && body.honeypot.trim() !== "";
}

module.exports = { hashIp, asyncHandler, getClientIp, isHoneypotFilled };
