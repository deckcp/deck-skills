# Layout Archetypes — the variety a premium deck needs

A generated deck looks generated because every slide is the same skeleton —
usually a title over a 3-icon-card row. A deck looks *designed* because it
paces different layouts against a constant chrome, the way the templates at
[deckcp.com/templates](https://deckcp.com/templates) do, and the way a real
brand deck does (the OJEJE franchise reference: eyebrow + serif headline +
footer rule on every page, but a different body layout each time — split
panel, numbered steps beside a photo, a stat row over a data panel, an
editorial timeline, an icon grid exactly once).

This is the menu the build and author steps pull from. Two rules govern it:

- **Constant chrome, varied body.** Every content slide carries the same
  master (see "The chrome" below). Only the body layout changes.
- **No two consecutive slides share an archetype**, and one *tonal* moment
  (a dark/accent full-bleed, a big-number statement, a photo band) lands
  every 3–4 slides. `deckcp-quality-control` scores exactly this.

## The chrome (a master, built once, on every content slide)

The reference's strongest "real design team" signal is that every slide has
the identical frame:

- **Eyebrow** — a short tracked-out caps kicker in the accent, top-left,
  naming the section (`BRAND IDENTITY`, `THE OFFERING`, `THE PATH FORWARD`).
- **Headline** — a large display-serif H1 directly under it, left-aligned on
  the same left margin, stating the slide's conclusion.
- **Footer rule** — a thin line across the bottom with the deck signature in
  tracked accent caps at left (`OJEJE · FRANCHISE PARTNERSHIP`) and the page
  number at right.
- Everything hangs off one **consistent left margin**; the eyebrow, headline,
  and body all share that edge.

Build this as a master (`set_masters`) so it renders identically on every
opted-in slide — `frontmatter.sectionLabel` feeds the eyebrow,
`title`/`subtitle` feed the headline, `footers` carries the signature. That
one master does more for "designed, not generated" than any per-slide effort.

## The archetypes

Each names a body layout, when to reach for it, and the components/tokens.
Sizes assume the 1920×1080 canvas and the `deck-*` vocabulary.

1. **Cover / hero** — `variant:"hero"`. The wordmark as a statement
   (`deck-logo-xl`+ or `deck-text-9xl` display type), a one-line promise
   under it, optional tracked-caps pill. One per deck.

2. **Section divider** — `variant:"close"` or a full-bleed dark panel in the
   surface's dark ink (Espresso/Forest/navy) with the mark reversed in white
   and a large serif section title. The deck's tonal punctuation — one before
   each act. This is where a dark brand color earns its place.

3. **Statement** — one number or one line filling the canvas
   (`deck-text-12xl`+ for a number, `deck-text-7xl` for a line), accent on the
   number only. Use for the single stat the whole slide is about.

4. **Stat row (numbers-as-hero)** — 2–4 huge display-serif numbers in the
   accent across the top, a short label under each (`<Stat size="lg">` or a
   flex row of `<Prose>` pairs). The reference's "6 / 2 / ₩11–24K". Often
   paired below with a data panel or photo.

5. **Split feature** — a `deck-ratio-50-50`/`40-60` grid: a dark panel on one
   side (the mark, a photo, or a pull-quote) and titled content on the other
   (a labeled grid, a list, a definition). The reference's brand-color page.

6. **Media + steps** — a framed photo on one side, a vertical numbered list on
   the other: accent circle + serif term + sans description per step. The
   reference's "how to eat". `ProcessSteps`, or a hand-built list — never an
   icon-card grid.

7. **Editorial timeline / process** — horizontal nodes (accent or dark
   circles with numerals) joined by hairline/dashed connectors, a serif term
   and centered description under each. `Timeline`, or built from primitives.
   The reference's "first conversation to open doors".

8. **Data panel / table** — rows × columns as a real `<Table variant="rules">`
   (hairline rules, right-aligned value column, one `accentRows` for the line
   that matters), often on a dark panel. Never a stack of divs. Pricing,
   terms, comparisons, a menu.

9. **Icon-card grid** — a 2×3 of light cards, accent icon-in-circle, serif
   title, sans description. Genuinely useful for an inventory of parallel
   items (the reference uses it once, for "every touchpoint"). **At most one
   per deck** — more than one and the deck reads as generated.

10. **Quote / proof** — a single large serif pull-quote with attribution, or a
    logo/number wall of real evidence. Lots of air.

11. **Comparison** — two columns (before/after, us/them, option A/B) as paired
    panels or a two-column rules table. Distinct sibling names.

12. **Closing / contact** — `variant:"close"`: the ask restated, one contact
    block, the mark. Mirrors the cover.

## Imagery

The reference carries slides with real, tightly-cropped food photography on
cutout/dark backgrounds, framed inside the dark panel. A premium deck uses
the user's **own** photos (`deckcp-gather-assets`) or approved brand imagery
on ≥ ~1/3 of content slides. A ≥5-slide deck with zero imagery reads as a
wireframe — `deckcp-quality-control` flags it. Never scatter decorative
stock-metaphor icons (rocket, lightbulb, handshake) as a substitute for a
real image.

## Pacing a ~12-slide deck (example spine)

Cover → section divider → problem (split feature) → opportunity (stat row) →
insight (statement) → solution (media + steps) → how it works (editorial
timeline) → proof (data panel or quote) → offering (stat row + data panel) →
system (icon-card grid, the one) → roadmap (timeline) → the ask (closing).

Twelve slides, twelve different bodies, one chrome. That is the difference
between a deck and a template.
