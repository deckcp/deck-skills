---
name: deckcp-design-director
description: Expand the founder's plain-words visual lines into a binding visual direction and per-slide art direction BEFORE slide generation. Use after /deck stage 3 + deckcp-brand-kit, or whenever a deck has a strong reference and must feel intentionally designed rather than merely on-brand. Writes the deck doc's 'Art direction' section.
argument-hint: "[deck-slug] [--kit ./deck-brief/brand-kit.json]"
---
# Design Director (brand system → art direction → slide plan)

A brand kit tells you **what the brand is**. This skill decides **how this particular deck should express that brand**.

Do not generate slides yet.

The job is to convert narrative + brand/reference evidence into two binding artifacts:

- The deck doc's **`Art direction`** section — the deck-level creative direction
  followed by one block per slide, keyed by the same `### N` as `Slides`.

These files sit between `deckcp-brand-kit` and `deckcp-build-deck`. They remove the biggest source of generic output: asking the slide generator to invent composition, pacing, hierarchy, image treatment, density, and signature moves on its own.

## Core rule

**Specificity beats decoration.**

A polished deck is not "more visual elements." It is a sequence of deliberate choices that feel native to the company, audience, and story.

Before accepting a direction, ask:

> Could this exact deck direction be reused for a totally different company with only the logo and colors swapped?

If yes, it is still too generic. Tighten the design thesis until the answer is no.

## The Visual Translation Principle

For every slide, ask:

> Can any important idea on this slide be understood faster, more clearly, or more
> memorably through a visual representation instead of being explained only with words?

When the answer is yes, **translate the concept visually.**

Visual translation is not decoration. Its purpose is to:

- improve comprehension
- reveal structure
- show relationships
- make comparisons faster
- create memory
- reduce unnecessary text
- make abstract ideas tangible
- increase visual rhythm across the deck

A slide should remain **typography-led when typography is genuinely the strongest
communication method** — a single decisive claim, a hero number, a quiet turn. Never
force a graphic merely to satisfy a visual quota. The objective is not "add more
graphics"; it is "use the strongest communication medium for each idea."

## The Visual Restraint Principle (v0.8.2)

Visual translation has an equal and opposite duty: **restraint.** Before adding any
diagram, pictogram, icon system, process, map, spatial plan, illustration, or graphic
device, ask:

> Will this visual materially improve understanding, comparison, memory, evidence, or
> brand expression compared with a strong typography-led composition?

If not, **prefer typography.** Whitespace is not an unfinished area that needs filling — a
slide can be fully designed with only typography, hierarchy, color, composition, and space.
Do not add graphics because there is room.

**Don't visualize statements. Visualize structures.** A pure positioning line —
*"The counter is the restaurant.", "Take the counter seat.", "Luxury without ceremony."* —
is usually strongest as typography; it should not automatically trigger a diagram. Reach
for visual translation when the content carries a real **structure, relationship, sequence,
comparison, proportion, system, geography, process, piece of evidence, physical arrangement,
or quantitative pattern** — e.g. `18% kitchen / 82% dining` → proportion graphic;
`1 → 4 → 12 locations` → expansion visual; `seat → fire → first skewer → rhythm` → sequence.

Over-visualization is a generic-AI smell just as much as wall-of-text is. A professional
designer knows when **not** to add something. The full restraint gate (communication gain +
brand gain vs. complexity cost), the intervention hierarchy, and worked examples are in
[`references/visual-storytelling.md`](references/visual-storytelling.md).

The full decision tree — which representation fits physical, sequential, comparative,
geographic, categorical, quantitative, emotional, and abstract content — is in the same
reference. Read it before Step 4.5.

## Step 0 — load the truth

```
get_deck_doc{deck_slug}
```
```bash
cat ./deck-brief/brand-kit.json
```

If the doc's `Slides` section is empty, run `/deck` stage 3 first.
If `brand-kit.json` does not exist, run `deckcp-brand-kit` first.

**The founder has already decided the medium.** Each slide in `Slides` carries a
plain-words `visual:` line — "one big number, the $40k, nothing else on it",
"picture of the plant on the left, the three points on the right", "just the one
line". That line is **binding on medium** and advisory on composition. Your job
is to expand it, not to overrule it: map it to an archetype from
`layout-archetypes.md`, then decide the composition, focal point, hierarchy and
avoid-list the founder never has to think about. If a `visual:` line genuinely
cannot work, say so to the founder in one line and let them change it — do not
quietly build something else.

