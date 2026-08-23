---
name: deckcp-quality-control
description: The mandatory final gate before any DeckCP deck is called done — render every slide, review the whole deck as a sequence, score brand accuracy, design-intent/reference fidelity, alignment, spacing consistency, visual polish, intentional rhythm/repetition, and generic AI-looking design, then fix what fails and re-score. Use automatically at the end of deckcp-build-deck and after any multi-slide edit. Requires the DeckCP MCP connected.
argument-hint: "[--deck <slug>] [--kit ./deck-brief/brand-kit.json] [--direction ./deck-brief/design-direction.json] [--plan ./deck-brief/slide-plan.json] [--max-passes 3]"
---
# Quality Control (the gate — pixels + intent, not generation success)

A deck is not done when generation returns. It is done when it has been rendered,
looked at, compared with the system it was supposed to follow, fixed, and rendered
again.

This gate is mandatory.

**Seven dimensions, each scored 1–5. Pass = every dimension ≥4 and zero blockers.**

1. Brand accuracy
2. Design-intent / reference fidelity
3. Alignment
4. Spacing consistency
5. Visual polish
6. Intentional rhythm / repetition
7. Generic-AI look

## Why this is mixed-tier

- **Script for mechanical scans.** Off-palette colors, tiny text, spacing-token sprawl,
  suspicious repeated skeletons, and common generic patterns are cheap to detect.
- **Main-loop judgment for pixels.** Whether a page feels composed, whether a reference
  was actually matched, whether repetition is intentional, and whether the deck has
  rhythm require visual judgment.
- **Recipes for fixes.** Use deck-wide theme/master fixes before per-slide rewrites.

## Step 0 — load all references, not just the palette

```bash
cat ./deck-brief/brand-kit.json 2>/dev/null
cat ./deck-brief/design-direction.json 2>/dev/null
cat ./deck-brief/slide-plan.json 2>/dev/null
```

Then:

```text
get_deck { slug }
get_brand { brand_slug }
```

Save `get_deck` JSON to `./deck-brief/deck.json` for the scanner.

Reference precedence for QC:

1. `slide-plan.json` — what this slide was supposed to communicate/compositionally do
2. `design-direction.json` — the deck-level visual thesis and build mode
3. `brand-kit.json.design_system` — structured brand/reference rules
4. legacy brand-kit prose fields
5. DeckCP brand lockdown only as a fallback

If no brand kit exists and the brand has no usable system, stop and run
`deckcp-brand-kit`. If the deck was built without `design-direction.json`, run
`deckcp-design-director` before calling the deck finished; otherwise there is no design
intent to evaluate.

## Step 1 — mechanical scan

```bash
node scripts/scan-deck.js ./deck-brief/deck.json --kit ./deck-brief/brand-kit.json --out ./deck-brief
```

The scanner remains useful, but some signals are **advisory rather than automatic
failures** now:

| Signal | How to interpret it |
| --- | --- |
| Off-palette colors / foreign color classes | Usually a real brand failure unless the kit explicitly allows the neutral |
| Missing / inconsistent master | Failure only when the design system says that master/chrome should repeat |
| Tiny text / overflow / dropped style props | Real technical / polish failure |
| Many gap/padding tokens | Likely spacing inconsistency |
| Repeated layout skeletons | Investigate against `slide-plan.json.repetition_intent`; repeated case studies may be correct |
| No photography | Failure only when imagery strategy calls for photography; not for intentionally type/UI/diagram-led systems |
| Icon-card / gradient patterns | Generic-AI warning unless explicitly supported by the active design system |

Also run `check_slide` on every slide:

```text
check_slide { mdx_content, frontmatter }
```

Record `valid:false`, structure errors, and `balance.issues`.

A clean scan is necessary, not sufficient.

## Step 2 — render every slide

```text
render_slides { deck_slug, format:'image' }
```

Open **every** slide image.

For non-Latin text, confirm every glyph renders correctly. Never "fix" missing glyphs
by deleting or romanizing the user's language; load/apply the correct Noto face.

## Step 2.5 — deck-level thumbnail / contact-sheet pass

