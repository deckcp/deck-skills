---
name: deckcp-author-slides
description: Write DeckCP slides by hand — author MDX against the rendering contract with precise control over layout, components, charts, presets, and masters, instead of going through the AI generation pipelines. Use when the user says "write the slide yourself", "add a slide that says exactly...", "hand-tune this layout", "make a slide with a chart of...", or when generate/rewrite keep missing the mark. Requires the DeckCP MCP connected and editor access.
argument-hint: "[--deck <slug>] [--slide <order>]"
---

# Author Slides by Hand (manual editing — full control, strict contract)

Three ways to change a slide, cheapest adequate one wins:

1. `deckcp-edit` recipes — mechanical changes, theme, reorder.
2. `rewrite_slide` — the server copilot rephrases one slide.
3. **This skill** — you write the MDX yourself, when the user wants exact
   words, exact layout, a specific chart, or the pipelines keep missing.

Manual authoring is main-loop work: layout and copy are judgment. The
contract below is strict because Tailwind never scans DB-stored MDX — what's
not in the vocabulary silently doesn't render.

## Step 0 — load the contract (once per session)

```
get_authoring_guide { topic: "contract" }      # MDX rules, class vocabulary, canvas budget
get_authoring_guide { topic: "components" }    # ~62 components + charts, props, examples
get_authoring_guide { topic: "classes" }       # machine-readable allowed_classes array
get_brand { brand_slug }                       # palette, logos, non-negotiables
```

Don't author from memory of other Tailwind projects. The guide is the truth.

## The write contract

Each slide = **`frontmatter` object + `mdx_content` body** (or `slide_tree`
for editor-native full fidelity — placements, per-run color; prefer
`mdx_content` unless you need absolute pixel placement).

**Frontmatter carries the slide shape, not the MDX:**

```yaml
title / subtitle / sectionLabel     # the shell renders these
variant: light | dark | hero | close
master: <id from get_masters>       # opt into a named layout
coordinateSpace: "slide"            # absolute layout mode — shell then does NOT
                                    # render title/subtitle; put them in the body
```

**Styling — the classes-only rule (the #1 failure mode):**

- `className` only, from the pre-compiled vocabulary: `deck-text-xs…9xl`,
  `deck-h-*`, `deck-ratio-*`, `deck-gap-*`, `deck-logo-*`, `deck-max-w-*`,
  plus standard flex/grid/spacing/rounded/border/slate utilities.
- **Rejected and stripped on write:** inline `style={{}}`, `text-[Npx]`,
  arbitrary `w-[Npx]`/`h-[Npx]`, `grid-cols-[…]`, `auto-rows-fr`. Approved
  palette only.
- Named looks: `list_style_presets { deck_slug }` → put the id in
  `data-preset` on the node.

**Components & charts:**

- Charts are real typed components (`LineChart`, `BarChart`, `DonutChart`,
  `KPIGrid`, `Sparkline`, …) — their props take **real arrays/objects**:
  `points={[{x:1,y:2}]}`.
- Primitive list components take **pipe-strings**: `<CardList items="a | b" />`
  — a JSX array there is silently dropped. Check the catalog per component.
- Any capitalized tag NOT in the catalog renders as an Interactive block,
  not the component you imagined — `check_slide` warns about this.
- `<Interactive runtime="html|canvas|js" code={`…`} />` is the escape hatch
  for anything custom — sandboxed iframe in the viewer's browser, must call
  `ready()`.

**Accent color — how to actually get the brand accent (learned the hard way):**

- The brand accent lives in **`--deck-primary`** (set from `deck_theme.accent`).
  But many built-in presets and classes reference **`var(--accent, #ffb020)`**
  — a *different* variable that `deck_theme` does NOT set, so it falls back to
  the framework **amber `#ffb020`**. That's why a "gold" deck can render amber:
  `slide-eyebrow` (`text-accent`), `big-stat-value-accent`,
  `process-step-number-accent`, `timeline-chip-progress`, `callout-insight`
  all use `--accent` and come out amber on a themed deck. To get the *brand*
  accent, use things wired to `--deck-primary`: the `stat-value*` presets,
  `shape-brand-fill`/`shape-brand-outline`, and components like `<Stat>`,
  `<ProcessSteps>` (its numbers), and `<Table accentRows={[…]}>`.
- **`upsert_slides` strips preset `style` objects** (and inline styles, and
  arbitrary hex/`text-[…]`). So a `<Prose data-preset="stat-value">` written
  as MDX loses the gold `color` on write and renders near-invisible. Gold text
  in MDX must come from a **component that colors itself** (`<Stat>`,
  `ProcessSteps`, a `Table` accent row) — not a Prose+preset. For labels and
  body, use dark ink (`text-slate-900/700`); the muted-gold accent (`#A08162`
  and its kin) is low-contrast (~3:1) and should carry numbers/rules, not text.
  If you truly need preset styling to survive, author with **`slide_tree`**
  (editor-native, full fidelity), not `mdx_content`.
- **Chart colors are fixed semantic tokens, not hex.** `CostBreakdown`,
  `ProcessSteps`, etc. take `color`/`tone` = `"accent" | "calm" | "warn" |
  "positive"` → gold / sky / amber / green. Only `accent` is the brand color;
  you can't pass a brand hex, so a multi-segment chart is off-palette by
  construction. For brand-pure data, prefer a `<Table variant="rules"
  accentRows={[…]}>` or a row of `<Stat>`s over a multi-color chart.

**Layout discipline (enforced by `check_slide`):**

- Canvas is fixed **1920×1080** and overflow **clips** — no scroll. Budget
  ~800px of content height.
- One node, one job; `data-name` on text-less objects; groups of 2–5;
  nesting ≤3.

## The loop — never write blind

```
check_slide { mdx_content, frontmatter }        # free, BEFORE writing
upsert_slides { deck_slug, slides: [{ slide_order, frontmatter, mdx_content }] }
render_slides { deck_slug, slide_orders:[N], format:'image' }   # look at it yourself
```

Iterate until `check_slide` is `valid:true` AND the render actually reads —
balance score and your own eyes both count. Then show the user with plain
`render_slides { deck_slug }`.

New slides: pick an order in the gaps (between 20 and 30 → 25). Overwrites
at an existing order save a version snapshot first — revertible.

## Masters — layout once, not per slide

If several slides share a layout (background, logo slot, footer), don't
repeat it in each body:

```
get_masters { deck_slug }        # merged global ← brand ← deck view
set_masters { deck_slug, masters: [...] }   # edit-the-array-and-PUT-back; max 30
```

Then each slide opts in via `frontmatter.master`. After changing masters,
`render_slides { refresh: true }` — every opted-in slide re-renders.

## Guardrails

- `check_slide` before every `upsert_slides`, no exceptions — a "probably
  fine" class that isn't in the vocabulary fails silently.
- Never fabricate numbers to make a chart look good.
- If you're rebuilding most of a deck by hand, stop — the story is wrong,
  not the slides. Go back to `deck-outline`.
