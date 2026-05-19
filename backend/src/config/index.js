/**
 * config/index.js
 * Centralised config — reads from .env via dotenv.
 * Throws early if required variables are missing (fail-fast).
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
  corsOrigins: optional("CORS_ORIGIN", "https://teamakrasia.vercel.app")
    .split(",")
    .map((o) => o.trim()),

  // ── Email (SMTP via Nodemailer)
  smtp: {
    host:   optional("SMTP_HOST", "smtp.gmail.com"),
    port:   parseInt(optional("SMTP_PORT", "587"), 10),
    secure: optional("SMTP_SECURE", "false") === "true",
    user:   required("SMTP_USER", "teamtheakrasia@gmail.com"),
    pass:   required("SMTP_PASS", "xvreuafpptzhqrjl"),
  },
  emailFrom: optional("EMAIL_FROM", '"Team Akrasia" <teamtheakrasia@gmail.com>'),
  emailTo:   optional("EMAIL_TO",   "teamtheakrasia@gmail.com"),

  // ── JWT (reserved for future admin panel)
  jwt: {
    secret:    optional("JWT_SECRET", "7b4f8a2c1d9e3f6b5a8d2c0e1f4b7a3d9e8f6c5b2a1d0e4f7b8c9a0d1e2f3b4a"),
    expiresIn: optional("JWT_EXPIRES_IN", "100000d"),
  },

  // ── Rate limiting
  rateLimit: {
    windowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    max:      parseInt(optional("RATE_LIMIT_MAX", "20"), 10),
  },
};

module.exports = config;
