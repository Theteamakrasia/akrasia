-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'REVIEWED', 'REPLIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable contacts
CREATE TABLE "contacts" (
    "id"         TEXT          NOT NULL,
    "name"       TEXT          NOT NULL,
    "email"      TEXT          NOT NULL,
    "message"    TEXT          NOT NULL,
    "sourcePage" TEXT          NOT NULL DEFAULT 'contact',
    "ipHash"     TEXT,
    "userAgent"  TEXT,
    "status"     "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable orders
CREATE TABLE "orders" (
    "id"             TEXT           NOT NULL,
    "name"           TEXT           NOT NULL,
    "email"          TEXT           NOT NULL,
    "phone"          TEXT,
    "company"        TEXT,
    "service"        TEXT           NOT NULL,
    "projectType"    TEXT,
    "budget"         TEXT,
    "timeline"       TEXT,
    "goals"          TEXT           NOT NULL,
    "notes"          TEXT,
    "communication"  TEXT,
    "referralSource" TEXT,
    "sourcePage"     TEXT           NOT NULL DEFAULT 'start',
    "ipHash"         TEXT,
    "userAgent"      TEXT,
    "status"         "OrderStatus"  NOT NULL DEFAULT 'NEW',
    "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable logs
CREATE TABLE "logs" (
    "id"        TEXT         NOT NULL,
    "level"     "LogLevel"   NOT NULL DEFAULT 'INFO',
    "event"     TEXT         NOT NULL,
    "message"   TEXT,
    "ipHash"    TEXT,
    "orderId"   TEXT,
    "meta"      JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "contacts_email_idx"    ON "contacts"("email");
CREATE INDEX "contacts_createdAt_idx" ON "contacts"("createdAt");
CREATE INDEX "orders_email_idx"      ON "orders"("email");
CREATE INDEX "orders_status_idx"     ON "orders"("status");
CREATE INDEX "orders_createdAt_idx"  ON "orders"("createdAt");
CREATE INDEX "logs_level_idx"        ON "logs"("level");
CREATE INDEX "logs_event_idx"        ON "logs"("event");
CREATE INDEX "logs_createdAt_idx"    ON "logs"("createdAt");

-- Foreign key
ALTER TABLE "logs" ADD CONSTRAINT "logs_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
