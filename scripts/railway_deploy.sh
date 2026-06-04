#!/usr/bin/env bash
set -euo pipefail

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI mangler. Installer den med:"
  echo "npm install -g @railway/cli"
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Du er ikke logget inn i Railway. Kjor:"
  echo "railway login"
  exit 1
fi

if [[ -z "${SESSION_SECRET:-}" ]]; then
  echo "SESSION_SECRET mangler i miljoet."
  echo "Eksempel:"
  echo 'export SESSION_SECRET="$(openssl rand -base64 32)"'
  exit 1
fi

echo "Setter Railway-variabler..."
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=file:/data/dev.db
railway variables set SESSION_SECRET="$SESSION_SECRET"

echo "Pusher lokal kode til Railway..."
railway up

echo "Hvis dette er forste deploy, legg til et Volume i Railway UI med mount path /data."
echo "Etter forste deploy kan du eventuelt seed'e data med:"
echo "railway run pnpm db:seed"
