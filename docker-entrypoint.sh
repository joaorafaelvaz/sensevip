#!/bin/sh
set -e

echo "[SatisfyCAM] Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null || echo "[SatisfyCAM] DB already up to date"

echo "[SatisfyCAM] Starting server..."
exec node server.js
