---
name: deckcp-build-deck
description: Build a real DeckCP deck from a brief or outline — establish the brand kit, run design direction, generate or author slides from a binding per-slide art-direction plan, validate each one, render, and run the quality-control gate before calling it done. Use when the user says "build the deck", "make the slides", "turn this into a DeckCP deck", or after deck-interview/deck-outline. Requires the DeckCP MCP connected.
argument-hint: "[--brief ./deck-brief/brief.json] [--outline ./deck-brief/outline.json] [--brand <slug>] [--deck <slug>]"
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
cat ./deck-brief/design-direction.json 2>/dev/null
cat ./deck-brief/slide-plan.json 2>/dev/null
```

- **Both exist** → use them.
- **Either is missing** → run `deckcp-design-director` now. It reads the outline +
  brand kit and writes the deck-level creative direction plus a binding art-direction
  packet for every slide.

Do not skip this because `brand-kit.json` already contains design language. The kit
describes the brand; the design director decides how **this deck** composes, paces,
and expresses that brand.

`design-direction.json.build_mode` controls Step 3:

- `fast` — constrained server generation.
- `brand` — constrained server generation with brand/system rules + slide plan.
- `reference-exact` — prefer measured masters + `deckcp-author-slides` / exact
  placement for slides where geometry is part of the requested match.

## Step 1 — assemble context from the story + design artifacts

Read the full handoff:

```bash
cat ./deck-brief/brief.json 2>/dev/null
cat ./deck-brief/outline.json 2>/dev/null
cat ./deck-brief/brand-kit.json
cat ./deck-brief/design-direction.json
cat ./deck-brief/slide-plan.json
```

- `outline.json` remains the narrative source of truth.
- `brand-kit.json` is the brand/reference source of truth.
- `design-direction.json` is the deck-level creative source of truth.
- `slide-plan.json` is the per-slide composition source of truth.

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
- anti-patterns

SLIDE PLAN (binding)
For each slide: archetype, density, rhythm role, focal point, composition, hierarchy,
imagery/data treatment, accent job, master intent, repetition intent, avoid list.
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
`slide-plan.json` to available DeckCP master ids.

## Step 3 — build according to `build_mode`

Read `design-direction.json.build_mode`.

### Path A — `fast`

Use the normal pipeline, but pass the binding brand + direction + slide-plan context.
If `outline.json` exists, map its slides directly or use `generate_outline` only when
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

### Existing-outline preference

Prefer an outline the user has seen. It is still cheaper to fix story before slides.
The new design layer does not change that.

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
