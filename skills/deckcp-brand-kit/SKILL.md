---
name: deckcp-brand-kit
description: Establish the design system a deck is built on BEFORE any slides exist — extract the user's real brand (literal hex from an SVG logo, real CSS/fonts from their website, a transcribed brand guide, a PPTX theme) or, when they have nothing, synthesize a premium design system benchmarked on deckcp.com/templates — then write it into the DeckCP brand/theme. Use when the user says "set up my brand", "use my colors", "here's my logo", "match our website", "I don't have a brand", or before deckcp-build-deck. Extraction works with no account; writing needs the DeckCP MCP.
argument-hint: "[--source <logo.svg|guide.pdf|deck.pptx|https://…>]... [--brand <slug>] [--deck <slug>] [--out ./deck-brief]"
---

# Brand Kit (two paths — extract what's real, or synthesize to a benchmark)

Every generated deck is only as good as the design system it's built on. Left
alone, a generation pipeline reaches for the same thing every time: a dark
gradient, a safe blue, Inter, three icon cards. This skill runs **before**
generation and decides, explicitly, which of two roads the deck takes:

- **EXTRACT** — the user has a logo, a brand guide, an existing deck, or a
  website. Their brand already exists; the job is to read it *literally* and
  lose nothing in translation.
- **SYNTHESIZE** — the user has nothing. Don't hand them "a deck"; design them
  a system as tight as the ones on [deckcp.com/templates](https://deckcp.com/templates),
  where each template is one surface pair, one accent, one type pairing, one
  signature device — and nothing else.

Either way it ends in `./deck-brief/brand-kit.json`, and — when the user owns
the brand and the MCP is connected — in the DeckCP theme and brand masters,
so every downstream skill (`deckcp-build-deck`, `deckcp-author-slides`,
`deckcp-quality-control`) inherits it instead of improvising.

## Why the model tiers split this way

- **Extraction is script-first.** Hex codes in an SVG, `--primary` variables
  in a stylesheet, `accent1` in a PPTX theme, `font-family` declarations — a
  script reads these exactly, for free, and a model reading them "from memory"
  of the page will round `#1A4FD6` to "blue". `scripts/extract-brand.js` does
  the reading; you do the **role assignment** (which of the six colors is the
  background, which is the accent) — that's judgment, and cheap.
- **Synthesis is a main-loop step.** Choosing a direction that fits a
  Series-A pitch to a skeptical fintech partner is taste. Don't delegate it
  to a downgraded model; this is where "premium vs. generic" is decided.
- **Validation is script again.** `scripts/check-kit.js` checks hex syntax,
  WCAG contrast on every text/surface pair, that fonts are in DeckCP's
  curated catalog, and emits the exact `deck_theme` payload to write.

## Step 0 — which road?

Look before you ask. In this order:

```bash
ls ./deck-brief/brand-kit.json 2>/dev/null     # already done? reuse, don't redo
ls ./deck-assets/*.svg ./deck-assets/*logo* 2>/dev/null   # gather-assets may have found a logo
cat ./deck-brief/brief.json 2>/dev/null         # deck_type / audience / setting drive the synth direction
```

```
get_brand { brand_slug }        # MCP connected: does the brand already have a real palette + logos?
```

`get_brand` returning `"No approved palette on file."` / `"No approved logos
on file."` is the signal that the brand is empty. A brand with five role
colors, logos, and guidelines is itself a source — **EXTRACT from it** and
skip to Step 3; don't synthesize over a brand that exists.

Then ONE question, only if it's still unclear:

> "Do you have any of: a logo file (SVG best), a brand guide (PDF), an
> existing deck (PPTX/PDF), or a website I should match? If none — say so and
> I'll design a system for you."

Anything → **Path A**. Nothing → **Path B**. A logo alone is enough for Path A
(colors are literal; fonts get synthesized around them — say which is which).

## Path A — EXTRACT (read it literally, cite every token)

### A1 — run the extractor (zero tokens)

```bash
node scripts/extract-brand.js --out ./deck-brief \
  ./path/logo.svg https://example.com ./brand-guide.pdf ./old-deck.pptx
```

It accepts any mix of sources and writes `./deck-brief/brand-extract.json`:

| Source | What the script reads, literally |
| --- | --- |
| `.svg` | Every `fill`/`stroke`/`stop-color`/inline-CSS hex and `rgb()` (normalized to 7-char hex) with occurrence counts; gradient stops flagged; `font-family` if the logo has live text. |
| `https://…` | HTML + same-origin linked stylesheets: `:root` custom properties (`--primary`, `--bg`, …) with names kept as role hints; `<meta name="theme-color">`; `font-family` declarations and Google Fonts `<link>` families; `<img>`/inline `<svg>` whose src/alt/class says "logo"; `og:image`. |
| `.css` / `.html` | Same as a website, offline. |
| `.pptx` | `ppt/theme/theme1.xml`: the `dk1/lt1/dk2/lt2/accent1–6/hlink` color slots and the major/minor `latin` typefaces. This is the deck's *declared* system, not a guess. |
| `.pdf` | `pdffonts`-style font list when `pdffonts`/`pdftotext` exist (brand guides usually name their fonts in text — the script greps "Pantone", "HEX", "RGB", "CMYK", "typeface", "font" lines and keeps them verbatim for you to transcribe). |
| `.png` / `.jpg` | **No literal colors exist in a raster.** The script reports that and skips it; see A2. |

Read the summary it prints. Counts matter: in an SVG the hex with the most
fills is usually the brand color; the one with the most strokes, an outline;
a `#FFFFFF` with one fill is knockout, not a palette color.

### A2 — assign roles (your judgment, small)

Map what was found onto DeckCP's five brand roles — **copy hexes verbatim,
never "improve" one**:

| Role | Pick |
| --- | --- |
| `Background` | The page/surface color. Website: `--bg`/`--surface`/the `body` background. PPTX: `lt1`. SVG-only: decide light or dark from the logo's knockout color (a white-filled wordmark is a dark-surface brand). |
| `Text` | What body copy sits in. Website: `--text`/`--foreground`/`body color`. PPTX: `dk1`. Must be legible on `Background` — `check-kit.js` will fail the pair if it isn't. |
| `Primary` | The identity color — the logo's dominant fill, `--primary`/`--brand`, `accent1`. |
| `Accent` | The vivid CTA/highlight color — links, buttons, `accent2`. Distinct from Primary. If the brand genuinely has one hue, Accent = Primary and say so. |
| `Secondary` | The supporting hue — `accent3`, a second logo color, or a tint the source already uses. Never invent one; if absent, leave it null and the deck falls back to DeckCP's default. |

Up to three more, named descriptively (`"Sand"`, `"Forest"`), only if the
source really has them. Every color in the kit gets a `source` string
(`"logo.svg fill ×14"`, `"site :root --primary"`, `"theme1.xml accent1"`,
`"guide p.4 'Pantone 2935 C'"`) — that's the audit trail the QC gate checks
against.

**Rasters (PNG/JPG logos).** Colors sampled from a raster are
anti-aliased approximations. If that's all there is: render it (Read the
image), pick the dominant flat fills by eye, and mark them
`"confidence": "sampled"` — then ask the user for the real hex if it matters
("is your green `#2E7D32` or close to it?"). Never present a sampled hex as
the brand's hex.

