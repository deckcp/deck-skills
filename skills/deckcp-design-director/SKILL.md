---
name: deckcp-design-director
description: Turn a finished story outline + brand kit into a binding visual direction and per-slide art-direction plan BEFORE slide generation. Use after deck-outline + deckcp-brand-kit, or whenever a deck has a strong reference and must feel intentionally designed rather than merely on-brand. Emits design-direction.json + slide-plan.json.
argument-hint: "[--outline ./deck-brief/outline.json] [--kit ./deck-brief/brand-kit.json] [--out ./deck-brief]"
---
# Design Director (brand system → art direction → slide plan)

A brand kit tells you **what the brand is**. This skill decides **how this particular deck should express that brand**.

Do not generate slides yet.

The job is to convert narrative + brand/reference evidence into two binding artifacts:

- `./deck-brief/design-direction.json` — the deck-level creative direction.
- `./deck-brief/slide-plan.json` — one art-direction packet per slide.

These files sit between `deckcp-brand-kit` and `deckcp-build-deck`. They remove the biggest source of generic output: asking the slide generator to invent composition, pacing, hierarchy, image treatment, density, and signature moves on its own.

## Core rule

**Specificity beats decoration.**

A polished deck is not "more visual elements." It is a sequence of deliberate choices that feel native to the company, audience, and story.

Before accepting a direction, ask:

> Could this exact deck direction be reused for a totally different company with only the logo and colors swapped?

If yes, it is still too generic. Tighten the design thesis until the answer is no.

## Step 0 — load the truth

Read:

```bash
cat ./deck-brief/brief.json 2>/dev/null
cat ./deck-brief/outline.json
cat ./deck-brief/brand-kit.json
```

If `outline.json` does not exist, run `deck-outline` first.
If `brand-kit.json` does not exist, run `deckcp-brand-kit` first.

Also inspect any user-provided reference deck/page renders recorded in the brand kit. If the brand kit says the reference was measured, treat those measured values as hard evidence, not inspiration.

Read these references before deciding:

- `references/design-principles.md`
- `references/slide-art-direction-schema.md`
- `references/anti-ai-aesthetics.md`
- `references/reference-fidelity.md`
- `../deckcp-build-deck/references/layout-archetypes.md`

## Step 1 — classify the build mode

Write one of these into `design-direction.json.build_mode`:

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

## Step 4 — plan deck rhythm before individual layouts

Read the headline spine in `outline.json`.

Assign each slide a `rhythm_role`:

- `open` — establishes the visual world
- `build` — moves the argument forward
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

## Step 5 — assign semantic archetypes

Use the archetype menu in `../deckcp-build-deck/references/layout-archetypes.md`.

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

## Step 7 — write `design-direction.json`

Use the schema in `references/slide-art-direction-schema.md`.

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
  "anti_patterns": []
}
```

## Step 8 — write `slide-plan.json`

For every slide in `outline.json`, copy the narrative fields and add art direction.

Minimum packet:

```json
{
  "n": 4,
  "purpose": "proof",
  "headline": "Dinner economics create unusually strong unit margins",
  "visual": "photo",
  "art_direction": {
    "archetype": "stat-row-plus-media",
    "density": "low",
    "rhythm_role": "peak",
    "focal_point": "three unit-economics numbers",
    "composition": "numbers occupy the upper third; image anchors the lower-right; no cards",
    "hierarchy": ["headline", "numbers", "labels", "supporting note"],
    "imagery_treatment": "tight crop, edge-aligned panel, no decorative border",
    "data_treatment": "large numbers; labels below; no chart axes",
    "accent_job": "numbers only",
    "master": "content-editorial",
    "repetition_intent": null,
    "avoid": ["three equal cards", "generic icon row"]
  }
}
```

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

Fix the plan now. This is cheaper than fixing rendered slides.

## Step 10 — route

Next: `deckcp-build-deck`.

The build skill must treat `design-direction.json` and `slide-plan.json` as **binding inputs**, not optional suggestions.

## Guardrails

- Do not change the story merely to make a prettier deck. Route narrative problems back to `deck-outline` / `deck-critique`.
- Do not invent a brand gesture unsupported by a strong existing brand/reference in `reference-exact` mode.
- Do not make "premium" synonymous with beige, serif, gradients, dark navy, or rounded cards.
- Do not use novelty as a substitute for coherence.
- Do not let text density determine font size below legibility standards; restructure instead.
- Do not add imagery quotas when the brand is intentionally typographic, diagrammatic, or product-led.
