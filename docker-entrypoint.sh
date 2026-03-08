#!/bin/sh
set -e

PRISMA="node node_modules/prisma/build/index.js"

echo "[SatisfyCAM] Preparing data directories..."
mkdir -p /app/data/snapshots

echo "[SatisfyCAM] DATABASE_URL=$DATABASE_URL"

echo "[SatisfyCAM] Running database migrations..."
if $PRISMA migrate deploy --schema=./prisma/schema.prisma 2>&1; then
  echo "[SatisfyCAM] Migrations applied successfully"
else
  echo "[SatisfyCAM] migrate deploy failed, trying db push..."
  $PRISMA db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1
  echo "[SatisfyCAM] db push completed"
fi

echo "[SatisfyCAM] Starting server on port ${PORT:-3007}..."
exec node server.js
