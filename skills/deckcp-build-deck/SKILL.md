---
name: deckcp-build-deck
description: Build a real DeckCP deck from a brief or outline — establish the brand kit, run design direction, generate or author slides from a binding per-slide art-direction plan, validate each one, render, and run the quality-control gate before calling it done. Use when the user says "build the deck", "make the slides", "turn this into a DeckCP deck", or after deck-interview/deck-outline. Requires the DeckCP MCP connected.
argument-hint: "[--deck <slug>] [--brand <slug>]"
---

# Build Deck (DeckCP MCP orchestration — minimal tokens)

Drive the DeckCP build pipeline end to end: brief/outline → **brand kit** →
**design direction + slide plan** → generate/author → check → render →
**quality gate**. This skill is orchestration: server generation is useful, but
it must not be asked to invent the deck's visual language from scratch.

Three steps are not skippable:
1. `deckcp-brand-kit` **before** design/generation;
2. `deckcp-design-director` **before** slides, producing binding art direction;
3. `deckcp-quality-control` **after** rendering.

The build mode decides how much freedom the server pipeline gets:
`fast`, `brand`, or `reference-exact`.

## Why this is mostly orchestration

The heavy generation can run server-side inside DeckCP (`generate_outline`,
`generate_slides_from_outline`). `check_slide` is a deterministic validator.
But **visual judgment now happens before generation**, in `deckcp-design-director`,
so the server receives a concrete design brief instead of vague brand prose.
Main-loop judgment is also used for `reference-exact` authoring decisions and the
final render-and-look QC. Keep tokens low everywhere else.

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

## Step 0.75 — design direction (mandatory, before slides)

```bash
```

- **Both exist** → use them.
- **Either is missing** → run `deckcp-design-director` now. It reads the outline +
  brand kit and writes the deck-level creative direction plus a binding art-direction
  packet for every slide.

Do not skip this because `brand-kit.json` already contains design language. The kit
describes the brand; the design director decides how **this deck** composes, paces,
and expresses that brand.

The **Build mode.** line in `Art direction` controls Step 3:

- `fast` — constrained server generation.
- `brand` — constrained server generation with brand/system rules + slide plan.
- `reference-exact` — prefer measured masters + `deckcp-author-slides` / exact
  placement for slides where geometry is part of the requested match.

## Step 1 — assemble context from the deck doc + the brand kit

```
get_deck_doc{deck_slug}
```
```bash
cat ./deck-brief/brand-kit.json     # the brand/reference source of truth
```

- The doc's **`Slides`** section is the narrative source of truth: one
  `### N. Headline` per slide, with `point:` and the founder's plain-words
  `visual:` line.
- The doc's **`Art direction`** section is the per-slide composition source of
  truth — the archetype each `visual:` line maps to, plus the deck-level thesis
  and rhythm. `deckcp-design-director` writes it. If it is missing, run that
  first; do not invent compositions here.
- The doc's **`What it should look like`** names the real assets and what has to
  be *seen*. Use it before reaching for stock.
- `brand-kit.json` stays a JSON file deliberately: `check-kit.js` scores hex
  values, contrast ratios and type scales numerically, and it is the one
  artifact in this pipeline no human edits by hand.

Compose a tight generation `context` from audience, ask, problem, insight, solution,
proof, differentiation, and objections. Then append **three binding layers**:

```text
BRAND SYSTEM (binding)
- palette roles + exact hexes
- mapped display/body/script fonts
- structured design_system rules when present: margins, grid, spacing, type scale,
  imagery, containers, color jobs, data treatment, chrome, reference hard rules
- legacy guidelines/signature_device/structural_language/dont as fallback

DESIGN DIRECTION (binding)
- build mode
- visual thesis / brand character
- composition + typography + imagery + data strategy
- signature moves + restraint rules
- rhythm and intentional-repetition rule
- visual_strategy (mode + peaks/supporting/typography_led; outranks the mix, if present)
- visual_media_mix (directional, if present) + iconography_direction (if present)
- anti-patterns

SLIDE PLAN (binding)
For each slide: archetype, density, rhythm role, focal point, composition, hierarchy,
imagery/data treatment, accent job, master intent, repetition intent, avoid list,
and — when present — visual_intensity, plus visual_translation (needed, confidence, type,
concept, communication_job, priority).
```

