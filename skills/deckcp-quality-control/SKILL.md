---
name: deckcp-quality-control
description: The mandatory final gate before any DeckCP deck is called done — render every slide, score the deck on brand accuracy, alignment, spacing consistency, visual polish, repetitive layouts, and generic AI-looking design, then fix what fails and re-score. Use when the user says "is this deck done", "QC the deck", "does it look right", "check the design", or automatically at the end of deckcp-build-deck and after any multi-slide edit. Requires the DeckCP MCP connected.
argument-hint: "[--deck <slug>] [--kit ./deck-brief/brand-kit.json] [--max-passes 3]"
---

# Quality Control (the gate — nothing ships without a score)

A deck is not done when generation finishes. It's done when it has been
rendered, looked at, scored against the brand kit it was built on, and the
failures have been fixed. This skill is that gate, and it is **not optional**:
`deckcp-build-deck` calls it last, `deckcp-onboard` promises it, and "done"
means *passed QC*.

Six dimensions, each scored 1–5. **Pass = every dimension ≥ 4 and zero
blockers.** Anything less goes back through the fix loop.

## Why this is mixed-tier

- **The scan is a script.** Off-palette hexes, Tailwind colour classes that
  smuggle in a hue, `text-sm` below the 22px floor, a gap scale with nine
  values, three identical skeletons in a row, "seamless" — a script finds all
  of that for free and never gets bored on slide 11.
  (`scripts/scan-deck.js`.)
- **The look is main-loop.** Whether the title baseline wanders, whether a
  chart reads, whether the deck looks *designed* or *generated* — that's
  eyes and taste. Render and look. Don't delegate the judgment to a cheaper
  model; this is the last thing between the user and an embarrassing deck.
- **The fixes are recipes** from `deckcp-edit` / `deckcp-author-slides`:
  theme writes, class swaps, one `rewrite_slide` where copy must change.

## Step 0 — load the reference

```bash
cat ./deck-brief/brand-kit.json 2>/dev/null    # the system the deck was built on
```

```
get_deck { slug }          # structure, ids, orders — AND the server's deck_variety score
get_brand { brand_slug }   # if there's no kit: the brand lockdown is the fallback reference
```

Save the `get_deck` JSON to `./deck-brief/deck.json` (write the tool result
to the file — the scanner reads it). If there is **no brand kit and the
brand has no palette**, stop: the deck has no reference to be accurate *to*.
Run `deckcp-brand-kit` first, apply it, then come back.

## Step 1 — scan (zero tokens)

```bash
node scripts/scan-deck.js ./deck-brief/deck.json --kit ./deck-brief/brand-kit.json --out ./deck-brief
```

Prints PASS/WARN/FAIL per dimension and writes `qc-scan.json`. What it
catches, by dimension:

| Dimension | Mechanical signals |
| --- | --- |
| Brand accuracy | hex literals outside the kit palette; `text-emerald-500`-style colour classes; >2 `Card accent` hues (rainbow cards); gradients the kit didn't ask for; **chrome inconsistency** — content slides missing the shared master while others have it, split across >2 masters, or an uneven eyebrow |
| Alignment | `style={{}}` (stripped on write → unpositioned), `items={[…]}` (dropped) — everything else is pixels |
| Spacing consistency | more than ~5 distinct gap tokens or ~8 padding tokens deck-wide; raw `gap-7`/`p-9` used once; >4 type sizes on one slide |
| Visual polish | raw `text-xs…xl` (under the 22px floor); emoji; >130 words or <4 words on a content slide; **no imagery** on a ≥5-slide deck (unless the kit says mark-driven) |
| Repetitive layouts | runs of ≥3 identical layout skeletons; one skeleton on >50% of slides; single variant + no imagery; the server's `deck_variety` score |
| Generic-AI look | icon-card grids on ≥40% of slides; dark-with-gradient on ≥50%; buzzwords (seamless, unlock, leverage, next-generation…); >6 icons per slide; topic-label titles |

Also run `check_slide` on every slide — it's free and its `balance.issues`
feed the alignment/polish scores:

```
check_slide { mdx_content, frontmatter }   # per slide; note valid:false and balance.issues
```

A clean scan is **necessary, not sufficient**. Go look.

## Step 2 — render the whole deck and look at every slide

```
render_slides { deck_slug, format:'image' }     # every slide, your eyes only
```

Open every image. Not a sample — every one. Then score. The rubric below is
what "4" means; write a one-line justification per dimension naming the
worst slide.

### Brand accuracy — does it look like *their* brand, as one family?
- **5** every colour is a kit colour in its kit role (accent on numbers, not on body); logos are the real files at a deliberate size; type is the kit pairing; **the chrome is identical on every content slide** — same eyebrow, same headline treatment, same footer rule, same left margin — because they share a master; the signature device is present throughout.
- **4** one slide leans on a neutral the kit didn't name, or the accent does two jobs, or one slide's chrome sits slightly off the others.
- **≤3** a colour not in the kit, a wrong logo variant (colour logo on a dark slide), a font that isn't the kit's, the device missing for stretches, or **the chrome visibly differs slide to slide** (eyebrow present here and gone there, headlines at different sizes/positions) — the tell that each slide was built alone instead of on a system.

### Alignment — do edges line up?
- **5** titles share a baseline across slides; left edges of title, body, and grid agree; grids have equal gutters; nothing kisses the canvas edge; charts sit on the same grid as text.
- **4** one slide's content sits visibly lower/higher than its neighbours.
- **≤3** optical centring on some slides and top-aligned on others; a card grid with one short card; text overlapping; anything `check_slide` balance flags as overflow.