Before grading individual pages, inspect the deck **as a sequence**. If the runtime can
show the renders together, use that thumbnail/contact-sheet view; otherwise mentally
scan the rendered slide set in order.

Look for deck-level problems that are easy to miss one slide at a time:

- every page has the same weight / density
- six generic card grids cluster together
- image rhythm disappears midway
- section turns are too weak or too frequent
- dark/light shifts feel random
- one slide is dramatically denser than its neighbors without narrative reason
- a repeated series fails to look like a deliberate series
- the deck begins with one design language and ends with another
- `reference-exact` geometry drifts over the sequence

Write 2–4 deck-level observations before scoring individual dimensions.

## Step 3 — score seven dimensions

### 1. Brand accuracy — does it belong to this company?

**5**
- palette colors are used in their intended jobs
- real logos/assets are used correctly
- mapped typography is consistent
- source-derived signature devices appear with restraint
- if chrome is enabled, its repeated geometry is consistent via masters
- if chrome is disabled, the deck does not invent one

**4**
- one minor neutral / accent-role inconsistency or one slightly off brand asset treatment

**≤3**
- wrong colors/fonts/logo variant
- generic replacement assets when real ones exist
- invented visual language conflicting with the brand/reference
- repeated chrome differs materially where it should be invariant

### 2. Design-intent / reference fidelity — did we build the deck we planned?

Read `design-direction.json` + the corresponding `slide-plan.json` packet for every slide.

**5**
- deck-level visual thesis is obvious
- planned focal point is obvious on every slide
- planned archetype/density/composition are respected or improved without changing intent
- typography, imagery, data, and accent behavior match the direction
- for `reference-exact`, measured hard rules are visibly honored: margins, headline geometry,
  spacing, image ratios, container behavior, chrome, and scale relationships

**4**
- one or two slides drift slightly but still clearly belong to the intended direction

**≤3**
- generator ignored the art-direction packets
- reference match is mostly colors/fonts while geometry is wrong
- planned low-density slides became card grids
- image-led slides became icon-led
- slide focal points are ambiguous

This dimension is the main defense against "the brand kit was correct but the deck still
looks nothing like the company."

### 3. Alignment — do edges and baselines resolve cleanly?

**5**
- alignment follows the active grid/reference
- repeated elements share exact baselines/edges
- panels and charts align with text
- no clipping/overlap/edge kissing

**4**
- one minor optical or baseline outlier

**≤3**
- wandering title positions
- inconsistent grid edges
- accidental centering/top alignment switches
- any overflow / collision

### 4. Spacing consistency — is there a deliberate rhythm?

**5**
- spacing follows the kit's structured spacing scale or measured reference
- same roles use same gaps/padding
- margins are consistent unless a deliberate full-bleed composition overrides them

**4**
- one spacing outlier

**≤3**
- arbitrary per-slide gaps
- inconsistent container padding
- crowded margins on some slides and floating content on others

### 5. Visual polish — would a senior designer sign it?

**5**
- clear hierarchy
- deliberate crops / product framing
- charts/tables legible at a glance
- no orphan/widow problems that visibly hurt composition
- no tiny text or accidental empty zones
- density feels intentional
- imagery presence follows the direction rather than a generic quota

**4**
- one awkward crop, wrap, or chart detail

**≤3**
- thin pseudo-cards with empty bottoms
- collapsed content in the center
- clipped table/chart
- tiny text
- emoji as design elements
- decorative icons substituting for real evidence/assets

### 6. Intentional rhythm / repetition — does the sequence feel composed?

Do **not** score by a simplistic "no two consecutive layouts" rule.

**5**
- density rises/falls intentionally
- strongest claims receive strongest visual emphasis
- repeated layouts clearly serve comparison/series/rhythm
- chapter turns and pauses occur when the story needs them
- no skeleton dominates merely because it is the generator's favorite

**4**
- one stretch feels slightly repetitive or one transition is weak

**≤3**
- accidental three-in-a-row generic skeletons
- all cards / all bullets / all same-dark-panel
- random novelty where repeated structure would be clearer
- a repeated case-study series changes layout for no reason

The server `deck_variety` score is a clue, not the verdict.

### 7. Generic-AI look — could this have been made for any company?

