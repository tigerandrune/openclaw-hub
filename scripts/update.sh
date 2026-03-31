#!/bin/bash
# OpenClaw Hub — Update Script
set -e

echo "⬇️  Pulling latest changes..."
git pull --ff-only

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔨 Building..."
npm run build

# Restart PM2 if running
if command -v pm2 &>/dev/null && pm2 describe openclaw-hub &>/dev/null 2>&1; then
  echo "♻️  Restarting PM2..."
  pm2 restart openclaw-hub
fi

echo ""
echo "✅ OpenClaw Hub updated successfully!"
echo "   Your config (~/.openclaw/hub-config.json) was not touched."
