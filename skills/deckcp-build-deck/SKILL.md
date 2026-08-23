---
name: deckcp-build-deck
description: Build a real DeckCP deck from a brief or outline — establish the brand kit first, generate the outline, generate on-brand slides, validate each one, render, and run the quality-control gate before calling it done. Use when the user says "build the deck", "make the slides", "turn this into a DeckCP deck", or after deck-interview/deck-outline. Requires the DeckCP MCP connected.
argument-hint: "[--brief ./deck-brief/brief.json] [--outline ./deck-brief/outline.json] [--brand <slug>] [--deck <slug>]"
---

# Build Deck (DeckCP MCP orchestration — minimal tokens)

Drive the DeckCP generate pipeline end to end: brief/outline → **brand kit** →
outline → slides → check → render → **quality gate**. This skill is
**orchestration**, not authoring — the MCP's AI pipeline writes the slides
on-brand; your job is to feed it the right context and the right design system,
then validate, score, and report.

Two steps are not skippable: `deckcp-brand-kit` **before** generating (so the
pipeline builds on a real system, not its defaults) and
`deckcp-quality-control` **after** (so "done" means scored and fixed, not
"generation returned").

## Why this is mostly not a model step

The heavy generation runs server-side inside DeckCP (`generate_outline`,
`generate_slides_from_outline`). `check_slide` is a **deterministic validator** (no
render, free). Model judgment is only needed to (a) turn a brief/outline into the
`context` string, (b) decide fixes when `check_slide` flags a slide, and (c) the
quality gate's render-and-look scoring, which is deliberately main-loop. Keep token
use low everywhere else — don't re-narrate slide content the pipeline already produced.

## Step 0 — identity & brand

```
whoami                     # confirm which DeckCP user you are
list_decks                 # orient; is there already a deck to build into?
```

Pick the brand: if the user has one brand, use it; otherwise ask. Fetch it so the
outline respects the design lockdown:

```
get_brand { brand_slug: <brandSlug> }
```

If the token can't see the intended deck later, it's an access issue, not a retry —
tell the user to share the deck with the `whoami` email (see MCP instructions).

## Step 0.5 — brand kit (mandatory, before anything generates)

```bash
cat ./deck-brief/brand-kit.json 2>/dev/null
```

- **Kit exists** → use it. Its `guidelines`, `signature_device`,
  `structural_language`, and `dont` go into the generation context (Step 1);
  its theme payload is applied to the deck in Step 2.
- **No kit, and `get_brand` shows a real palette + logos** → run
  `deckcp-brand-kit` in extract mode against the brand (fast: it reads the
  record, validates contrast, maps fonts). Still produces the kit the QC gate
  scores against.
- **No kit, and the brand is empty** ("No approved palette on file") → run
  `deckcp-brand-kit` now. It will extract from whatever the user has (logo,
  site, guide, old deck) or synthesize a system benchmarked on
  deckcp.com/templates. **Do not generate on an empty brand** — that is
  exactly how generic decks happen.

## Step 1 — assemble context from the brief/outline

Read whatever exists:

```bash
cat ./deck-brief/brief.json 2>/dev/null; cat ./deck-brief/outline.json 2>/dev/null
```

- **If `outline.json` exists** (preferred): you already have a slide-by-slide spine.
  You can feed it two ways — see Step 3, path A.
- **If only `brief.json` exists**: compose a tight `context` string from it —
  audience, ask, problem, insight, solution, proof, differentiation, objections.
  This is the one place your words matter; make the context a clean brief, not a
  data dump.
- **If neither exists**: run `deck-interview` (and ideally `deck-outline`) first, or
  interview inline. Do not build blind.

Then append the **design system** to the context, from `brand-kit.json` — a
short block the pipeline can obey:

```
DESIGN SYSTEM (binding): <guidelines>. Signature device: <signature_device>.
Structure: <structural_language>. Chrome on every slide: <chrome>. Imagery:
<imagery>. Type: <display> for titles, <body> for everything else. Palette
roles: Background <hex>, Text <hex>, Primary <hex>, Accent <hex> (used only
for <job>), Secondary <hex>. Don't: <dont list>.
LAYOUT VARIETY (binding): no two consecutive slides share a layout; pace
through distinct archetypes (split feature, numbers-as-hero stat row, media +
numbered steps, editorial timeline, data/rules table, ONE icon-card grid at
most, a full-bleed section divider every 3–4 slides).
```

The brand lockdown the pipeline already sees covers the palette; this block
is what stops it from defaulting to icon-card grids on a gradient. The
archetype menu and the chrome-as-master pattern are in
[`references/layout-archetypes.md`](references/layout-archetypes.md) — read it
before you shape the outline, and let it drive each slide's `visual` choice so
the deck gets template-grade variety, not one repeated skeleton.

**English only unless a CJK font is in the catalog.** DeckCP's curated font
set has **no** Chinese/Japanese/Korean face — any CJK text renders as tofu
boxes (□). Do NOT ask the pipeline for bilingual/CJK titles or body: state
"all copy in English (Latin script only); no Korean/Japanese/Chinese
characters" in the context. Same for currency: write "KRW 17,000", never the
₩ symbol (it has no glyph either). `deckcp-quality-control`'s scan flags any
CJK/₩ that slips through, but it's far cheaper never to generate it.

**Two platform limits worth knowing before you build** (both learned the hard
way on a real run):