**Fonts.** DeckCP renders a curated 35-face Google Fonts catalog (listed in
`scripts/check-kit.js`). If the extracted family is in it, use it. If not,
pick the closest curated face and record it as
`"fontDisplay": { "brand": "Söhne", "mapped": "Inter", "why": "grotesk, similar x-height" }`
— the kit tells the truth about the substitution instead of silently
switching.

**Logos.** Keep the SVG if you have one (it scales; rasters blur on a
1920×1080 hero). Note which variants exist: full-color, white/knockout,
icon-only. Missing a knockout variant is a finding — dark slides will need
one.

**Brand guide PDF.** Transcribe, don't interpret: the guide's own hex/RGB
values, named typefaces, logo clear-space and minimum-size rules, the
do/don't list. Pantone → hex only via the guide's own conversion table if it
has one; otherwise flag it as a Pantone name with `confidence: "named"`.

### A3 — write the extracted kit

Fill `./deck-brief/brand-kit.json` (schema in Step 3) with `"mode": "extract"`.
Guidelines = what the sources *show*: "hairline rules, no cards, one accent
used only for numbers" if that's what the website does. Two to four
sentences, specific enough that a pipeline can obey them.

## Path B — SYNTHESIZE (premium, benchmarked — not "a nice deck")

### B1 — the bar

