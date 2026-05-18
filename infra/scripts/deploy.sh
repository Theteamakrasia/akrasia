#!/usr/bin/env bash
set -e
echo "📦 Deploying to production..."
docker compose -f docker-compose.yml up -d --build
echo "✅ Done."
