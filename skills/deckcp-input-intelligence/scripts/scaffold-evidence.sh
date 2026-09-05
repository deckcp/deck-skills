#!/usr/bin/env bash
# scaffold-evidence.sh — write the empty input-evidence.json template. Zero tokens.
# Stock macOS bash 3.2 compatible. No $() command substitution (Bash tool blocks it).
set -eu

OUT="./deck-brief"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"
EV="$OUT/input-evidence.json"

if [ -f "$EV" ]; then
  echo "input-evidence.json already exists at $EV — leaving it in place."
  exit 0
fi

cat > "$EV" <<'JSON'
{
  "schema_version": "1.0",
  "generated_by": "deckcp-input-intelligence",
  "generated_at": null,
  "detected_inputs": [],
  "intent": {
    "goal": "unknown",
    "goal_confidence": "unknown",
    "explicit_overrides": [],
    "notes": ""
  },
  "deck_purpose": "",
  "audience": { "value": "", "status": "unknown", "confidence": "unknown", "source": "" },
  "company": {
    "name":        { "value": "", "status": "unknown", "confidence": "unknown", "authority": "", "source": "" },
    "positioning": { "value": "", "status": "unknown", "confidence": "unknown", "authority": "", "source": "" },
    "product":     { "value": "", "status": "unknown", "confidence": "unknown", "authority": "", "source": "" },
    "market":      { "value": "", "status": "unknown", "confidence": "unknown", "authority": "", "source": "" },
    "proof":       []
  },
  "brand": {
    "colors": [],
    "fonts": [],
    "logo": { "value": null, "status": "unknown", "confidence": "unknown", "authority": "", "source": "" },
    "visual_behavior": { "value": "", "status": "unknown", "confidence": "unknown", "authority": "", "source": "" }
  },
  "content": [],
  "imagery": [],
  "reference_intent": {
    "present": false,
    "classification": "none",
    "confidence": "unknown",
    "signals": [],
    "target_ref": null,
    "notes": ""
  },
  "conflicts": [],
  "missing": [],
  "questions_required": [],
  "interaction_mode": "interview",
  "recommended_route": "interview-led",
  "route_reason": "",
  "handoff": { "prefill_brief": false, "brand_evidence_ready": false, "notes": "" }
}
JSON

echo "Wrote template: $EV"
echo "Fill it in as you detect, acquire, and reason over the inputs."
