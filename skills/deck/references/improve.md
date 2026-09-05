# The improve path — the deck is the brief

A founder holding a deck has already answered most of the interview. Asking them
to re-describe it is how you lose them. So on this path you **work first and ask
second**: derive the whole doc from the deck, build the brand from the deck, show
both, and only then ask what the deck genuinely cannot tell you.

Nothing here is a gate you skip. The founder still signs off before you rebuild
anything — they just sign off on something concrete instead of a blank page.

## Step 1 — get the deck, the right way

Two cases, and picking wrong throws away their work:

- **Already in DeckCP** → `get_deck{slug}` for the slides, `get_deck_doc` in case
  a doc already exists (they may have run this before), `get_brand` for the
  brand it's on.
- **An external PPTX/PDF they want improved** → `import_deck`. It converts the
  file into a real editable DeckCP deck, keeping layout, imagery, embedded fonts
  and a draft brand distilled from the file. **Not `import_source`** — that only
  reads text, and re-authoring from text throws away every visual decision they
  ever made. A big file returns `status:"in_progress"`; call again with `job_id`
  until `done`, and never present a half-converted deck as finished.

Then `render_slides{deck_slug, format:"image"}` and **actually look at every
slide.** You cannot critique a deck you have only read the text of — that is how
you miss a placeholder still in the copy, a chart with a stray series, or a QR
code nobody can scan.

## Step 2 — derive the doc, no questions asked

Write all of it before you ask anything. Mark what you inferred.

**`Slides`** — one `### N` per slide, from what is actually there. Where you are
proposing a better headline, keep the old one on a `was:` line so the founder can
see exactly what you changed and disagree with any of it:

```markdown
### 3. The wedge is a $4B niche nobody serves well
was: Market
point: the market is big enough to matter and narrow enough to win
visual: a chart that makes the point — one series, the wedge highlighted
```

An unchanged slide carries no `was:` line. **Never rewrite a headline silently.**

**`The story`** — what the deck currently claims: problem, solution, proof,
differentiation. Quote its own words where they are good; they are the founder's
voice already, which is the thing you are trying to preserve.

**`What we're making`** — audience, outcome and ask **as the deck implies them**,
each marked `(inferred)`. This is the section most likely to be wrong, and it is
exactly what Step 4 asks about.

**`What it should look like`** — the real assets already in the deck (photos,
screenshots, charts) and which of them are doing work. Note anything that is
obviously stock or placeholder.

**`My read`** — the diagnosis. Not the fixes; the findings, hardest first.

## Step 3 — build the brand from the deck

The deck is the strongest brand evidence they will ever give you, and it is
already in your hands:

- **In DeckCP** → `get_brand` for the record, `get_masters` for the layout
  system it already uses.
- **Imported** → `import_deck` distilled a draft brand from the file, including
  **embedded fonts** — the one thing a website scrape cannot give you.
- **Then, if they also have a site** → `scrape_brand_site{url}` for color, logo
  and imagery, and reconcile: newer official evidence beats older collateral, an
  explicit instruction beats both.

Hand the reconciled result to `deckcp-brand-kit` to record it properly. Do NOT
synthesize a new brand on this path unless the founder explicitly asks for a
redesign — improving a deck means their brand, better executed, not your brand.

## Step 4 — NOW show it, and ask only what's left

Show the derived doc and your read. Then ask the questions the deck could not
answer — usually only two or three:

1. **Who is this actually for now?** Decks outlive their audience. The one in
   `What we're making` is inferred from the deck's own framing, which may be a
   year old and aimed at someone else.
2. **What's the ask now?** Same reason. This changes more often than anything.
3. **What proof do you have that isn't in here?** The most common single defect
   in an existing deck is real traction the founder never put on a slide.

Then **the gate**: they confirm the outline before you rebuild anything.
`update_deck_doc{confirm:"outline"}` — and only when they actually said so.

## The lint is your diagnosis

Writing `Slides` returns the slide check, and on an existing deck it is not a
nag — it is the improvement list, already prioritised:

- **topic-headline** on many slides is the single highest-leverage finding in
  most real decks. "Market", "Team", "Traction" are labels; a reader skimming
  only the headlines gets nothing.
- **number-density** flags the slides that belong in an appendix.
- **missing-visual** marks the slides nobody has decided the shape of.
- **wrong_kind** is the big one: if most slides bust the pitch budget, this is an
  email deck being presented live, or the reverse. Say that out loud — it
  reframes every other finding.

## What not to do

- **Don't rebuild everything.** An improve pass that replaces all 30 slides is a
  new deck with extra steps, and the founder will not recognise it. Fix what the
  findings name.
- **Don't drop their assets.** Real photos and real screenshots are the hardest
  thing to get and the easiest thing to lose in a rebuild.
- **Don't touch what isn't broken.** A slide that already states a conclusion and
  carries its proof is finished. Say so and move on.
- **Don't skip looking.** Render every slide. Every defect that survives an
  improve pass survived because nobody looked at it.