Prefer `brand-kit.json.design_system` over prose when present. Do **not** dump the
JSON blindly; serialize the relevant rules compactly while preserving exact per-slide
art direction.

Read [`references/layout-archetypes.md`](references/layout-archetypes.md) for the
semantic archetype menu. **Purposeful repetition is allowed.** A repeated case-study
series is often more polished than three artificially different layouts.

**Non-English text renders — load the right font, don't romanize.** DeckCP's
renderer loads any Google font named as the **primary** family of a
`deck_theme` slot (not just the 35-face picker), so Korean, Japanese, Chinese,
Thai, Arabic, etc. all work once the matching **Noto** font is loaded. If the
brief/brand contains any non-Latin script:

1. From the brand kit's `fonts.scripts` (or by detecting the script in the
   content), pick the Noto face — Korean → Noto Sans KR, Japanese → Noto Sans
   JP, Chinese → Noto Sans SC/TC, Thai → Noto Sans Thai, Arabic → Noto Sans
   Arabic (full table in `deckcp-brand-kit` references/multilingual-fonts.md).
2. **Before generating**, load it: `update_deck { deck_theme: { fontHeading:
   "'Noto Sans KR', 'Open Sans', sans-serif" } }` (a loader slot), or make it
   the deck's body/display font for a mostly-non-Latin deck.
3. Tell the pipeline, in the context: the non-Latin text stays (bilingual is
   fine), and text containing that script must use `fontFamily: "'Noto Sans
   KR', <brand>, sans-serif"`. The ₩/฿/₹ currency glyphs render in the Noto
   face, so keep them.

Only romanize if the user *asks* for it. `deckcp-quality-control` verifies each
script has its font loaded and shows real glyphs on the render.

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
  describes (e.g. building a client-branded deck on a shared house brand), `deck_theme`
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

**Build source-derived masters before generating.** If
`brand-kit.json.design_system.chrome.enabled` is true (or the legacy `chrome`
field clearly describes a repeating frame), build/reuse the relevant master now.
It may contain a title frame, section label, footer, logo, rail, watermark, or other
source-derived invariant. If chrome is disabled, do **not** invent one.

If the kit installed brand masters (`set_masters scope:'brand'`), inherit them.
For deck-scope styling, set the needed masters now and map semantic master ids from
`Art direction` to available DeckCP master ids.

## Step 3 — build according to `build_mode`

Read the **Build mode.** line in `Art direction`.

### Path A — `fast`

Use the normal pipeline, but pass the binding brand + direction + slide-plan context.
Map the doc's `Slides` directly, or use `generate_outline` only when
the server needs an outline id. Then:

```
generate_slides_from_outline { deck_slug, outlineId }
# or { deck_slug, outline }
```

### Path B — `brand`

Use the server pipeline, but preserve each slide's `art_direction` in the outline or
context. Do not let a planned comparison become a generic feature-card grid, or a
planned image story become an icon inventory because that component is easier.

When the brand/reference is strong, generate 2–3 representative slides first and
render them. If they are already drifting, fix masters/context before generating the
rest. Catching system drift early is cheaper than repairing twelve slides.

### Path C — `reference-exact`

The target is "same design team," not merely "same colors."

1. Apply measured theme + source-derived masters from the brand kit.
2. Use server generation only where composition is flexible **and** the result respects
   the measured visual grammar.
3. For geometry-sensitive slides, route to `deckcp-author-slides`: author against the
   rendering contract using measured margins, type scale, positions, panels, image
   ratios, and master. Use `upsert_slides` for exact MDX.
4. Render representative slides early. If the server cannot hold the reference grammar,
   stop asking it to improvise and author those slides directly.

This path intentionally spends more judgment on fidelity.

### Path D — `template-fallback` (design_source: deckcp_template)

The Design Director chose a DeckCP template as the DESIGN VOCABULARY because no strong company design source existed. Instantiate it, then make it the company's and recompose it to the approved outline — **apply → adapt → recompose**:

