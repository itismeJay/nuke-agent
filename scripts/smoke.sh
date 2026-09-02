#!/usr/bin/env bash
#
# Post-deploy smoke test. Read-only. Hits a handful of routes on a freshly
# deployed URL and fails if any of them doesn't answer as expected.
#
#   Usage: scripts/smoke.sh https://nook-xyz.vercel.app
#
# Deliberately shallow: this proves "the deployment is serving", not "the
# product is correct". No auth, no writes, nothing destructive.

set -euo pipefail

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "smoke: no URL given" >&2
  exit 2
fi
BASE_URL="${BASE_URL%/}"

RETRIES=5
SLEEP=6

# route|expected_status
CHECKS=(
  "/|200"
  "/sign-in|200"
  "/api/health|200"
)

fail=0

for check in "${CHECKS[@]}"; do
  path="${check%%|*}"
  want="${check##*|}"
  got=""
  for ((i = 1; i <= RETRIES; i++)); do
    got=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${BASE_URL}${path}" || echo "000")
    [[ "$got" == "$want" ]] && break
    echo "smoke: ${path} -> ${got} (want ${want}), retry ${i}/${RETRIES}"
    sleep "$SLEEP"
  done
  if [[ "$got" == "$want" ]]; then
    echo "smoke: OK   ${path} -> ${got}"
  else
    echo "smoke: FAIL ${path} -> ${got} (want ${want})" >&2
    fail=1
  fi
done

# Health endpoint must return valid JSON with status "ok".
health_body=$(curl -s --max-time 15 "${BASE_URL}/api/health" || echo "")
if ! echo "$health_body" | grep -q '"status":"ok"'; then
  echo "smoke: FAIL /api/health body missing status:ok -> ${health_body}" >&2
  fail=1
else
  echo "smoke: OK   /api/health body has status:ok"
fi

exit "$fail"