**Where your output goes:** the doc's `Art direction` section, via
`update_deck_doc{section:"Art direction", markdown}` — one block per slide plus
the deck-level thesis and rhythm. Not `design-direction.json`, not
`slide-plan.json`; those are gone. It is persisted rather than kept in context
because the QC pass has to score the built deck against this intent, possibly in
a later session.

Also inspect any user-provided reference deck/page renders recorded in the brand kit. If the brand kit says the reference was measured, treat those measured values as hard evidence, not inspiration.

Read these references before deciding:

- `references/design-principles.md`
- `references/art-direction-format.md`
- `references/anti-ai-aesthetics.md`
- `references/reference-fidelity.md`
- `references/visual-storytelling.md`
- `../deckcp-build-deck/references/layout-archetypes.md`

## Step 1 — classify the build mode

Record one of these as the **Build mode.** line in `Art direction`:

### `fast`
Use when the user has no reference deck and the brand kit is synthesized or lightly extracted from a logo/site only.

Goal: polished, distinctive, coherent. Server-side generation is acceptable when constrained by the direction + slide plan.

### `brand`
Use when the user has a meaningful brand system, real website, product UI, brand guide, or existing collateral.

Goal: clearly recognizable as the company, while still allowing new compositions. Server-side generation is acceptable only with the kit + design direction + per-slide art direction bound into context.

### `reference-exact`
Use when the user supplies a finished deck / design reference and explicitly wants the new deck to look like it came from the same design team.

Goal: preserve measured visual grammar — type scale, margins, chrome, image ratios, spacing, container behavior, alignment rhythm, and signature devices. For slides where geometry matters, prefer `deckcp-author-slides` / masters / exact placement over unconstrained server generation.

Do not pick `reference-exact` merely because a reference exists. Pick it when fidelity is the request.

### `template-fallback`
Use when there is **no strong design source** — no explicit user design reference, no existing company deck/template, no formal brand/presentation guide, and no GENUINELY rich company design evidence (a coherent layout/composition/type system, not merely colors + logo from a website). This is the design-source hierarchy: explicit reference → current company deck/template → formal brand guide → rich company design evidence → **DeckCP template library (this mode)**. A weak website design signal must NOT yield a weak deck.

Record **Design source.** `deckcp_template`. Adopt a DeckCP template as the DESIGN VOCABULARY (typography, grids, spacing, hero/metric/chart/diagram treatments, section + closing patterns, visual rhythm) — NOT as content. Match multi-dimensionally (genre, audience, brand personality, image availability, data density, tone, editorial/corporate/technical/lifestyle character, light/dark), never "investor → first pitch template". Record the chosen `template_id` and WHY it fits in `Art direction`. deckcp-build-deck (Tier 2) instantiates it via `list_deck_templates` → `get_deck_template` → `apply_deck_template`, then recomposes to your outline. Still write a real visual thesis below — the template grounds it; it does not replace it.

## Step 2 — write the visual thesis

Choose one **clear visual thesis** for the deck.

It must include:

- `name` — a short working name, e.g. `Editorial Precision`, `Quiet Technical Confidence`, `Cinematic Hospitality`.
- `one_line` — what makes the deck feel specific.
- `brand_character` — 3–5 adjectives grounded in source material.
- `composition_strategy` — how pages are generally constructed.
- `typography_strategy` — what typography does emotionally and structurally.
- `imagery_strategy` — how real imagery is used, or why the brand is intentionally non-photographic.
- `data_strategy` — how evidence and numbers are presented.
- `signature_moves` — 1–3 recurring moves that make the deck ownable.
- `restraint_rules` — what is deliberately *not* used.

A direction should sound like an art director's brief, not a moodboard generator.

Weak:

```text
Modern, premium, clean, minimal, uses brand colors.
```

Strong:

```text
Quiet technical confidence: near-empty paper surfaces, compact grotesk labels,
large evidence-led headlines, diagrams aligned to a strict 12-column grid,
and one cobalt accent reserved for the decisive number or connector.
```

