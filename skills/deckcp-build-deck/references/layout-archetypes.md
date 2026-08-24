# Layout Archetypes — semantic compositions, not template roulette

A generated deck looks generated when every idea is forced into the same skeleton, usually a title over a row of equal cards. A polished deck uses a **small, coherent layout language chosen from the content and the active brand/reference**.

The goal is not maximum variety. The goal is **intentional rhythm**.

## Two rules

1. **Reference-derived invariants, content-derived bodies.** Keep whatever the active design system actually repeats — grid, margins, title behavior, logo, footer, section marker, or nothing at all. Then choose the body composition that best communicates the slide.
2. **No accidental repetition.** Repeating an archetype is allowed when it creates comparison, sequence, recognition, or a deliberate series. Do not repeat the same skeleton simply because the generator defaults to it.

## Chrome is optional and brand-derived

There is no universal DeckCP chrome.

A brand/reference may repeat:

- an eyebrow / section label
- a fixed headline position
- a footer or running signature
- a page number
- a logo
- a side rail
- a hairline rule
- a watermark
- nothing beyond consistent margins and typography

Build repeating elements as a master when the source supports them. Do **not** invent an eyebrow + serif headline + footer rule just because another reference deck used that system.

The invariant is: **slides that belong to one system should visibly share that system.**

## Archetypes

Each archetype names a communication job. Exact typography, surfaces, radii, colors, and spacing come from `brand-kit.json` + `design-direction.json`.

1. **Cover / hero** — establish the visual world and promise. One dominant brand mark, title, image, product frame, or statement. Keep secondary information quiet.

2. **Section divider** — punctuation between acts when the story genuinely has chapters. May be full-bleed, image-led, typographic, or minimal depending on the brand. Do not insert on a fixed cadence just to create variety.

3. **Statement** — one decisive sentence or idea. Low density. Use scale and whitespace rather than containers.

4. **Big stat** — one number is the argument. The number dominates; context and source are subordinate.

5. **Stat row** — 2–4 directly comparable metrics. Shared baseline and equal visual weight unless one metric is intentionally dominant.

6. **Split feature** — image/product/proof on one side and explanation on the other. Ratios may be 50/50, 40/60, 35/65, etc. Use the ratio supported by the active system.

7. **Media + steps** — a real image/product view paired with an ordered explanation. Use when the process is easier to understand with a visual anchor.

8. **Timeline / process** — genuine temporal or sequential logic. Nodes, connectors, columns, or stacked stages are all valid if they match the brand grammar. Do not use a timeline for unordered bullets.

9. **Data panel / table** — actual rows × columns, pricing, terms, comparisons, menu, or detailed evidence. Use a real table treatment rather than a stack of pseudo-cards.

10. **Chart / data insight** — a chart where the chart itself proves the headline. De-emphasize non-essential gridlines/legends; highlight the one series or point the conclusion depends on.

11. **Image story** — photography or product imagery carries the emotional or explanatory load. Copy is sparse. Use the brand's crop and treatment rules.

12. **Quote / proof** — one strong testimonial, sourced statement, logo wall, or evidence cluster. Lots of air; avoid decorative quote marks unless the system uses them.

13. **Comparison** — before/after, us/them, option A/B, current/future. Sibling structures should align closely so differences are easy to see.

14. **Case study** — repeatable proof format: situation → intervention → outcome, or logo → metric → quote. **Intentional repetition across several case studies is encouraged.**

15. **Product / interface** — screenshot, device frame, workflow, or feature close-up with concise annotation. Prefer the real UI over symbolic icons.

16. **Map / footprint** — geographic story, locations, expansion, market coverage. The map must communicate something; do not use as decoration.

17. **Portfolio / gallery** — multiple real images, brands, locations, products, or campaign examples. Use a deliberate grid and crop logic.

18. **Closing / ask** — resolve the argument into one next step. Mirrors the deck's opening energy without mechanically copying the cover.

19. **Custom** — use only when none of the semantic archetypes fits. Describe the communication job and composition explicitly in `slide-plan.json`.

## Visual-storytelling variants (v0.8.1 — guidance, not new top-level archetypes)

These are **named ways of using the archetypes above** so a `visual_translation` becomes a
concrete layout. They keep the taxonomy small: each maps onto an existing archetype.

