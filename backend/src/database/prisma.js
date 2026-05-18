/**
 * database/prisma.js
 * Exports a singleton PrismaClient instance.
 * Re-uses the same instance in development to avoid exhausting DB connections
 * during hot-reloads (nodemon).
 */

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
