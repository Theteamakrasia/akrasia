#!/usr/bin/env bash
set -e
echo "🚀 Setting up the project..."
[ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env
[ ! -f backend/.env ]  && cp backend/.env.example backend/.env
echo "✅ Setup complete. Edit the .env files before running."
