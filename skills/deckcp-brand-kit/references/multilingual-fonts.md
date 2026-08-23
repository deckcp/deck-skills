# Multilingual fonts — make non-English text render, automatically

**The user should never have to pick a font to make Korean, Chinese, Japanese,
Thai, Arabic, etc. show up.** DeckCP can render every one of these — the trick
is loading the right font. This is the mechanism, verified on the renderer, so
the pack can do it without asking.

## Why it works (the one non-obvious fact)

DeckCP ships a 35-face Latin **picker** catalog with no CJK/Thai/Arabic faces,
so for a long time the safe advice was "romanize non-Latin text." That was
**wrong**. The renderer's font loader (`googleFontsUrl` → a Google Fonts
`<link>`) loads **any family that isn't a system font** — it is *not* limited
to the picker. The gate is only: is the family named as the **primary** family
of a `deck_theme` font slot (`fontDisplay` / `fontHeading` / `fontBody`)? If
yes, the renderer emits a real `<link>` for it and the glyphs render on every
surface (viewer, embed, thumbnail, export).

Node-level `fontFamily` alone does **not** trigger a load (that path is
filtered to the picker catalog). So the rule is:

> **Load the font via a `deck_theme` slot; apply it via node `fontFamily`.**

Verified: with `deck_theme.fontHeading = "'Noto Sans KR', 'Open Sans', sans-serif"`,
a node styled `fontFamily: "'Noto Sans KR', 'Open Sans', sans-serif"` renders
`안심 돈카츠 · 오감을 깨우는 미식 · ₩17,000` perfectly — Korean *and* the ₩ symbol
(which tofu'd under a Latin-only font). A single line mixing `OJEJE — 정통 일본식
돈카츠 house.` renders both scripts, because a CSS font stack falls through
**per character** — Noto covers the Hangul, the Latin resolves in either font.

## The script → font map (Google Noto — designed for exactly this)

| Script (Unicode block) | Sans | Serif |
| --- | --- | --- |
| Hangul (Korean) | Noto Sans KR | Noto Serif KR |
| Han + Kana (Japanese) | Noto Sans JP | Noto Serif JP |
| Han (Chinese, Simplified) | Noto Sans SC | Noto Serif SC |
| Han (Chinese, Traditional) | Noto Sans TC | Noto Serif TC |
| Thai | Noto Sans Thai | Noto Serif Thai |
| Arabic | Noto Sans Arabic | Noto Naskh Arabic |
| Hebrew | Noto Sans Hebrew | Noto Serif Hebrew |
| Devanagari (Hindi, Marathi…) | Noto Sans Devanagari | Noto Serif Devanagari |
| Bengali, Tamil, Telugu, … | Noto Sans <Script> | Noto Serif <Script> |

Every Noto CJK face also includes **Latin**, so a Noto stack renders mixed
copy consistently. **Cyrillic, Greek, Vietnamese** usually need no special font
— most catalog Latin faces (Inter, Open Sans, Lora, Montserrat…) already carry
those ranges; only switch if the render shows gaps.

## Two modes — pick by how much non-Latin the deck has

**Mode A — deck is mostly one non-Latin language** (a Korean deck, a Thai
deck). Make the Noto family the deck's actual type system so *everything*
inherits it and stays consistent:

```
update_deck { deck_slug, deck_theme: {
  fontDisplay: "'Noto Serif KR', serif",
  fontBody:    "'Noto Sans KR', sans-serif"
} }
```

Nodes need nothing special; both scripts render in one polished family.

**Mode B — deck is mostly English with non-Latin accents** (bilingual EN/KR
labels, a few names, prices). Keep the brand's Latin fonts, and add the Noto
font on a **loader slot** — `fontHeading` is ideal because slide-space trees
set `fontFamily` explicitly and nothing consumes `--deck-font-heading`, so the
slot's only job is to trigger the load:

```
update_deck { deck_slug, deck_theme: { fontHeading: "'Noto Sans KR', 'Open Sans', sans-serif" } }
```

Then, on every text node that contains that script, put the Noto font FIRST in
the stack, brand font second:

```
style: { fontFamily: "'Noto Sans KR', 'Open Sans', sans-serif", ... }
```

Latin glyphs still resolve to the brand font (or to Noto's own Latin — near
identical for body), the script glyphs resolve to Noto. Headline serif nodes
use `"'Noto Serif KR', Lora, serif"` to keep the serif feel on both scripts.

## Multiple non-Latin scripts on one deck

The theme has three slots; each loads its primary family. For up to two extra
scripts, use `fontHeading` and (if free) another slot as loaders, and give each
script's nodes the matching Noto stack. For three or more, prefer Mode A per
section, or note the constraint — the reliable, tested guarantee is one loader
slot per extra script.

## Currency & symbol glyphs

`₩ ¥ € ₹ ฿` etc. render only in a font that includes them. Latin catalog faces
often miss `₩`/`฿`; the matching Noto face has them. So once the script's Noto
is loaded and applied, the currency symbol renders too — no need to spell out
"KRW" unless you prefer it stylistically.

## Never leave it to chance

- **Detect** scripts from the actual text (see `deckcp-quality-control`'s scan
  — it flags each non-Latin block per slide).
- **Choose** the Noto face from the table above — automatically, from the
  detected script; do not ask the user to name a font.
- **Load + apply** via Mode A or B.
- **Verify on the render.** The image is ground truth: a box (□), a blank gap,
  or a Latin-looking fallback where a script should be means the font didn't
  load or wasn't applied. This is a mandatory QC check, not optional.