## Step 3 — translate the brand kit into binding design rules

The brand kit may contain both legacy prose fields and the newer structured `design_system` object.

Prefer the structured object when present.

Translate it into deck-level decisions:

- page / surface behavior
- content margins and grid
- headline width and line count
- title/body size relationship
- paragraph width
- image coverage and crop behavior
- allowed container styles
- line / border / radius behavior
- accent color's single job
- logo frequency and placement
- chrome: what repeats, if anything
- section-divider behavior
- data / table / chart treatment
- low / medium / high density rules

**Chrome is not mandatory.** If the source has no repeating eyebrow/footer/frame, do not invent one. The invariant is consistency with the active design system, not a universal house style.

Also decide two deck-level visual-language calls now (both optional, both additive):

- **`visual_media_mix`** — directional ranges for how much of the deck is typography-led
  vs. photography vs. diagrammatic vs. data-viz vs. illustration/pictogram. These are
  **ranges to prevent accidental monotony, not quotas**. Choose the mix from the subject,
  audience, brand, reference, available assets, narrative, and deck type: a financial
  report leans data-viz, a fashion deck leans photography, a strategy deck leans diagrams,
  a hospitality deck may combine photography + spatial diagrams + menu visuals + type. Do
  not mechanically force every category into every deck.
- **`iconography_direction`** — if the deck uses icons/pictograms at all, define ONE
  consistent style (stroke, geometry, fill, color usage, container, corner language,
  detail level) plus an avoid-list. If icons are not appropriate, set `enabled:false`.
  Icons are never required, and iconography is normally a **supporting** medium, not a
  slide's default concept. See the "Icons are semantic, not decorative" rule below.
- **`visual_strategy`** (v0.8.2, the most important of the three) — pick a deck `mode`
  (`minimal` / `selective` / `visual-rich`; **default `selective`**, never default to
  `visual-rich`) and name the slides that are the deck's **visual_peaks**, its light
  **supporting_visuals**, and its **typography_led** pauses. Plan visual *peaks*, not visual
  *coverage*: decide which few slides earn a visual, and let the rest breathe. This object
  outranks `visual_media_mix` — the mix prevents accidental monotony, but the strategy
  decides where visuals actually go. Do not chase mix percentages by adding a chart/diagram/
  icon/photo just to hit a category.

The format — and which lines the build and QC skills actually read — is in [`references/art-direction-format.md`](references/art-direction-format.md).

## Step 4 — plan deck rhythm before individual layouts

Read the headline spine in the doc's `Slides` section.

Assign each slide a `rhythm_role`:

- `open` — establishes the visual world
- `build` — moves the argument forward
- `explain` — makes a mechanism, format, or relationship understandable (often a visual translation)
- `proof` — evidence-heavy
- `pause` — low-density visual breathing room
- `turn` — section or argument shift
- `peak` — most important reveal / number / claim
- `close` — resolves into the ask

Plan the whole sequence first. The contact-sheet view should have rhythm.

**Do not force novelty slide by slide.** Repetition is useful when it communicates comparison, a series, or a deliberate chapter pattern.

Bad rule:

```text
Never use the same layout twice in a row.
```

Better rule:

```text
Never repeat a layout accidentally. Repeat it intentionally when the repetition
creates comparison, sequence, recognition, or rhythm.
```

## Step 4.5 — plan the visual translation for every slide

Before you pick a layout, decide **what each slide's key idea should become**. Walk the
decision tree in [`references/visual-storytelling.md`](references/visual-storytelling.md)
and, for every slide, fill a `visual_translation` object in the slide plan:

```json
"visual_intensity": "visual-led",
"visual_translation": {
  "needed": true,
  "confidence": "high",
  "type": "spatial-plan",
  "concept": "counter seating arranged around a central charcoal grill",
  "communication_job": "make the restaurant operating format understandable instantly",
  "source": "spatial",
  "priority": "primary"
}
```

