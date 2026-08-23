# Visual Storytelling — choose the strongest representation for each idea

The v0.8.1 layer. Its job is to translate ideas into visuals **when a visual communicates
better**, without turning DeckCP back into generic icon-card design. Read this before Step 4.5
of `deckcp-design-director`.

## The core logic

```text
CONTENT
   ↓
What must the audience understand?
   ↓
Can it be understood faster, clearer, or more memorably as a visual?
   ↓
YES ───────────────────────── NO
 ↓                             ↓
Choose the strongest visual    Use typography, whitespace,
representation                 hierarchy — and stop there
 ↓                             ↓
Apply the brand's visual language
 ↓
Compose → render → check the visual intent was actually executed
```

The objective is **not** "add more graphics." It is "use the strongest communication medium
for each idea." A professional deck may run: a typographic statement → a floor-plan diagram →
a photograph → a data visualization → a sparse statement. That intentional rhythm is the goal.

## Choose the strongest representation

Match the **nature of the content** to a representation. Prefer the first that fits; do not
convert content into icons if another representation communicates it better.

**Physical / spatial** → `spatial-plan`, annotated image, floor plan, schematic, product visual.
*e.g. restaurant seating layout, store footprint, manufacturing line, architecture, office layout.*

**Sequential** → `process`, `timeline`, storyboard, progressive diagram.
*e.g. customer journey, service experience, onboarding, implementation, operating procedure.*

**Comparative** → `data-viz`, side-by-side visual comparison, matrix, scale diagram.
*e.g. competitor differences, before/after, performance, pricing, product tiers.*

**Geographic** → `map`, site clusters, route diagram, regional markers.

**Categorical** → `pictogram`s, `symbol`s, typographic grouping, small multiples.

**Quantitative** → meaningful chart, hero metric, proportion graphic, annotated data-viz.

**Emotional / sensory** → `photography`, `illustration`, large typography, cinematic crop.

**Abstract / strategic** → `diagram`, system map, relationship model, hierarchy, conceptual illustration.

## When typography IS the answer

Keep the slide typographic when the idea is a single decisive claim, one hero number, a quote,
a definition, or a deliberate pause. Scale, weight, spacing, one accent, and whitespace do the
work. Setting `visual_translation.needed:false` is a first-class choice, not a failure — and QC
must not demand a graphic for such a slide.

## Text disguised as design

A large number, a colored rule, a table, a divider, a box, or a big headline are **typographic
composition** — excellent, but not the same as **visual representation**. If a whole deck is
these and nothing else, it is text-led by accident. Distinguish the two when planning; use both
on purpose.

## Visuals inherit the brand language

A diagram is not exempt from branding. Its stroke weight, geometry, spacing, corner style,
typography, color, label placement, and density all come from the active design system
(`brand-kit.json.design_system` + `design-direction.json`). A diagram that ignores the brand is
as off-system as an off-palette color.

## Prefer simple visual grammar

A good diagram usually needs **fewer** elements, stronger hierarchy, fewer labels, one clear
direction, and intentional whitespace. Do not generate dense consultant diagrams unless the
content genuinely requires them. One clear visual idea per slide beats several competing ones.

## Avoid diagram clichés

Do not default to: circular arrows; connected rounded cards; floating pills; rainbow process
steps; SmartArt-style chevrons; arbitrary dotted connectors; generic hexagons; random icon
bubbles; 3D icons; icon-in-a-circle grids. These read as generated. Reach for a real spatial
plan, a real proportion graphic, a real map, or a real annotated image instead.

## Concrete beats vague

Always state the visual idea concretely in `visual_translation.concept` and `art_direction.composition`:

- Weak: `use icons` · `add diagram` · `make visual`
- Strong: `show four counter seats surrounding a central grill as a simple top-down spatial diagram`
- Strong: `show expansion from one flagship to four city clusters to twelve locations as progressively multiplying site markers`
- Strong: `highlight 18% of a simplified floor-plan footprint so the metric reads as proof`

If the visual idea can't be described in one concrete sentence, it isn't ready to build.

---

# Visual Restraint & Rhythm (v0.8.2)

The counterweight to everything above. v0.8.1 taught DeckCP to *add* visuals; v0.8.2 teaches
it *when not to*. Over-visualization — every slide forced into an infographic — is as much a
generic-AI presentation smell as wall-of-text. The goal is **maximum communication with
minimum unnecessary design.** The strongest visual decision is sometimes to add a diagram;
sometimes it is to remove it.

