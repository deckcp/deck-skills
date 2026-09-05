#!/usr/bin/env bash
# init-brief.sh — scaffold the deck-interview output. Zero tokens.
# Stock macOS bash 3.2 compatible. No $() command substitution (Bash tool blocks it).
set -eu

OUT="./deck-brief"
TYPE=""

usage() {
  echo "usage: init-brief.sh [--out DIR] [--type investor|sales|partnership|internal]" >&2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --out)
      if [ $# -lt 2 ]; then echo "--out needs a directory" >&2; usage; exit 2; fi
      OUT="$2"; shift 2 ;;
    --type)
      if [ $# -lt 2 ]; then echo "--type needs a value" >&2; usage; exit 2; fi
      TYPE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

case "$TYPE" in
  ""|investor|sales|partnership|internal) ;;
  *) echo "unknown --type: $TYPE (investor|sales|partnership|internal)" >&2; exit 2 ;;
esac

mkdir -p "$OUT"
BRIEF="$OUT/brief.json"

if [ -f "$BRIEF" ]; then
  echo "brief.json already exists at $BRIEF — leaving it in place."
  exit 0
fi

# Unquoted heredoc: $TYPE is the only expansion in the template.
cat > "$BRIEF" <<JSON
{
  "deck_type": "$TYPE",
  "setting": "",
  "audience": { "who": "", "believes": "", "skeptical_of": "" },
  "success_outcome": "",
  "ask": "",
  "problem": "",
  "insight": "",
  "solution_one_sentence": "",
  "proof": [],
  "differentiation": "",
  "unfair_advantage": "",
  "objections": [],
  "assessment": { "strongest": "", "weakest": "", "reframes_applied": [] },
  "voice": ""
}
JSON

echo "Wrote template: $BRIEF"
echo "Fill it in as the interview proceeds."
