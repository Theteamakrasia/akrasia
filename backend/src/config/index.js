/**
 * config/index.js
 * Centralised config — reads from .env via dotenv.
 * Throws early if required variables are missing (fail-fast).
 */

/*
  * Does not work with resend api or other api
*/

require("dotenv").config();

function required(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optional(key, defaultVal = undefined) {
  return process.env[key] || defaultVal;
}

const config = {
  // ── Server
  port:    optional("PORT", "8000"),
  nodeEnv: optional("NODE_ENV", "development"),

  // ── Database (consumed by Prisma, validated here for fail-fast)
  databaseUrl: required("DATABASE_URL"),

  // ── CORS: comma-separated allowed origins
  corsOrigins: optional("CORS_ORIGIN", "http://localhost:5500")
    .split(",")
    .map((o) => o.trim()),

  // ── Email (Resend API)
  resendApiKey: required("RESEND_API_KEY"),
  emailFrom:    optional("EMAIL_FROM",    "Akrasia <onboarding@resend.dev>"),
  emailTo:      optional("EMAIL_TO",      "teamtheakrasia@gmail.com"),

  // ── JWT (reserved for future admin panel)
  jwt: {
    secret:    optional("JWT_SECRET", "change_this_in_production"),
    expiresIn: optional("JWT_EXPIRES_IN", "7d"),
  },

  // ── Rate limiting
  rateLimit: {
    windowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    max:      parseInt(optional("RATE_LIMIT_MAX", "20"), 10),
  },
};

module.exports = config;
