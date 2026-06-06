#!/usr/bin/env bash
# Deploy / redeploy the Mafia realtime relay to Deno Deploy (native WebSockets).
#
# Usage:
#   DENO_DEPLOY_TOKEN=<token> bash deno-deploy/deploy.sh
#
# Get a token at https://dash.deno.com/account#access-tokens (sign in with
# GitHub). The org/app are recorded in deno-deploy/deno.jsonc, so redeploys are
# a one-liner. Production URL: https://<app>.<org>.deno.net
#   -> set wss://<app>.<org>.deno.net as productionRelayUrl in scripts/config.js
set -euo pipefail

ORG="${DENO_ORG:-pycoder42}"
APP="${DENO_APP:-mafia-relay-pycoder42}"
DENO_BIN="${DENO_BIN:-$HOME/.deno/bin/deno}"
cd "$(dirname "$0")"

if [ -z "${DENO_DEPLOY_TOKEN:-}" ]; then
  echo "[deploy] Set DENO_DEPLOY_TOKEN (https://dash.deno.com/account#access-tokens)" >&2
  exit 1
fi

# First time? Create the app (idempotent-ish: if it already exists this errors,
# in which case just fall through to the plain deploy below).
if [ ! -f deno.jsonc ]; then
  "$DENO_BIN" deploy create \
    --token="$DENO_DEPLOY_TOKEN" --org="$ORG" --app="$APP" \
    --source=local --do-not-use-detected-build-config \
    --runtime-mode=dynamic --entrypoint=relay.ts --region=global \
    --ignore=deploy.sh . < /dev/null
else
  "$DENO_BIN" deploy --token="$DENO_DEPLOY_TOKEN" --prod --ignore=deploy.sh . < /dev/null
fi

echo ""
echo "[deploy] Production URL : https://$APP.$ORG.deno.net"
echo "[deploy] Relay (config) : wss://$APP.$ORG.deno.net"
