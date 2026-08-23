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