## Don't visualize statements. Visualize structures.

A pure **statement** is usually strongest as typography and should NOT trigger a graphic:

- `The counter is the restaurant.` → typography-led, `needed:false`, confidence `low`
- `Take the counter seat.` → typography-led close
- `Luxury without ceremony.` → typography-led positioning

Reach for visual translation when the content carries a real **structure, relationship,
sequence, comparison, proportion, system, geography, process, evidence, physical arrangement,
or quantitative pattern**:

- `18% kitchen / 82% dining` → proportion graphic (`visual-led`, confidence `high`)
- `1 → 4 → 12 locations` → expansion / cluster visual (`visual-led`, high)
- `seat → fire → first skewer → rhythm` → process / sequence (`visual-led`, high — inherently sequential)
- `training / sourcing / fit-out / playbook` → *optional* semantic icon system (`supported`, confidence `medium`)

## The restraint gate

Before setting `visual_translation.needed: true`, weigh three things (conceptual, not literal math):

```text
communication gain   (faster to understand / compare / remember / believe)
+ brand gain         (strengthens brand language / a real signature / emotional impact)
> complexity cost    (clutter / competes with headline / too many labels / feels like an
                      infographic / reduces elegance and focus)
```

Execute the visual only when gain clearly beats cost. Record the verdict as `confidence`:

- **high** — the visual clearly improves the slide → execute it.
- **medium** — a visual may help, but a typographic version may be as good → compare both;
  if the visual adds substantial complexity, prefer typography unless it's genuinely important.
- **low** — technically visualizable, small gain → default to typography-led.

## The intervention hierarchy — least complex first

When strengthening a slide, climb only as far as needed:

```text
1. typography + whitespace
2. typography + one graphic device
3. simple semantic visual
4. diagram / pictogram system
5. complex visualization
```

Stop at the lowest level that does the job. Most slides live at 1–2.

## Remove before adding

Before finalizing a slide, ask: **would removing one visual element make this stronger?**
Hunt for redundant icons, unnecessary lines/containers, repeated labels, icons that merely
duplicate adjacent text, over-detailed diagrams, competing focal points, decorative devices.
Prefer subtraction.

## Plan peaks, not coverage

Decide which few slides are the deck's **visual peaks**, which carry **light support**, and
which are **typography-led pauses** — don't decide "what visual each slide gets." A strong
10-slide deck might be: type · type · data-viz · light pictograms · sequence · type/table ·
proportion · light symbols · expansion · type. *That is only an example — never hard-code it.*
The lesson: some slides explain, some prove, some breathe. Watch for an exhausting
`diagram / icons / diagram / icons …` cadence; if too many consecutive slides are
`visual-led`, thin them unless the content truly requires the density.

## `visual_strategy` beats `visual_media_mix`

The mix ranges only guard against accidental monotony. The *strategy* (mode + peaks +
pauses) decides where visuals go. Never add a chart, diagram, icon set, or photo merely to
satisfy a media-mix category. Default mode is `selective`; `visual-rich` is only for content
that genuinely needs heavy explanation (architecture, engineering, technical systems,
science, complex workflows).

## Worked examples (restraint-first)

| Content | visual_intensity | needed / confidence | Why |
| --- | --- | --- | --- |
| "The counter is the restaurant." (positioning) | typography-led | false / low | A statement. Only draw a floor plan if the slide's *job* is to explain operating geometry. |
| "seat → fire → first skewer → rhythm" | visual-led | true / high | Inherently sequential — a process visual materially helps. |
| "18% kitchen / 82% dining" | visual-led | true / high | A proportion graphic makes the footprint advantage instantly visible. |
| Menu: skewers / fish / veg / rice / seasonal / drinks | typography-led *or* supported | — | A readable ledger is often best; add restrained glyphs only if they speed scanning. Don't auto-generate six pictograms. |
| Operating system: training / sourcing / fit-out / playbook | supported | true / medium | Small semantic symbols are acceptable; do not turn the whole slide into an icon infographic. |

## Two checks, not one — they must not contradict

QC now evaluates both directions: *did we miss a meaningful visual opportunity?* (v0.8.1
`visual_opportunity_check`) **and** *did we over-design the slide?* (v0.8.2
`visual_restraint_check`). A slide deliberately marked `typography-led` / `needed:false`
must **never** fail the opportunity check for lacking graphics, and a genuinely-earned
`visual-led` peak must not fail the restraint check for being visual. The two checks are
opposite guardrails on the same judgment, not a contradiction.
