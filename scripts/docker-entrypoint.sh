#!/bin/sh
set -e

PRISMA_BIN="node ./node_modules/prisma/build/index.js"

echo "▶ Applying database schema..."
if [ -d "./prisma/migrations" ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  $PRISMA_BIN migrate deploy
else
  $PRISMA_BIN db push --skip-generate
fi

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
  echo "▶ Running seed script..."
  node prisma/seed.mjs || echo "⚠ Seed failed (continuing)."
fi

echo "▶ Starting Next.js server..."
exec node server.js
