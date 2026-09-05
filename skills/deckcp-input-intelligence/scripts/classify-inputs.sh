#!/usr/bin/env bash
# classify-inputs.sh — inventory + first-pass classify user inputs. Zero tokens, no network.
# Extension/name-based only (never reads file contents). Ambiguous types are flagged
# needs_confirmation:true for the model to resolve. Stock macOS bash 3.2 compatible.
# No $() command substitution (Bash tool blocks it).
set -eu
shopt -s nocasematch 2>/dev/null || true
shopt -s nullglob 2>/dev/null || true

OUT="./deck-brief"
ARGS=""

emit_paths=""   # newline-separated list we build up

add_path() { emit_paths="$emit_paths
$1"; }

# expand a directory one and two levels deep (no recursion beyond that, no find)
expand_dir() {
  d="$1"
  for f in "$d"/* "$d"/*/*; do
    [ -f "$f" ] && add_path "$f"
  done
}

# --- args: --out DIR | --roots "a:b" | <path|url> ...
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    --roots)
      roots="$2"; shift 2
      OLDIFS="$IFS"; IFS=":"
      for r in $roots; do
        [ -z "$r" ] && continue
        if [ -d "$r" ]; then expand_dir "$r"; elif [ -e "$r" ]; then add_path "$r"; fi
      done
      IFS="$OLDIFS"
      ;;
    *)
      a="$1"; shift
      case "$a" in
        http://*|https://*) add_path "$a" ;;
        *) if [ -d "$a" ]; then expand_dir "$a"; elif [ -e "$a" ]; then add_path "$a"; else add_path "$a"; fi ;;
      esac
      ;;
  esac
done

mkdir -p "$OUT"
INV="$OUT/input-inventory.json"

ESC=""
json_escape() {
  # sets global ESC = JSON-safe copy of $1 (no command substitution)
  s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  ESC="$s"
}

classify() {
  # sets global TYPE, ROLE, NEEDS from a path/url in $1
  p="$1"
  TYPE="unknown"; ROLE="unknown"; NEEDS="true"

  case "$p" in
    http://*|https://*)
      case "$p" in
        *instagram.com*|*linkedin.com*|*youtube.com*|*youtu.be*|*tiktok.com*|*facebook.com*|*twitter.com*|*x.com/*)
          TYPE="social_url"; ROLE="imagery"; NEEDS="false" ;;
        *)
          TYPE="website_url"; ROLE="company_source"; NEEDS="false" ;;
      esac
      return ;;
  esac

  base="${p##*/}"
  ext="${p##*.}"
  [ "$ext" = "$p" ] && ext=""

  case "$ext" in
    svg)
      TYPE="svg"; ROLE="brand_source"; NEEDS="false"
      case "$base" in *logo*|*mark*|*wordmark*) TYPE="logo" ;; esac ;;
    png|jpg|jpeg|webp|gif|bmp|tif|tiff|avif)
      case "$base" in
        *logo*|*wordmark*|*mark*) TYPE="logo"; ROLE="brand_source"; NEEDS="false" ;;
        *screenshot*|*screen*|*shot*) TYPE="screenshot"; ROLE="imagery"; NEEDS="false" ;;
        *) TYPE="image"; ROLE="imagery"; NEEDS="true" ;;
      esac ;;
    pdf)
      TYPE="pdf"; ROLE="unknown"; NEEDS="true"
      case "$base" in
        *brand*|*guide*|*guidelines*|*identity*) TYPE="brand_guide"; ROLE="brand_source"; NEEDS="false" ;;
        *deck*|*pitch*|*presentation*) TYPE="company_deck"; ROLE="design_reference"; NEEDS="true" ;;
      esac ;;
    pptx|potx|ppt)
      TYPE="pptx"; ROLE="design_reference"; NEEDS="true"
      case "$base" in *template*) TYPE="pptx"; ROLE="brand_source" ;; esac ;;
    key)
      TYPE="pptx"; ROLE="design_reference"; NEEDS="true" ;;
    csv|tsv|xlsx|xls|numbers|json)
      TYPE="spreadsheet"; ROLE="data_source"; NEEDS="false"
      case "$ext" in json) TYPE="data" ;; esac ;;
    md|txt|rtf|docx|doc)
      TYPE="text_document"; ROLE="content_source"; NEEDS="true" ;;
    "")
      TYPE="unknown"; ROLE="unknown"; NEEDS="true" ;;
    *)
      TYPE="unknown"; ROLE="unknown"; NEEDS="true" ;;
  esac
}

{
  printf '{\n'
  printf '  "generated_by": "classify-inputs.sh",\n'
  printf '  "inputs": ['
  SEP=""
  OLDIFS="$IFS"; IFS='
'
  for p in $emit_paths; do
    [ -z "$p" ] && continue
    classify "$p"
    json_escape "$p"; ep="$ESC"
    json_escape "$TYPE"; et="$ESC"
    printf '%s' "$SEP"
    printf '\n    { "raw": "%s", "type": "%s", "role_hint": "%s", "needs_confirmation": %s }' "$ep" "$et" "$ROLE" "$NEEDS"
    SEP=","
  done
  IFS="$OLDIFS"
  printf '\n  ]\n}\n'
} > "$INV"

echo "Wrote inventory: $INV"
echo "Extension/name-based first pass. Resolve every needs_confirmation:true item by intent + a look at the file."