- **`deck_theme.accent` is not absolute.** The generator can bake an explicit
  accent hex into a slide's MDX, and a `defaultMood` can make the *mood's*
  accent win over `deck_theme.accent` — so a themed deck can still render the
  wrong accent color. If the render shows the framework amber (`#ffb020`) or
  any color that isn't the kit's, that's this. Mitigations: prefer components
  that read the accent token over hardcoded colors; consider omitting
  `defaultMood`; and see the next point.
- **Full brand fidelity needs a brand record, not just `deck_theme`.** When
  the deck's `brand_slug` is a *different* brand than the one the kit
  describes (e.g. building an OJEJE deck on a shared house brand), `deck_theme`
  carries color + fonts but the generator still reasons about the deck's brand
  lockdown, may inject that brand's accent per slide, and you cannot install
  the kit's chrome/section masters. For a deck that must truly look like the
  brand, it needs its **own brand record** (palette + fonts + logos +
  masters) — created in the web UI, since no MCP tool writes a brand. On a
  borrowed brand, treat perfect color/chrome fidelity as out of reach and say
  so.

## Step 2 — create or reuse the deck

If building into a new deck:

```
create_deck { title, brand_slug, target_audience, description }
```

It returns the `deck_slug`. If reusing, use the existing slug.

Apply the kit's theme **before** generating, so the pipeline and every render
see the same system (`check-kit.js` prints this exact object):

```
update_deck { deck_slug, deck_theme: { accent, secondary, fontDisplay, fontBody, defaultMood, pageMargin } }
```

**Build the chrome master before generating.** If the kit's `chrome` field is
set and no master carries it yet, build it now (`deckcp-brand-kit` Step 4c has
the recipe) so every generated slide inherits the same eyebrow + headline +
footer frame — this is what makes the deck read as one family. If the kit
installed brand masters (`set_masters scope:'brand'`), they're inherited
automatically; for a deck-scope house style, `set_masters { deck_slug,
scope:'deck', masters }` now, and reference master ids in the outline notes so
generated slides opt in via `frontmatter.master`.

## Step 3 — generate

**Path A — you have an outline (preferred).** Generate slides directly from it. You
can pass the outline inline (map `outline.json` slides to the pipeline's outline
array shape) or, to let the pipeline shape it, first:

```
generate_outline { context, brandSlug, slideCount }   # returns outlineId + outline
generate_slides_from_outline { deck_slug, outlineId }  # or { deck_slug, outline }
```

**Path B — brief only.** Let the pipeline outline first:

```
generate_outline { context, brandSlug }                # auto best-fit slideCount
```

Show the returned outline to the user, let them tweak, THEN:

```
generate_slides_from_outline { deck_slug, outlineId }
```

Prefer generating from an outline the user has seen — it's cheaper to fix the story
before slides than after.

## Step 4 — validate every slide (free, deterministic)

Get the deck and run `check_slide` on each slide's MDX:

```
get_deck { slug: deck_slug }          # read back the generated slides + orders
check_slide { mdx_content, frontmatter }   # per slide
```

`check_slide` returns `{ valid, validation_errors, structure_errors, advisories,
balance }`. For any slide with `valid:false` or serious `balance.issues`:

- Fix the MDX yourself and `upsert_slides` the corrected slide at the same
  `slide_order`, OR use `rewrite_slide` if the copy itself needs to change.
- **Authoring rule (important):** `upsert_slides` strips inline styles and preset
  styles. Use the `deck-*` vocabulary classes only — never inline `style=` or
  arbitrary `text-[Npx]`. If unsure, call `get_authoring_guide topic='contract'`
  for the class vocabulary and `topic='components'` for the component catalog.
- Re-run `check_slide` after each fix until `valid:true`.

Use `slide_order` gaps of 10 (10, 20, 30…) so slides can be inserted later.

## Step 5 — render for review

```
render_slides { deck_slug }     # no format → opens the user-visible inline viewer
```

For your own inspection while fixing a specific slide, use
`render_slides { deck_slug, slide_orders:[N], format:'image' }` (the user can't see
those — they're for your eyes). Present the deck to the user with the plain
`render_slides { deck_slug }` call.

## Step 5.5 — quality gate (mandatory — this is what "done" means)

Run `deckcp-quality-control` on the finished deck. It scans the MDX for
off-palette colours, tiny text, spacing sprawl, repeated skeletons, and
generic-AI tells, then renders **every** slide and scores six dimensions
(brand accuracy, alignment, spacing consistency, visual polish, repetitive
layouts, generic-AI look) against the brand kit — and fixes what fails, up
to three passes.

Do not present the deck to the user as finished before it passes. If it
can't pass in three passes, the gate tells you which upstream skill to go
back to (`deckcp-brand-kit` or `deck-critique`) — do that instead of
shipping a deck you'd be embarrassed by.

## Step 6 — hand off

Summarize what you built (slide count, the spine, the brand kit it's built on,
the QC scorecard, anything `check_slide` or QC flagged and how you fixed it).
Then point onward:

> "Run `deck-critique` to pressure-test the narrative, `deckcp-gather-assets` to
> swap in your real photos, or `deckcp-share` to send it out."

## Guardrails

- Never fabricate proof or numbers to fill a slide. If the brief has none, the slide
  says so or is cut — flag it to the user.
- Fix the story before the slides. A clean render of a weak outline is still a weak
  deck.
- Keep tokens low: don't paste full slide MDX back to the user; report by headline.
- Never generate on an empty brand, and never call a deck done that hasn't
  passed `deckcp-quality-control`. Those two rules are the difference between
  a deck and a template.
