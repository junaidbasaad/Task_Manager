#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "============================================================"
  echo "FATAL: DATABASE_URL is not set."
  echo ""
  echo "Railway fix:"
  echo "  1. Project canvas → + New → Database → PostgreSQL"
  echo "  2. Open your API service → Variables → New Variable"
  echo "  3. Add Reference → select Postgres → DATABASE_URL"
  echo "  4. Redeploy"
  echo "============================================================"
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting API on port ${PORT:-4000}..."
exec node src/server.js
