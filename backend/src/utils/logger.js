/**
 * utils/logger.js
 * Structured console logger.
 * Errors always log their message/code in production.
 * Only raw stack traces are stripped.
 */

const isDev = process.env.NODE_ENV !== "production";

function format(level, message, meta) {
  const ts   = new Date().toISOString();
  const base = `[${ts}] [${level}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

function sanitiseErrorMeta(meta) {
  if (!meta || typeof meta !== "object") return meta;
  // Keep message/code/status — strip raw stack traces
  const { stack, ...safe } = meta;
  return safe;
}

const logger = {
  debug: (msg, meta) => { if (isDev) console.debug(format("DEBUG", msg, meta)); },
  info:  (msg, meta) => console.info(format("INFO",  msg, meta)),
  warn:  (msg, meta) => console.warn(format("WARN",  msg, meta)),
  error: (msg, meta) => {
    // Always log the error metadata (message, code, etc.)
    // Only strip raw stack traces so logs stay readable without leaking internals
    const safeMeta = sanitiseErrorMeta(meta);
    console.error(format("ERROR", msg, safeMeta));
  },
};

module.exports = logger;