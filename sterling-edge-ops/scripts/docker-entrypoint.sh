#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h "$(echo $DATABASE_URL | sed 's/.*@//' | cut -d: -f1)" -p "$(echo $DATABASE_URL | sed 's/.*://' | cut -d\/ -f1)" -U "$(echo $DATABASE_URL | sed 's/.*:\/\///' | cut -d: -f1)" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "Checking seed status..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(n => { console.log(n); p.\$disconnect(); }).catch(() => { console.log(0); p.\$disconnect(); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts
  echo "Seed complete."
else
  echo "Database already seeded ($USER_COUNT users found), skipping."
fi

echo "Starting application..."
exec npx next start -p 3000