- **spatial-explainer** — a top-down/side schematic or floor plan that makes a physical or
  operational format understandable (grill + counter seating; store footprint; line layout).
  Realizes a `spatial-plan` translation; a form of *Split feature* / *Custom*.
- **annotated-visual** — a real image or product view with a few precise callouts doing the
  explaining. A form of *Product / interface* or *Image story*; realizes `annotated-image`.
- **visual-sequence** — an ordered visual journey (storyboard / progressive states) rather than
  a bullet list. A form of *Media + steps* / *Timeline*; realizes a `process`/`sequence`.
- **cluster-map** — geographic markers, site clusters, or expansion multiplication. A form of
  *Map / footprint*; realizes a `map` translation.
- **proportion-graphic** — a shape whose area/segment IS the number (footprint share, mix,
  ratio). A form of *Big stat* / *Chart / data insight*; realizes a `data-viz` translation.
- **pictogram-system** — a small set of consistent custom pictograms distinguishing categories
  or steps, under one `iconography_direction`. A restrained form of *Statement* / *Stat row* —
  use ONLY when a consistent symbol set genuinely improves scanning, never as icon-cards.

Visuals inherit the brand's stroke, geometry, spacing, corners, type, and color. Prefer simple
grammar (fewer elements, one direction, intentional whitespace) and avoid the diagram clichés
listed in `deckcp-design-director/references/visual-storytelling.md`.

## Density budget

Every slide should be planned as:

- **Low** — one idea / one focal point. Best for statements, big stats, images, chapter turns.
- **Medium** — 2–4 content units or image + explanation. Default for most content slides.
- **High** — evidence-heavy chart/table/dashboard. Requires strict hierarchy; never rescue it by shrinking text below legibility.

A deck benefits from density contrast, but there is no fixed "tonal slide every 3–4 pages" rule. Let the narrative determine when the audience needs a pause or turn.

## Imagery

Follow `brand-kit.json.design_system.imagery` and `design-direction.json`.

Good sources, in order:

1. the user's own photography / screenshots / product imagery
2. approved brand assets
3. purposeful sourced imagery when allowed
4. illustration / diagrams when they fit the brand

Do not enforce a photography quota on brands that are intentionally typographic, diagrammatic, or UI-led. Equally, do not replace a photo-led brand with decorative icons because assets are inconvenient.

## Pacing examples

These are examples, not rules.

### Narrative pitch

Cover → statement → problem split → big stat → solution → product → proof → comparison → case study → ask

### Evidence-led report

Cover → executive statement → chart → chart → table → pause / quote → chart → comparison → recommendations → close

### Repeated case-study sequence

Cover → framing → case study A → case study B → case study C → synthesis → ask

The three case studies should usually share a stable layout. That repetition is a feature, not a QC failure.

## DeckCP vocabulary hints (implementation, not style)

When a planned archetype is authored by hand (`deckcp-author-slides`) or named
in a rewrite instruction, these are the DeckCP components/tokens that usually
carry it. Sizes assume the 1920×1080 canvas and the `deck-*` vocabulary;
confirm the current surface with `get_authoring_guide` — the brand kit and
`design-direction.json` decide the actual faces, sizes, surfaces, and radii.

| Archetype | Typical DeckCP carrier |
| --- | --- |
| Cover / hero, Closing | `variant:"hero"` / `variant:"close"`; wordmark via `deck-logo-xl`+ or display type (`deck-text-9xl`+) |
| Section divider | full-bleed dark surface panel, mark reversed (`logo.which:"white"`), a section-divider master |
| Statement / Big stat | one line at `deck-text-7xl`, one number at `deck-text-12xl`+; accent on the number only |
| Stat row | `<Stat size="lg">` or a flex row of `<Prose>` pairs sharing a baseline |
| Split feature | `deck-ratio-50-50` / `deck-ratio-40-60` grid |
| Media + steps, Timeline | `ProcessSteps` / `Timeline`, or primitives with hairline/dashed connectors — not an icon-card grid |
| Data panel / table | `<Table variant="rules">`, right-aligned value column, `accentRows` for the line that matters — never a stack of divs |
| Image story | `deck-photo-band` or a framed panel per the kit's imagery treatment |
| Spacing | `deck-gap-sm/md/lg` by role; the kit's `design_system.spacing` scale when present |