1. **Apply.** `list_deck_templates` (filter by category if useful) → match the `template_id` the direction recorded (or re-match multi-dimensionally: genre, audience, brand personality, image availability, data density, tone, light/dark) → `get_deck_template { template_id }` to learn the vocabulary (theme, masters, typography, per-archetype treatments, closing pattern) → `apply_deck_template { template_id, title }`. This clones the template's design into a NEW deck and returns its `deck_slug` — use that deck from here on (do not also `create_deck`).
2. **Adapt to the brand.** The clone carries the template's theme + sample content. Apply the company's brand: `update_deck { deck_slug, deck_theme }` (+ `set_masters` if the direction defines masters), PRESERVING the template's design quality — do NOT mechanically recolor every neutral or replace all backgrounds; that destroys contrast, hierarchy, whitespace, and rhythm.
3. **Recompose to the outline.** The template is a vocabulary, NOT the content. Rewrite every slide with the company's evidence-bound content from the doc's `Slides` + `Art direction`; add, reorder, and delete slides so the deck matches YOUR plan — not the template's slide count, order, sample company, sample claims, sample metrics, sample images, or sample CTA. Map each of your slides onto the template's archetype whose treatment fits (hero, metric hero, chart/data, comparison, diagram, editorial split, section divider, closing). Remove every leftover sample slide.
4. Keep visual rhythm (peaks/pauses) and a distinct, intentional closing slide. Render 2–3 representative slides early to confirm the adaptation holds before doing the rest.

Assets still follow the decision tree in "Authentic assets & placeholders" below (authentic → mood stock via `search_stock_images` → non-image visual → placeholder).

### Existing-outline preference

Prefer an outline the user has seen. It is still cheaper to fix story before slides.
The new design layer does not change that.

## Step 3.5 — execute the visual translation (don't silently fall back to text)

The slide plan may carry, per slide, a `visual_translation` object (v0.8.1). When
`needed:true`, the builder must **attempt the described visual representation**, not quietly
emit a paragraph or bullet list instead.

- If `type` is `spatial-plan`, build a spatial diagram; `process`/`timeline`, a sequence;
  `data-viz`/`proportion-graphic`, a graphic where the shape IS the number; `map`/`cluster-map`,
  markers; `annotated-image`/`product-visual`, a framed image with callouts. The archetype
  variants in [`references/layout-archetypes.md`](references/layout-archetypes.md) map each one.
- The visual **inherits the brand language** — stroke, geometry, spacing, corners, type, color
  from `brand-kit.json.design_system` + `Art direction`. Prefer simple grammar; avoid
  the diagram clichés listed in `deckcp-design-director/references/visual-storytelling.md`.
- If `iconography_direction.enabled` is true and a slide legitimately uses icons, use that ONE
  style. If it is false or absent, do not introduce icons. **Icons are semantic, not
  decorative** — never an icon-in-a-circle grid to fill space.
- When `needed:false`, keep the slide typographic. Do **not** add a graphic to satisfy a mix
  ratio. `visual_media_mix` is a deck-level guard against accidental monotony, not a per-slide
  quota.

**Restraint — slide intent wins (v0.8.2).** Honor `visual_intensity` and
`visual_translation.confidence`, and let slide-level intent override the deck media mix:

- `visual_intensity: "typography-led"` → do **not** embellish the slide just because the deck
  contains diagrams/icons elsewhere. At most one subtle device. Slide intent beats the mix.
- `confidence: "high"` → execute the visual. `confidence: "medium"` → if the visual would add
  substantial complexity, prefer the simpler typography-led solution unless the plan marks the
  visual important (a `visual_peak` or `priority:"primary"`). `confidence: "low"` → default to
  restraint (typography-led). Absent confidence → treat as medium.
- Respect `visual_strategy`: build the planned **visual_peaks** as their intent specifies,
  keep **supporting_visuals** light (one pictogram/symbol/micro-chart, typography still
  dominant), and leave **typography_led** slides alone. `visual_strategy` outranks the mix.
- **Remove before adding:** before finalizing a slide, ask whether removing a visual element
  (a redundant icon, a duplicate label, an unnecessary container/line, a competing focal
  point) would make it stronger. Prefer subtraction. Use the least-complex intervention that
  communicates (typography → +one device → simple semantic visual → diagram → complex viz).

**Escalation when the server can't execute the visual accurately:**

