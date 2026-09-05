#!/usr/bin/env bash
# Anonymous stage ping for /deck. Tells DeckCP that a stage started or was
# signed off, so the parts of the process that run with nothing connected
# (framing, interview, outline) are visible at all.
#
# WHAT IS SENT — this is the whole payload, there is no other field:
#   anon_id  a random id this install generated once, in
#            ~/.deckcp/anon-id. Not your username, not your hostname, not
#            your IP, not an account. Delete the file and you're a new id.
#   stage    one of: framing interview outline brand build edit
#   event    stage_start | stage_confirmed
#   client   the agent name you pass in, e.g. claude-code
#
# WHAT IS NOT SENT: your deck, your outline, your headlines, your numbers,
# your company, your files, your paths, your IP. This script cannot send them
# — it has no argument that accepts them.
#
# TO TURN IT OFF, permanently and completely:
#   export DECKCP_TELEMETRY=0
# The check happens before anything is read or built. There is no retry, no
# queue, and nothing is written to disk when it's off.
#
# Usage: ping.sh <stage> <stage_start|stage_confirmed> [client]
# Always exits 0. A telemetry ping must never fail someone's deck work.

set -u

# --- opt-out, checked first ------------------------------------------------
case "${DECKCP_TELEMETRY:-}" in
  0|false|off|no) exit 0 ;;
esac
# Respect the community do-not-track convention too.
case "${DO_NOT_TRACK:-}" in
  1|true|yes) exit 0 ;;
esac

STAGE="${1:-}"
EVENT="${2:-}"
CLIENT="${3:-unknown}"

[ -n "$STAGE" ] || exit 0
[ -n "$EVENT" ] || exit 0

case "$STAGE" in
  framing|interview|outline|brand|build|edit) ;;
  *) exit 0 ;;
esac
case "$EVENT" in
  stage_start|stage_confirmed) ;;
  *) exit 0 ;;
esac

command -v curl >/dev/null 2>&1 || exit 0

ENDPOINT="${DECKCP_TELEMETRY_URL:-https://deckcp.com/api/telemetry/skill}"

# --- the anonymous install id ---------------------------------------------
ID_DIR="${HOME}/.deckcp"
ID_FILE="${ID_DIR}/anon-id"

if [ ! -f "$ID_FILE" ]; then
  mkdir -p "$ID_DIR" 2>/dev/null || exit 0
  # 20 hex chars from the kernel CSPRNG. No machine identifier is involved.
  NEW_ID=""
  if [ -r /dev/urandom ]; then
    NEW_ID=$(LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom 2>/dev/null | head -c 20)
  fi
  [ -n "$NEW_ID" ] || exit 0
  printf '%s' "$NEW_ID" > "$ID_FILE" 2>/dev/null || exit 0
  chmod 600 "$ID_FILE" 2>/dev/null || true
fi

ANON_ID=$(cat "$ID_FILE" 2>/dev/null | tr -dc 'a-f0-9')
[ -n "$ANON_ID" ] || exit 0

# Keep the client tag a bare token; anything else is dropped server-side too.
CLIENT=$(printf '%s' "$CLIENT" | tr -dc 'A-Za-z0-9._-' | cut -c1-32)
[ -n "$CLIENT" ] || CLIENT="unknown"

# --- send, quietly, and never block ---------------------------------------
curl -s -o /dev/null -m 3 \
  -X POST "$ENDPOINT" \
  -H 'Content-Type: application/json' \
  -d "{\"anon_id\":\"${ANON_ID}\",\"stage\":\"${STAGE}\",\"event\":\"${EVENT}\",\"client\":\"${CLIENT}\"}" \
  >/dev/null 2>&1 &

exit 0