**5**
- visual choices are source/content-specific
- restraint is evident
- composition does more work than decoration
- no obvious generic motif dominates

**4**
- one defensible generic pattern that does not overwhelm the system

**≤3**
- repeated equal rounded cards
- purple/dark glows without brand evidence
- generic three-column feature slides
- stock-metaphor icons
- arbitrary pills / title underlines / stripes
- centered-everything
- vague buzzword headlines
- "premium" expressed mainly as beige + serif with no brand reason

## Step 4 — write the scorecard

`./deck-brief/qc-report.md`:

```markdown
# Deck QC

## Deck-level observations
- ...

| Dimension | Score | Worst slide | Why |
| --- | ---: | --- | --- |
| Brand accuracy |  |  |  |
| Design-intent / reference fidelity |  |  |  |
| Alignment |  |  |  |
| Spacing consistency |  |  |  |
| Visual polish |  |  |  |
| Intentional rhythm / repetition |  |  |  |
| Generic-AI look |  |  |  |
```

## Step 5 — fix failures with the cheapest correct tool

Work deck-wide first, then per-slide.

| Failure | Fix |
| --- | --- |
| Wrong accent/fonts/mood deck-wide | `update_deck { deck_theme:{…} }`, then full refresh render |
| Source-derived chrome should repeat but drifts | build/fix the appropriate master, opt intended slides into it |
| Chrome was invented but kit says none | remove the unnecessary master/decor rather than normalizing it |
| Reference geometry drifts | use measured rules; author geometry-sensitive slides via `deckcp-author-slides` / `upsert_slides` |
| Generator ignored slide archetype/composition | rewrite with the exact `slide-plan.json.art_direction`; if it ignores again, hand-author the slide |
| Off-palette slide color | mechanical MDX/class swap to kit role |
| Rainbow card accents | reduce to the kit's explicit color jobs |
| Tiny text | restructure density; do not merely shrink more |
| Spacing sprawl | normalize to the kit spacing scale / allowed deck gap tokens |
| Accidental repeated skeleton | change the weakest slide to the semantic archetype in its art-direction packet |
| Intentional repeated series looks inconsistent | make the series **more** consistent, not more varied |
| Generic icon cards | convert to semantic list/table/process/media composition, using real assets where relevant |
| No imagery but direction requires it | use user/approved imagery via `deckcp-gather-assets` / `search_assets` |
| Imagery added but direction is intentionally typographic/UI-led | remove decorative photography |
| Buzzword/topic-label title | rewrite to the specific conclusion; route story weakness to `deck-critique` |
| Non-Latin glyphs fail | load/apply matching Noto font; never romanize unless requested |
| Chart/shell accent hardcoded wrong | hand-author or fix source theme/master rather than trusting `rewrite_slide` |
| Overflow/collision | follow authoring contract; re-budget content or split it |

After every per-slide write:

```text
check_slide → render that slide → look
```

After deck-wide writes:

```text
render_slides { refresh:true }
```

Then re-run the mechanical scan.

**Rewrite serially, not in a parallel burst** if the server-side copilot is rate-limited.

## Step 6 — max three passes

Three QC passes maximum.

If the deck still fails, diagnose upstream:

- wrong / incomplete brand system → `deckcp-brand-kit`
- weak / generic art direction → `deckcp-design-director`
- wrong story / too much content → `deck-outline` or `deck-critique`
- server cannot hold a reference-exact system → `deckcp-author-slides` for the affected pages

Do not grind endlessly on local symptoms.

## Step 7 — final render + report

After the last write, render **every slide again**. Re-score all seven dimensions.

Then show the user-visible deck:

```text
render_slides { deck_slug }
```

Report:

- PASS / NOT PASSED
- seven scores
- three most visible improvements
- any remaining blocker and the upstream skill that owns it

## Guardrails

- Never report done without a render after the last write.
- Every slide, every pass. Sampling is how one broken slide ships.
- The scanner is evidence, not taste. Do not turn its repetition heuristics into universal design law.
- Do not fix story problems with decorative design.
- Do not widen scope with new slides/reordering unless the upstream narrative step explicitly calls for it.
- The bar is: does this look deliberately designed for **this** brand/story/reference, not merely "better than before"?