1. do **not** silently replace the visual with a paragraph;
2. flag the visual requirement (note which slide + which `visual_translation`);
3. use precise authoring / `deckcp-author-slides` (`upsert_slides` with a slide tree) to build
   the diagram/spatial-plan/proportion-graphic directly;
4. do this especially in `brand` and `reference-exact` modes, where a dropped visual reads as
   drift.

Do **not** require manual authoring for every diagram — many will generate fine. Escalate only
when the server cannot achieve the intended visual communication. In `fast` mode, a simpler
visual (or an honest typographic fallback with the requirement flagged) is acceptable.

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

Run `deckcp-quality-control` on the finished deck. It scans the MDX, renders
**every** slide, reviews the deck as a sequence, and scores seven dimensions:
brand accuracy, **design-intent/reference fidelity**, alignment, spacing consistency,
visual polish, intentional rhythm/repetition, and generic-AI look. It fixes what
fails, up to three passes.

Do not present the deck to the user as finished before it passes. If it
can't pass in three passes, the gate tells you which upstream skill to go
back to (`deckcp-brand-kit` or `deck-critique`) — do that instead of
shipping a deck you'd be embarrassed by.

## Step 6 — hand off

Summarize what you built (slide count, the spine, brand kit, design direction,
build mode, QC scorecard, and anything `check_slide` or QC flagged/fixed).
Then point onward:

> "Run `deck-critique` to pressure-test the narrative, `deckcp-gather-assets` to
> swap in your real photos, or `deckcp-share` to send it out."

## Authentic assets & placeholders (decision tree)

When a slide's art direction calls for a visual
(`asset_status: placeholder` in the slide plan, or an art-direction
requirement you can't satisfy with a real asset), work the tree in order:
**AUTHENTIC → mood STOCK → non-image visual → placeholder.**

- Prefer the authentic asset: use one the doc's `What it should look like` names, or
  acquire it (`fetch_page` a product/customer page → `upload_asset` the image;
  `import_source` a document). If a chart/diagram/text-led treatment communicates
  the idea better, use that instead.
- If the image is EDITORIAL/MOOD/CONTEXT/LIFESTYLE (atmosphere, not factual
  proof), use real stock: `search_stock_images { query }` → `upload_asset
  { source_url }` (that upload fires Unsplash's required attribution ping).
  **Hard rules:** never present a stock screenshot/mockup as the company's actual
  product (product proof needs authentic product UI or a product-screenshot
  placeholder), and never label a stock person as a real founder, employee,
  customer, or investor.
- If it genuinely can't be acquired, build a **polished, intentional placeholder
  inside the intended composition** — the correct crop/aspect ratio, preserved
  spacing and layout, a concise label of the expected asset (e.g. `[ PRODUCT
  SCREENSHOT ] Current search-results experience · 16:9 · official product
  page`), easy to replace later. Never a broken-image look, never generic stock.
- **Asset-gap ≠ evidence-gap:** do NOT hold an otherwise-evidenced slide just
  because an optional image is missing — build it with the placeholder. Only
  hold for missing *facts* (content preflight), not missing *pictures*.
- When done, tell the user concisely which slides carry placeholders and what to
  drop in (e.g. "3 slides have intentional placeholders for company assets that
  weren't available"). Don't interrupt generation to ask about an unavailable
  asset. Full contract: `get_deck_playbook`.

## Guardrails

- Never fabricate proof or numbers to fill a slide. If the brief has none, the slide
  says so or is cut — flag it to the user.
- Fix the story before the slides. A clean render of a weak outline is still a weak
  deck.
- Keep tokens low: don't paste full slide MDX back to the user; report by headline.
- Never generate on an empty brand, never skip design direction, and never call
  a deck done that hasn't passed `deckcp-quality-control`.
- Never force layout variety for its own sake. Repetition is valid when the slide
  plan marks it as intentional.
- Never impose a universal DeckCP chrome. Masters come from the active brand/reference.
- Never drop a required `visual_translation` to a paragraph without flagging it and
  attempting precise authoring. And never force a graphic, icon, or diagram onto a
  `needed:false` / `typography-led` slide — typography-led is a valid outcome, and slide
  intent + `visual_strategy` outrank the deck media mix. When in doubt at `confidence:"low"`
  or `"medium"`, prefer the simpler composition and remove before adding.