### Spacing consistency — is there a rhythm?
- **5** one gap scale (`deck-gap-sm/md/lg`) used consistently by role; card padding identical deck-wide; the page margin respected on every slide.
- **4** one outlier slide.
- **≤3** cards with different padding on different slides; gaps that change per slide; content crowding the margin on some slides and floating on others.

### Visual polish — would a designer sign it?
- **5** clear hierarchy (2–3 sizes per slide); charts legible at a glance with the kit's colours; **real imagery, cropped with intent, carrying a good share of slides** (per the kit's imagery direction); no orphan words, no widows in titles; nothing under 22px; no empty bottom third.
- **4** one chart with a default colour, one awkward crop, or imagery a little sparse.
- **≤3** collapsed content in the middle of the canvas; thin cards with empty bottoms; a table that clips; tiny text; emoji; or a ≥5-slide deck with **no photography at all** (a wireframe), unless the brand is deliberately mark-driven.

### Repetitive layouts — does the deck have pacing?
- **5** no two consecutive slides share a skeleton; at least one full-bleed or single-statement moment; a tonal shift (section page, photo band, stat slide) every 3–4 slides.
- **4** two consecutive similar slides, once.
- **≤3** three-in-a-row identical grids; a deck that is all cards or all bullets; `deck_variety` under 70.

### Generic-AI look — would anyone guess a model made this?
- **5** it could sit on deckcp.com/templates: one device, one structural language, restraint, specific copy.
- **4** one icon-card grid, defensible.
- **≤3** icon-card grids everywhere; purple-on-dark gradients; three-column "features"; stock-metaphor icons (rocket, lightbulb, handshake); buzzword titles; centred-everything; every slide the same dark slab.

Record the scorecard in `./deck-brief/qc-report.md`:

```
| Dimension | Score | Worst slide | Why |
```

## Step 3 — fix what fails (cheapest correct tool, then re-check)

Work the failures top-down: deck-wide fixes first (they clear many slide
findings at once), then per slide. Map each to its tool:

| Failure | Fix |
| --- | --- |
| Wrong accent/fonts/mood deck-wide | `update_deck { deck_theme: {…} }` from the kit's payload (`check-kit.js` prints it), then `render_slides { refresh:true }` |
| Chrome differs slide to slide (eyebrow/headline/footer not shared) | build ONE content master carrying the eyebrow + headline + footer rule (`deckcp-brand-kit` Step 4c), `set_masters`, then set `frontmatter.master` on every content slide + `frontmatter.sectionLabel` for the eyebrow; `render_slides refresh:true` |
| Device missing / chrome inconsistent | put it in a master (`get_masters` → edit → `set_masters`), opt slides in via `frontmatter.master` |
| No imagery / wireframe look | pull the user's real photos with `deckcp-gather-assets` (or `search_assets` for approved brand imagery), place them per the kit's imagery treatment (full-bleed, framed-in-panel, cutout-on-dark); never substitute decorative icons |
| Off-palette hex or colour class on a slide | mechanical MDX edit: swap to the kit colour or a slate neutral; `upsert_slides` at the same `slide_order` |
| Rainbow `Card accent`s | pick one accent, replace on every Card (`upsert_slides`) |
| `text-sm` etc. | replace with `deck-text-*`; re-budget the slide's height |
| Gap/padding sprawl | normalise to `deck-gap-md` (grids) / `deck-gap-sm` (inside cards) / `deck-gap-lg` (sections) |
| Repeated skeleton run | rebuild the *middle* slide(s) of the run as a different archetype — one big stat, a photo band (`deck-photo-band`), a `<Table variant="rules">`, a single-line statement at `deck-text-9xl`+; `rewrite_slide` with an explicit archetype instruction if the copy can move |
| Icon-card grids | keep the one that earns it; convert others to a hairline list (`<Prose>` bullets), a table, or a numbered `ProcessSteps` |
| Buzzword titles / label titles | `rewrite_slide` with the specific claim — or hand to `deck-critique` if the problem is the story, not the words |
| Overflow / collapsed content (`balance.issues`) | follow `get_authoring_guide topic='contract'` → FILL THE CANVAS / DO NOT OVERFLOW rules |

After every write: `check_slide` → `render_slides { slide_orders:[N], format:'image' }` → look.
After deck-wide writes: `render_slides { refresh:true }` and re-run the scan.

**Three passes max.** If the deck still fails after three, the problem is
upstream — the kit is wrong (re-run `deckcp-brand-kit`) or the story is
wrong (`deck-critique`) — say which, and hand off instead of grinding.

## Step 4 — re-score, then report

Re-render **every** slide after the last fix (not just the ones you touched —
a theme write changes all of them) and re-score all six dimensions. Finish
`./deck-brief/qc-report.md` with before/after scores, what was changed, and
anything still open with the reason it was left.

Then show the user:

```
render_slides { deck_slug }     # the user-visible viewer
```

and say, in one paragraph: the scorecard, the three most visible changes,
and the verdict — **PASSED** (every dimension ≥ 4) or **NOT PASSED** with
the blocking dimension and the recommended upstream skill.

## Guardrails

- **Never report "done" without a render after the last write.** Scores come
  from pixels you looked at, not from a clean scan.
- Every slide, every pass. Sampling is how the bad slide 9 ships.
- Don't fix the story here. A weak argument with perfect alignment is
  `deck-critique`'s problem; flag it and route.
- Don't widen scope: no new slides, no reordering for taste, no copy changes
  beyond what a failure requires. One failure → one fix → one check.
- Keep tokens low: report by slide number and finding, never paste MDX back.
- The bar is the templates page, not "better than before." If it wouldn't
  sit in that gallery, say so — even when the user is in a hurry.