Open the benchmark and actually look at it: `https://deckcp.com/templates`
(WebFetch the page, and render any template that fits the brief's deck type).
What makes those twelve read as designed rather than generated is
**restraint** — every one of them is exactly:

1. **One surface pair** — a page color and an ink that sit on it (paper-white
   + near-black, charcoal + warm white, cobalt + cream). Not "light and dark
   modes"; one page.
2. **One accent**, used for one job (numbers, or rules, or section pages —
   pick one). Optionally one secondary that never competes.
3. **One type pairing** with hierarchy by *size and weight*, not by font
   count — a display face + a body face, or a single geometric sans.
4. **One signature device** that repeats on every slide: hairline rules,
   capsule labels, floating white panels, a mint section rail, ghost numerals,
   2.5px espresso grid rules, flat numeral squares.
5. **One structural language** — cards, *or* hairlines, *or* flat panels,
   *or* an editorial grid. Never a mix.

Synthesis means choosing those five things for *this* brief and writing them
down so a pipeline can't drift. It does not mean copying a template — it
means meeting its discipline.

### B2 — pick a direction from the brief

Read `deck_type`, `audience`, `setting`, and the product's register from
`brief.json`. Choose ONE direction and name it (this name becomes the kit's
`direction`):

| Direction | When | Surface · accent · type · device |
| --- | --- | --- |
| **Editorial paper** | investor/board, numbers-led, read as a link | paper-white + ink · one cool accent on numbers only · tight-tracked sans (Manrope/Inter) · hairline rules, no cards |
| **Dark war room** | growth/ops/infra, data-first, presented live | deep navy/charcoal + warm white · one hot accent (coral, volt, aqua) · Space Grotesk/Sora display over DM Sans · full-accent interlude slides |
| **Flat two-tone** | consulting/services, friendly, proposal | one saturated page color + cream · no third color · a single geometric sans (Poppins/Outfit) sized for hierarchy · flat panels, rounded corners, giant centered divider titles |
| **Institutional** | enterprise sales, procurement rooms | light gray page + floating white panels · navy blocks + one electric square motif · EB Garamond/Source Serif display over Inter body · numbered bars, square-node timelines |
| **Loud headline** | agency, campaign, consumer launch | near-black + volt/yellow/white · oversized caps (Archivo Black/Anton/Bebas) · 4–5px borders, grayscale photo crops, one circle motif |
| **Gallery grid** | marketing plans, brand launches | blush/sand paper + espresso ink · condensed caps (Oswald) over a humanist sans · photos butted against 2–3px grid rules, thin ellipse ornament |

If the brief points at a hybrid, it points at the wrong direction — pick
the dominant one. Tell the user which you chose and the one-line reason.

### B3 — generate the tokens

- **Colors:** exactly five role hexes (`Background`, `Text`, `Primary`,
  `Accent`, `Secondary`), real 7-char hex, chosen so `Text` on `Background`
  passes **4.5:1** and `Accent` on `Background` passes **3:1** (large text)
  — `check-kit.js` enforces both. Avoid the generic defaults the pipeline
  would have picked anyway: `#6366F1`/`#7C3AED` purple-on-dark gradients,
  `#3B82F6` blue, `#0F172A` slate, pastel-rainbow card accents.
- **Fonts:** from the curated catalog only (the check fails otherwise).
  Name the pairing and the rule: "Fraunces for titles at deck-text-7xl+,
  Inter everything else". Two families max.
- **Signature device + structural language:** one sentence each, concrete
  enough to author from — "a 1px `border-slate-300` rule under every title
  and above every footer; stats sit on the rule, not in cards".
- **Mood:** map to a DeckCP `defaultMood` (`editorial`, `keynote`, …) and a
  default `variant` (`light`/`dark`).
- **Page margin:** 96px for editorial/paper, 64px for dense/institutional.
- **Logo:** none exists — say so in the kit (`logos: {}`) and give the hero a
  wordmark rule instead: the company name set in the display face at
  `deck-text-9xl`. Do not generate a logo.

Write the kit with `"mode": "synthesize"` and a `guidelines` paragraph that
reads like a template description on the benchmark page — if it couldn't sit
in that list, it isn't tight enough yet.

## Step 3 — brand-kit.json (both paths)

```json
{
  "mode": "extract | synthesize",
  "direction": "editorial-paper | dark-war-room | … | null (extract)",
  "brand_name": "",
  "colors": {
    "Background": { "hex": "#FAFAF7", "source": "site :root --bg", "confidence": "literal | sampled | named | chosen" },
    "Text":       { "hex": "#141414", "source": "", "confidence": "" },
    "Primary":    { "hex": "", "source": "", "confidence": "" },
    "Accent":     { "hex": "", "source": "", "confidence": "" },
    "Secondary":  { "hex": null, "source": "absent in source", "confidence": "" }
  },
  "extra_colors": { "Sand": { "hex": "", "source": "" } },
  "fonts": {
    "display": { "brand": "Söhne", "mapped": "Inter", "why": "" },
    "body":    { "brand": "Inter", "mapped": "Inter", "why": "in catalog" }
  },
  "logos": { "color": "./deck-assets/logo.svg", "white": null, "icon": null, "uploaded": {} },
  "surface": { "default_variant": "light | dark", "mood": "editorial", "page_margin": 96 },
  "signature_device": "one sentence",
  "structural_language": "cards | hairlines | flat-panels | editorial-grid — one sentence",
  "guidelines": "2–4 sentences a pipeline can obey",
  "dont": ["no gradients", "accent never on body text", "…"],
  "sources": ["logo.svg", "https://example.com", "brand-guide.pdf"]
}
```

Then validate:

```bash
node scripts/check-kit.js ./deck-brief/brand-kit.json
```

It fails on: malformed hex, `Text`/`Background` under 4.5:1, `Accent`/
`Background` under 3:1, a font not in the catalog, a missing role. On pass it
prints (a) the `deck_theme` payload for `update_deck`, (b) a paste-ready block
for the brand record, and (c) a one-paragraph `brand-kit.md` summary. Fix
and re-run until it passes — a kit that fails contrast will fail the QC gate
later anyway.

## Step 4 — write it into DeckCP (MCP connected)

**First decide scope — and ask if it isn't obvious:**

- **The user owns this brand** (it's their company, their logo) → write at
  **brand scope** so every deck inherits it.
- **It's someone else's brand** (a partnership deck styled for the partner,
  a sales deck mirroring a prospect's site) → **deck scope only**. Never
  overwrite the user's brand record or brand masters with a third party's
  identity.

There is no brand-write MCP tool; the brand record's palette/logos/guidelines
are edited in the web UI. So "write it in" is three moves:

**4a — deck theme (deck scope, always available once a deck exists):**

```
update_deck { deck_slug, deck_theme: {
  accent:      "<Primary hex>",
  secondary:   "<Secondary hex or null>",
  fontDisplay: "<mapped display css stack>",
  fontBody:    "<mapped body css stack>",
  defaultMood: "<mood>",
  pageMargin:  <px>
} }
```

(`check-kit.js` prints this exact object.) `deck_theme` shallow-merges; it
is the highest-precedence layer (`deck_theme` ⊃ brand palette ⊃ defaults),
so a deck-scope write is always safe for the third-party case.

**4b — logos (owned brand only):**

```
upload_asset { data: <base64 svg/png>, content_type, filename }   # → public URL
```

Record returned URLs in `brand-kit.json → logos.uploaded`. Use them in masters
(`logo` slot) and in hero MDX (`<img src=… className="deck-logo-xl">`).

**4c — house style via masters (owned brand only — confirm first):**

`set_masters scope:'brand'` installs the signature device once, inherited by
**every deck on the brand** — which is exactly why you confirm before
calling it. Build 2–4 masters (e.g. `paper` content, `section` full-accent
divider, `title`) from the kit: `background.color` from the surface pair,
`logo.which/size`, `title.preset`/`subtitle.preset` from
`list_style_presets`, `footers`, and a `decor` tree for the device (the
hairline, the rail, the square). Then:

```
get_masters { deck_slug }                              # see what's inherited now
set_masters { brand_slug, scope:'brand', masters:[…] } # replaces wholesale — include existing ones you keep
render_slides { deck_slug, refresh:true }
```

For a deck-scope-only kit, the same with `scope:'deck'`.

**4d — the brand record (owned brand, web UI):** hand the user the paste
block `check-kit.js` printed — five role colors, extra colors, logo URLs,
the guidelines paragraph — and the place: **`deckcp.com/<org>/brands`** (or
Settings → Branding). Say plainly that this is the one step the MCP can't do.
Until they do it, the deck-scope theme carries the kit, so nothing is blocked.

## Step 5 — hand off

Report: which path, the five colors with their sources, the type pairing (and
any substitution), the device, what was written where (deck theme / masters /
"paste into /brands"). Then:

> "Run `deckcp-build-deck` — it reads `brand-kit.json`, applies the theme
> before generating, and folds the guidelines into the generation context.
> `deckcp-quality-control` will score the finished deck against this kit."

## Guardrails

- **Never shift a literal hex.** `#1A4FD6` stays `#1A4FD6`. Rounding "to a
  nicer blue" is the exact failure this skill exists to prevent.
- Every color carries a `source`. A kit with `"source": ""` on an extracted
  color isn't finished.
- Don't write a third party's brand into the user's brand record or brand
  masters — deck scope only, and say why.
- Confirm before `set_masters scope:'brand'` — it changes every deck.
- Synthesis produces **one** system. If you're tempted to offer three
  palettes, pick the one that fits the brief and show that; options are a
  way of not deciding.
- No raster sampling presented as fact; no Pantone "converted" from memory.
- Don't generate a logo. A wordmark in the display face is the honest
  placeholder.
