#!/bin/sh
set -e

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  npx prisma migrate deploy
fi

if [ "$SKIP_SEED" != "true" ]; then
  npm run seed
fi

exec npm start
