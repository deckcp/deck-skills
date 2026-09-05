---
name: deckcp-quality-control
description: The mandatory final gate before any DeckCP deck is called done — render every slide, review the whole deck as a sequence, score brand accuracy, design-intent/reference fidelity (including a visual-opportunity and a visual-restraint check), alignment, spacing consistency, visual polish, intentional rhythm/repetition, and generic AI-looking design, then fix what fails and re-score. Catches both under-designed (text-heavy) and over-designed (infographic) slides. Use automatically at the end of deckcp-build-deck and after any multi-slide edit. Requires the DeckCP MCP connected.
argument-hint: "[--deck <slug>] [--kit ./deck-brief/brand-kit.json] [--max-passes 3]"
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

Plus two named checks inside dimension 2 (design-intent / reference fidelity) and a
visual-rhythm read in the contact-sheet pass: `visual_opportunity_check` (v0.8.1 — catches
decks that drift accidentally text-led) and `visual_restraint_check` (v0.8.2 — catches
over-designed / infographic slides). Neither is an eighth score; they are opposite guardrails
that must not contradict — a deliberately typographic slide is never failed for lacking
graphics, and an earned visual peak is never failed for being visual.

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
```

Then:

```text
get_deck { slug }
get_brand { brand_slug }
```

Save `get_deck` JSON to `./deck-brief/deck.json` for the scanner.

Reference precedence for QC:

1. the slide's block in the doc's `Art direction` — what it was supposed to communicate and compositionally do
2. the deck-level half of `Art direction` — the visual thesis and build mode
3. `brand-kit.json.design_system` — structured brand/reference rules
4. legacy brand-kit prose fields
5. DeckCP brand lockdown only as a fallback

If no brand kit exists and the brand has no usable system, stop and run
`deckcp-brand-kit`. If the deck was built with no `Art direction` section, run
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
| Repeated layout skeletons | Investigate against the **Repetition.** note in `Art direction`; repeated case studies may be correct |
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

**Visual rhythm (v0.8.1).** Also read the deck as a mix of media, judged against
The **Media mix.** line in `Art direction` (when present):

- Is the deck dominated by one medium — every slide typography-only, or every slide a chart?
- Are diagrams / pictograms / data visuals / photography used where they genuinely help?
- Does each major narrative section offer a different visual experience?
- Is there purposeful alternation between typography, imagery, diagrams, data, whitespace,
  dense information, and visual pause?

Do **not** enforce numerical quotas mechanically, and do **not** flag a deck that is
intentionally typographic per its direction. Judge against `Art direction`: the failure
mode is *accidental* monotony, not a deliberate one.

**Peaks and pauses (v0.8.2).** The opposite deck-level failure is over-visualization. Read the
contact sheet against `visual_strategy` (mode + peaks/pauses): does the deck **breathe** — a
few visual peaks among typographic pauses — or does it exhaust the eye with a
`diagram / icons / diagram / icons …` cadence? If too many *consecutive* slides are
`visual-led`, raise it as an **advisory** unless the content genuinely requires that density.
Do not enforce a fixed alternation pattern; judge whether the sequence has rhythm. A deck that
is all-infographic is as much a generic-AI smell as a deck that is all-text.

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

Read `Art direction` — the deck-level half plus every slide's block.

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

#### `visual_opportunity_check` (v0.8.1 — a named check inside this dimension, not an 8th score)

For each slide, ask: *is this slide using text to explain something that would be materially
clearer, faster, or more memorable as a visual?* Record one of:

- **PASS** — no meaningful missed visual opportunity (typography is genuinely the strongest
  medium here, or the planned visual is present and working).
- **ADVISORY** — a visual might improve the slide, but the current approach is acceptable.
  Note it; do not lower the score for it.
- **FAIL** — the slide's `Art direction` block explicitly required a meaningful visual translation
  (`needed:true`) and the rendered slide **ignored it** (fell back to text), OR the textual
  treatment materially damages comprehension. A FAIL here caps this dimension at **≤3**.

**Hard guardrails for this check:**

- Never FAIL a typography-led slide merely for lacking graphics. If `visual_translation.needed`
  is `false` or absent, "no graphic" is correct by default.
- Only FAIL when (1) the plan explicitly required a visual translation and the build ignored it,
  or (2) comprehension is genuinely hurt by the text-only treatment.
- A slide that dropped its required visual is fixed by executing the visual (author it), not by
  adding decoration. See the fix table.

#### `visual_restraint_check` (v0.8.2 — the opposite check, also inside this dimension)

For each slide, ask: *is this slide more visually complex than its communication task
requires?* Record one of:

- **PASS** — visual complexity is justified (a genuine peak, or a clean typography-led slide).
- **ADVISORY** — the visual helps, but simplifying it would improve elegance. Note it; do not
  lower the score.
- **FAIL** — the slide uses unnecessary diagrams, pictograms, icons, containers, or graphic
  systems that reduce clarity versus a simpler composition: a pure statement given a diagram it
  didn't earn; three or four items forced into a bespoke icon set; icons duplicating adjacent
  text; competing focal points; decorative devices. A FAIL here caps this dimension at **≤3**.

Judge against `visual_strategy`, `visual_intensity`, and `visual_translation.confidence`:
a slide marked `typography-led` that sprouted graphics, or a `low`-confidence visual that
added clutter, is a restraint FAIL. Ask the remove-before-adding question — would removing an
element make it stronger?

**The two checks are opposite guardrails on one judgment and must not contradict:** never
FAIL a deliberately `typography-led` / `needed:false` slide on the *opportunity* check for
lacking graphics, and never FAIL a genuinely-earned `visual-led` peak on the *restraint* check
for being visual. Opportunity catches under-design; restraint catches over-design.

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

## Step 3.5 — content QC (the WHAT — a polished slide that is generic or unsupported still fails)

The seven dimensions above judge how the deck looks. This pass judges what it
says, using the checks from `get_deck_playbook` (call it for the deck's
`deck_type` if you don't already have the playbook). Run these on every
**substantive** slide (cover / dividers / close are exempt from specificity):

- **evidence_specificity** — is each factual claim backed by real evidence with a
  source? FAIL when a claim is asserted with no evidence/source, when a number
  appears with no provenance, or when a **high-stakes** claim (revenue,
  profitability, market size, users/customers, growth, transaction economics,
  market share, competition, regulatory) is presented as observed fact without an
  authoritative current source — it must be sourced, labeled inferred, or held
  (`evidence_gap`). A plausible inference asserted as fact is a FAIL.
- **company_specificity** — strip the company name: would this slide fit many
  unrelated companies? FAIL when yes (e.g. "Category-defining scale.", "A
  capital-light take-rate marketplace.", "Why <X> wins" + generic cards).
- **generic_ai_language** — does the copy prefer concrete mechanisms/metrics/
  behavior over abstract strategy words? FAIL when a challenged term is used where
  a concrete statement was available.
- **authentic_asset_use** — does the slide use the most authentic asset available
  (real product screenshots / company imagery) for its job? Judge against the
  decision tree AUTHENTIC → mood STOCK → non-image visual → placeholder.
  Legitimate MOOD/CONTEXT/LIFESTYLE stock (relevant, professionally cropped) is
  acceptable and NOT a failure. **Placeholders are NOT failures:** an
  intentional, labeled, editable placeholder (correct crop, preserved
  composition) for an authentic asset that couldn't be acquired is acceptable.
  FAIL when: generic stock stands in where an authentic asset was explicitly
  required; **a stock screenshot/mockup is passed off as the company's actual
  product** (product proof needs authentic product UI or a product-screenshot
  placeholder); **a stock person is labeled as a real founder/employee/customer/
  investor**; stock is irrelevant or badly cropped; a placeholder is
  unlabeled/ambiguous or destroys the layout; or the slide pretends a placeholder
  is real company material. Distinguish a missing ASSET (placeholder OK, the slide
  proceeds) from missing EVIDENCE (may require holding the slide).
- **slide_communication_job** — does the slide do exactly one clear job? FAIL on a
  title-card with an empty body, or a slide cramming several jobs.

A content FAIL is a real failure even at visual 5/5. **Fix content failures
upstream, not with decoration:** route to `deck-outline` / the content preflight
to rewrite the slide against available evidence (or cut it) — do not dress an
empty claim with a nicer layout. If the evidence genuinely isn't there, the
honest fix is a weaker-but-true slide, an `inferred`-labeled slide, or one fewer
slide — never a fabricated fact.

## Step 3.6 — deck-level visual QC (designed deck, not formatted documents)

Read the whole rendered deck once more against these deck-level checks (from
`get_deck_playbook`). Their purpose is to catch the dominant failure mode — a
deck that is correct and on-brand but reads as *formatted documents*, not a
*designed deck*. **"More visuals" ≠ "better":** restraint still applies — a
typography-led slide that is stronger is a PASS, and over-visualization fails the
peaks-and-pauses read above.

- Is this a DESIGNED deck or a set of formatted documents?
- Is there sufficient visual rhythm (peaks/pauses/density changes)?
- Are too many slides text-only?
- Are the same layouts repeating unintentionally?
- Are cards being used by default where another composition is stronger?
- Are available authentic/stock images being ignored?
- Are stock images relevant and professionally cropped?
- Are stock people represented honestly (never labeled as a real person)?
- Are placeholders intentional and integrated (not broken-image)?
- Is the closing slide genuinely intentional and distinct?
- Is there at least one memorable visual peak when the genre calls for it?
- Does the template system stay coherent after brand adaptation (contrast/
  hierarchy/rhythm intact)? — applies when `build_mode: template-fallback`.
- Is large whitespace intentional, not the result of an under-designed slide?

Record deck-level failures with the fix (recompose the layout, add a peak, adopt/
repair the template vocabulary, replace ignored assets, make the close distinct)
in the scorecard's deck-level observations, and fix them in Step 5.

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
| Generator ignored slide archetype/composition | rewrite with the slide's exact `Art direction` block; if it ignores again, hand-author the slide |
| Off-palette slide color | mechanical MDX/class swap to kit role |
| Rainbow card accents | reduce to the kit's explicit color jobs |
| Tiny text | restructure density; do not merely shrink more |
| Spacing sprawl | normalize to the kit spacing scale / allowed deck gap tokens |
| Accidental repeated skeleton | change the weakest slide to the semantic archetype in its art-direction packet |
| Intentional repeated series looks inconsistent | make the series **more** consistent, not more varied |
| Generic icon cards | convert to semantic list/table/process/media composition, using real assets where relevant |
| Required `visual_translation` dropped to text | build the planned visual (spatial-plan / process / proportion-graphic / map / annotated-image) in the brand's language via `deckcp-author-slides` / `upsert_slides`; do not "fix" it by adding decoration |
| Graphic/icon added to a `needed:false` slide | remove it; restore the intended typographic composition |
| Over-designed slide (bespoke icons for 3–4 items, diagram on a pure statement, duplicate/decorative devices, competing focal points) | apply the least-complex intervention: downgrade to `supported` or `typography-led`, remove the redundant element(s); simplify rather than restyle |
| Deck reads as all-infographic (too many consecutive `visual-led`) | convert the weakest peaks to typography-led pauses per `visual_strategy`; restore peaks-and-pauses rhythm |
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
