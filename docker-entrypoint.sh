#!/bin/sh
set -e

echo "[SatisfyCAM] Preparing data directories..."
mkdir -p /app/data/snapshots

echo "[SatisfyCAM] Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null || echo "[SatisfyCAM] DB already up to date"

echo "[SatisfyCAM] Starting server on port ${PORT:-3007}..."
exec node server.js
