# The `Art direction` section — format

`deckcp-design-director` writes this into the deck doc via
`update_deck_doc{section:"Art direction", markdown}`. It replaces the old
`design-direction.json` + `slide-plan.json` pair.

It is markdown, not JSON, for the reason the whole doc is: **every artifact a
human touches is in the human's words.** This one sits at the boundary — the
founder rarely edits it, but they *can* read it, and when they disagree with a
composition it should take them one sentence to say so. Extra lines are allowed
wherever they carry real intent; nothing here is a fixed key set.

**Two hard rules before the format:**

1. **The founder's `visual:` line in `Slides` is binding on medium.** "Just the
   one line" means a Statement, not a Statement with a supporting chart. Expand
   it; never overrule it. If it genuinely cannot work, say so in one line and
   let them change it.
2. **Do not restate the narrative here.** Headline, point and evidence live in
   `Slides`. Duplicating them lets the two drift, and then nobody knows which
   one the build followed.

## Shape

```markdown
## Art direction

**Direction.** Editorial industrial — the deck reads like a field report, not a
brochure.
**Build mode.** brand
**Design source.** brand-kit (measured from the 2025 company template)
**Accent job.** the accent marks exactly one number per slide, nothing else.
**Chrome.** hairline rule under the headline; no footers except the closing.
**Grid.** 12-col, 96px margins, content never crosses the outer third.
**Density default.** medium
**Signature move.** a single full-bleed workshop photo every third slide.
**Restraint.** no gradients, no icon grids, no drop shadows, no rounded cards.
**Repetition.** slides 5-7 deliberately share one case-study skeleton.
**Media mix.** typography-led 40% · photography 25% · diagrammatic 20% · data 15%
**Visual strategy.** selective — peaks at 1, 4, 8; typographic pauses at 2, 3, 6.
**Rhythm.** opens on the photo, densest at 8, closes quiet on the ask.
**Anti-patterns.** stock mechanics; "AI-powered" as a headline; three-column
feature grids.

### 1
archetype: Image story
composition: full-bleed photo, headline reversed out bottom-left, nothing else
focal: the WhatsApp thread itself
intensity: visual-led
avoid: caption bars, gradient scrims, a logo over the photo

### 2
archetype: Big stat
composition: the number at display scale, context line beneath at body scale
focal: $40k
intensity: typography-led
source: Stripe, Jan–May — must be visible, small, under the number
avoid: a sparkline behind it, a second metric competing

### 3
archetype: Chart / data insight
composition: single bar series, the last bar in accent, gridlines dropped
focal: the last bar
intensity: visual-led
avoid: a legend (label the series directly), a second axis
```

## Fields worth naming explicitly

Deck-level lines the other skills actually read:

| Line | Read by | Why |
| --- | --- | --- |
| **Build mode.** | `deckcp-build-deck` Step 3 | `fast` / `brand` / `reference-exact` picks the generation path |
| **Media mix.** | `deckcp-quality-control` | the all-text and all-infographic checks score against it |
| **Repetition.** | `deckcp-quality-control` | tells a deliberate repeated skeleton from an accidental one |
| **Design source.** | `deckcp-build-deck` | `deckcp_template` triggers the template-instantiate path (record `template_id` too) |
| **Restraint.** / **Anti-patterns.** | build + QC | the avoid-list that keeps a generator from reaching for its defaults |

Per-slide lines:

| Line | Meaning |
| --- | --- |
| `archetype:` | one of the 19 in `layout-archetypes.md`. The founder never types this; you derive it from their `visual:` line |
| `composition:` | where things sit and at what weight — the thing a generator otherwise invents |
| `focal:` | the ONE element the eye lands on first |
| `intensity:` | `typography-led` / `supported` / `visual-led` |
| `source:` | when a number needs a visible citation, say where it goes |
| `avoid:` | the specific wrong answers for THIS slide, not general taste |

## Iconography

Only when the direction actually uses icons. One block, deck-level:

```markdown
**Icons.** minimal custom pictograms, medium stroke, angular, mostly outline
with the accent used solid for emphasis, sharp corners, low detail.
**Icons — avoid.** icons inside circles, stock icon libraries, mixed styles,
emoji, 3D, any icon with no semantic job.
```

If the direction does not call for icons, omit both lines. A deck with no icon
direction should have no icons, not default ones.
