/**
 * api/_lib/helpers.js
 * Shared utilities: IP hashing, honeypot check, rate limiting.
 */

const crypto = require('crypto');

// ── IP Hashing ────────────────────────────────────────────────
function hashIp(ip) {
  if (!ip) return null;
  return crypto
    .createHash('sha256')
    .update(ip + 'akrasia-salt')
    .digest('hex');
}

// ── Client IP ─────────────────────────────────────────────────
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    null
  );
}

// ── Honeypot ──────────────────────────────────────────────────
function isHoneypotFilled(body) {
  return typeof body.honeypot === 'string' && body.honeypot.trim() !== '';
}

// ── In-memory rate limiter ────────────────────────────────────
// Simple Map-based limiter: 5 form submissions per IP per 15 minutes.
// Resets on cold starts — good enough protection for a small portfolio site.
const _store = new Map();
const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
const MAX_HITS   = 5;

function isRateLimited(ip) {
  if (!ip) return false;

  const now    = Date.now();
  const record = _store.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };

  // Slide the window if it has expired
  if (now > record.resetAt) {
    record.count   = 0;
    record.resetAt = now + WINDOW_MS;
  }

  record.count++;
  _store.set(ip, record);

  return record.count > MAX_HITS;
}

module.exports = { hashIp, getClientIp, isHoneypotFilled, isRateLimited };