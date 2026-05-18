# ── Akrasia Backend Dockerfile ──────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install deps separately to leverage Docker layer cache
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY backend/src ./src
COPY backend/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

EXPOSE 8000

# Healthcheck for Docker / Railway / Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node src/app.js"]
