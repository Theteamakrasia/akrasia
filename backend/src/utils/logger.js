/**
 * utils/logger.js
 * Structured console logger.
 * In production you'd swap this for Winston/Pino + a log aggregator.
 * Never logs secrets, passwords, or full stack traces to clients.
 */

const isDev = process.env.NODE_ENV !== "production";

function format(level, message, meta) {
  const ts   = new Date().toISOString();
  const base = `[${ts}] [${level}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  debug: (msg, meta) => { if (isDev) console.debug(format("DEBUG", msg, meta)); },
  info:  (msg, meta) => console.info(format("INFO",  msg, meta)),
  warn:  (msg, meta) => console.warn(format("WARN",  msg, meta)),
  error: (msg, meta) => {
    // Scrub anything that looks like a stack trace in production
    const safeMeta = isDev ? meta : undefined;
    console.error(format("ERROR", msg, safeMeta));
  },
};

module.exports = logger;
