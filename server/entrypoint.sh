#!/bin/sh
set -e

# Touch .env so Deno's --env flag doesn't error if no file is present.
# Actual values are injected by Docker via environment variables.
touch .env

echo "⏳ Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting Deno server..."
exec deno task start