- `visual_intensity` (per slide) — `typography-led` (type/space/hierarchy do the work; at most one subtle device) · `supported` (typography dominates, one pictogram/small diagram/symbol/micro-chart aids comprehension) · `visual-led` (the visual carries the core message). **Do not let every slide become `visual-led`.**
- `type` — `photography | pictogram | iconography | diagram | process | timeline | map | spatial-plan | data-viz | proportion-graphic | illustration | annotated-image | product-visual | symbol | none`
- `confidence` (v0.8.2) — `high` (visual clearly improves the slide → execute it) · `medium` (a visual *may* help but a typographic version may be equally good → compare both, and if the visual adds real complexity, prefer typography unless it's marked important) · `low` (technically visualizable, small gain → default to typography-led).
- `source` — `concept | data | process | geography | product | people | spatial | comparison | sequence | categorical | brand | none`
- `priority` — `primary | supporting | optional`

**Run the restraint gate before setting `needed:true`** (full version in
[`references/visual-storytelling.md`](references/visual-storytelling.md)): execute the visual
only when *communication gain + brand gain > complexity cost*. Then set `visual_intensity`
and `confidence` to record that judgment. Use the least-complex intervention that works
(typography → +one device → simple semantic visual → diagram/pictogram → complex viz), and
before finalizing ask *"would removing a visual element make this slide stronger?"*

Be **concrete about the visual idea**. Not "use icons", "add diagram", "make visual" —
instead: *"show four counter seats surrounding a central grill as a simple top-down spatial
diagram"* or *"show expansion from one flagship to four city clusters to twelve locations as
progressively multiplying site markers."*

When typography genuinely is the strongest medium, set `visual_intensity:"typography-led"`
and `needed:false` and move on — a statement, a hero number, or a quiet close does not owe
anyone a graphic:

```json
"visual_intensity": "typography-led",
"visual_translation": {
  "needed": false, "confidence": "low", "type": "none", "concept": null,
  "communication_job": null, "source": "none", "priority": "optional"
}
```

Then sanity-check the whole set against `visual_media_mix`: if nearly every slide came out
`needed:false` on a subject that is full of processes, places, and comparisons, you are
letting the deck drift text-led by accident — revisit the ones where a visual would
genuinely help. If you find yourself adding `needed:true` to slides just to hit a ratio,
you are forcing decoration — stop.

## Step 5 — assign semantic archetypes

Use the archetype menu in `../deckcp-build-deck/references/layout-archetypes.md`.
The archetype should **realize the visual translation** from Step 4.5: a `spatial-plan`
translation → `spatial-explainer` / `annotated-visual`; a `process`/`sequence` → `media-steps`
/ `timeline` / `visual-sequence`; a `comparison` → `comparison` / `proportion-graphic`; a
`map` → `map / footprint` / `cluster-map`; a `data` translation → `chart / data insight`.

Pick the archetype based on the communication job, not because the deck "needs variety."

Examples:

- one decisive number → `statement` or `big-stat`
- multiple comparable metrics → `stat-row`
- before/after or us/them → `comparison`
- process with temporal order → `timeline` or `media-steps`
- actual rows × columns → `table`
- one emotional brand point → `image-story`
- repeated case studies → same `case-study` archetype is allowed and often preferable

## Step 6 — assign a density budget

Every slide gets:

- `low` — one idea, one focal point, minimal supporting copy
- `medium` — 2–4 content units or image + explanation
- `high` — table/chart/dashboard/evidence-dense; requires disciplined hierarchy

If the outline content does not fit its density budget, change the slide structure now. Do not shrink typography later to rescue an overstuffed slide.

## Step 7 — write the deck-level half of `Art direction`

Use the format in `references/art-direction-format.md`.

Minimum shape:

```json
{
  "build_mode": "fast | brand | reference-exact",
  "direction": {
    "name": "",
    "one_line": "",
    "brand_character": [],
    "composition_strategy": "",
    "typography_strategy": "",
    "imagery_strategy": "",
    "data_strategy": "",
    "signature_moves": [],
    "restraint_rules": []
  },
  "binding_rules": {
    "accent_job": "",
    "chrome_behavior": "",
    "grid_behavior": "",
    "density_default": "medium",
    "intentional_repetition": "",
    "reference_fidelity": []
  },
  "visual_strategy": {
    "mode": "selective",
    "visual_peaks": [],
    "supporting_visuals": [],
    "typography_led": [],
    "rationale": ""
  },
  "visual_media_mix": {
    "typography_led": "30-45%",
    "photography": "10-25%",
    "diagrammatic": "15-30%",
    "data_visualization": "10-20%",
    "illustration_or_pictogram": "5-20%"
  },
  "iconography_direction": {
    "enabled": true,
    "style": "minimal custom pictogram",
    "stroke": "medium",
    "geometry": "angular and architectural",
    "fill": "mostly outline with occasional solid accent",
    "color_usage": "primary foreground plus accent only for emphasis",
    "container": "none",
    "corner_language": "sharp",
    "detail_level": "low",
    "avoid": ["icons inside circles", "generic corporate icon libraries", "mixed icon styles", "emoji", "3D icons", "decorative icons with no semantic job"]
  },
  "anti_patterns": []
}
```

`visual_strategy`, `visual_media_mix` and `iconography_direction` are **optional and
additive** — omit them for a purely typographic deck, or set `iconography_direction.enabled:
false` when icons are not appropriate. When absent, assume `visual_strategy.mode: selective`.
They exist to plan visual peaks and prevent accidental monotony, never to force categories.

## Step 8 — write the per-slide half of `Art direction`

For every slide in `Slides`, add a block under the same `### N` heading. Do NOT copy the narrative fields — they already live in `Slides` and duplicating them lets the two drift apart.

Minimum packet:

```json
{
  "n": 4,
  "purpose": "proof",
  "headline": "Dinner economics create unusually strong unit margins",
  "visual": "photo",
  "visual_intensity": "visual-led",
  "visual_translation": {
    "needed": true,
    "confidence": "high",
    "type": "data-viz",
    "concept": "kitchen footprint is a small share of floor area vs. the industry norm",
    "communication_job": "make the margin advantage visible, not just stated",
    "source": "data",
    "priority": "primary"
  },
  "art_direction": {
    "archetype": "big-stat",
    "density": "low",
    "rhythm_role": "peak",
    "focal_point": "the decisive footprint number",
    "composition": "hero number left; a simplified floor-plan proportion graphic right; no cards",
    "hierarchy": ["headline", "hero number", "proportion graphic", "supporting note"],
    "imagery_treatment": "none",
    "data_treatment": "one hero number + a proportion graphic that IS the proof, not decoration",
    "accent_job": "the highlighted proportion only",
    "master": "content-editorial",
    "repetition_intent": null,
    "avoid": ["three equal cards", "generic icon row", "a chart with axes the point doesn't need"]
  }
}
```

`visual_translation`, `visual_intensity` and `visual_translation.confidence` are optional and
additive — a slide plan that omits them stays valid; `needed:false` / `typography-led` is a
first-class choice, and an absent `visual_intensity` is read as `supported` at most, never
forced to `visual-led`.

**`art_direction` decides how meaning is represented, not just how the page is laid out.**
Describe the visual idea concretely (as in Step 4.5); a `composition` that says
"large time metric left; sequential visual journey across the remaining canvas" is buildable,
while "make it visual" is not.

The packet must be concrete enough that another capable designer could build the page without inventing its core composition.

## Step 9 — self-critique before handing off

Review the planned deck in headline order and ask:

1. Does the visual thesis clearly belong to this brand and story?
2. Is there a coherent deck rhythm when viewed as thumbnails?
3. Are the strongest claims getting the strongest visual treatment?
4. Is every slide's focal point obvious?
5. Are repeated layouts intentional?
6. Are any slides overstuffed before generation even starts?
7. Did any generic AI pattern sneak in because it was easy?
8. For `reference-exact`, are measured reference rules explicitly represented?
9. **Visual opportunity:** is any slide explaining in words something that would be
   materially clearer, faster, or more memorable as a visual? If so, set its
   `visual_translation.needed:true` with a concrete concept. Conversely, did any slide get a
   graphic it doesn't need? Remove it.
10. **Visual rhythm:** viewed as thumbnails, is the deck accidentally one medium (all type,
   all cards)? Does each major section offer a different visual experience? Adjust the plan,
   not by quota, but where a medium genuinely serves the content better.
11. **Visual restraint (v0.8.2):** the opposite check — is any slide *more visually complex
   than its communication task requires*? Did a pure statement get a diagram it didn't earn?
   Are three or four list items forced into a bespoke icon system? Would **removing** a
   visual element make the slide stronger? Downgrade those to `supported` or `typography-led`.
   The deck should have visual **peaks and pauses**; too many consecutive `visual-led` slides
   read as an infographic — thin them unless the content genuinely requires the density.

Fix the plan now. This is cheaper than fixing rendered slides.

## Step 10 — route

Next: `deckcp-build-deck`.

The build skill must treat `Art direction` as a **binding input**, not an optional suggestion — and must treat the founder's own `visual:` line in `Slides` as binding above it.

## Icons are semantic, not decorative

Never add an icon merely because text looks lonely. Use iconography when it:

- improves scanning
- represents a concept
- distinguishes categories
- clarifies a process
- creates a reusable symbolic language
- helps comparison
- improves navigation

Do **not** default to: icon-in-a-colored-circle; icon above heading above paragraph;
icon-card grids; repeated generic line icons; unrelated decorative symbols; emoji;
illustrations that compete with the message. If an icon does not improve meaning, remove it.
When the deck does use icons, they follow one `iconography_direction` — not a mix of styles.

**Iconography is normally a *supporting* medium, not a slide's default concept.** Use icons
only when they improve scanning, several categories genuinely need distinction, and the
symbol set can be coherent. When simple text is clearer, use text. Do not build a bespoke
icon system just because a slide happens to contain three or four items — that is the
over-visualization the restraint gate exists to catch.

## Text disguised as design

A slide is not visually rich merely because it contains a large number, a colored rule, a
table, a divider, a box, or a large headline. Those can all be excellent design elements —
but they are **typographic composition**, not **visual representation**. A strong deck uses
both, deliberately. Distinguish the two when planning:

- **Typographic composition** — scale, weight, spacing, alignment, one accent, whitespace.
  Correct for statements, hero numbers, quotes, quiet turns.
- **Visual representation** — a diagram, spatial plan, process, map, proportion graphic,
  annotated image, or photograph that carries meaning the words would otherwise have to.

Do not penalize an intentionally typographic slide. But do not let the **whole deck** become
typography-led by accident: that is exactly what `visual_media_mix` and the Step 4.5 pass
guard against.

## Visual translation in practice (examples)

**A — Hospitality concept.** Weak: headline "The counter is the restaurant" over three body
lines (60–80 seats / open kitchen / premium casual). Stronger: keep the headline, add a
top-down schematic of a central grill surrounded by counter seating, and cut the body to the
essential operational facts. The format becomes *understood*, not *described*.

**B — Operating system.** Weak: `01 Training / 02 Sourcing / 03 Fit-out / 04 Playbook` as a
numbered list. Stronger — *only if it improves scanning and stays one consistent style* — a
small pictogram system (person/flame · crate/ingredient · room module · manual) under one
`iconography_direction`. If a consistent symbol set isn't worth it, the typographic list is
the right answer; do not force icons.

**C — Expansion.** Weak: `1 → 4 → 12` as text. Stronger: show the multiplication —
one location → four city clusters → twelve sites — as progressively multiplying site markers
or a cluster diagram, so growth is seen, not read.

**D — Unit economics.** Weak: `18%` with "of floor area is kitchen." Stronger: a simplified
floor plan with 18% of the footprint visibly highlighted. The metric becomes *proof*, not
decoration.

In every case the test is comprehension, not ornament: if the visual doesn't make the idea
land faster or stick harder, keep the typographic treatment.

## Guardrails

- Do not change the story merely to make a prettier deck. Route narrative problems back to `deck-outline` / `deck-critique`.
- Do not invent a brand gesture unsupported by a strong existing brand/reference in `reference-exact` mode.
- Do not make "premium" synonymous with beige, serif, gradients, dark navy, or rounded cards.
- Do not use novelty as a substitute for coherence.
- Do not let text density determine font size below legibility standards; restructure instead.
- Do not add imagery quotas when the brand is intentionally typographic, diagrammatic, or product-led.
- Do not force a visual translation, an icon, or a diagram onto a slide where typography is the strongest medium. `visual_translation.needed:false` is a valid, common answer.
- Do not turn visual translation into clutter: one clear visual idea per slide, built in the brand's language, beats several competing graphics.
