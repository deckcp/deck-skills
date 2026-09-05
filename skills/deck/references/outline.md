# Stage 3 — the outline, then the visuals

Two passes over the same `Slides` section. **Story before design** — mixing "what it
says" with "what it looks like" in one pass is how a deck gets designed before its
argument is settled.

## The format

```markdown
### 1. We hit $40k MRR in five months
point: growth is real and recent, not a projection
evidence: Stripe, Jan–May
visual: one big number, the $40k, nothing else on it
```

`### N. Headline` per slide. `point:` is **one** point. `visual:` is one line in plain
words. `evidence:` is optional and names which proof from `The story` carries it.

## Pass 1 — the argument

**Every headline states the takeaway, not the topic.** "Market" → "The wedge is a $4B
niche nobody serves well." A reader who skims only the headlines should get the whole
argument. This is the single highest-leverage move in the whole process.

**One point per slide.** If a slide has two, it is two slides — or it is an email-deck
slide, and the lint will say so.

You **may propose** a visual line in this pass — suggesting is cheap and helps the
founder see the shape — but don't settle it. Say you're proposing.

Then `update_deck_doc{section:"Slides", markdown}`, show them, and **gate**.

## Pass 2 — visuals only

Walk the same list. **You propose each line in plain words; they edit the sentence.**
Never make them pick from a vocabulary:

> Slide 4 — one big number, the $40k, nothing else on it.
> Slide 7 — picture of the plant on the left, the three points on the right.
> Slide 9 — just the one line.

They nod or rewrite. You map plain words → archetype when you build; the founder never
sees an archetype name, because only a machine needs one.

**There is no "no visual."** Every slide has a visual form — a text slide is one
decisive sentence carried by scale and whitespace, which is an archetype
("Statement"), not an absence. Pretending otherwise is how you get a template dump.

**Medium plus what it must show, never styling.** "Just the revenue curve, nothing
else" is the job. "Dark blue, bigger logo" is the brand's business — and a visual line
that invites styling gets the deck re-themed slide by slide against its own design
system.

**But not too much.** Not every slide wants a chart. A deck that is all infographic is
as bad as one that is all text; the restraint is the craft.

### Plain words → archetype

The founder's phrasing on the left is what goes in the doc. The right column is what
you hand the build stage (see `layout-archetypes.md` in `deckcp-build-deck` for all 19).

| They say | You build |
| --- | --- |
| "just the one line" | Statement |
| "one big number" | Big stat |
| "a few numbers side by side" | Stat row |
| "picture on one side, words on the other" | Split feature |
| "a chart that makes the point" | Chart / data insight |
| "the actual table of it" | Data panel / table |
| "the real screen / the product" | Product / interface |
| "steps in order" | Timeline / process |
| "a photo that carries it" | Image story |
| "a quote / the logos" | Quote / proof |
| "before vs after", "us vs them" | Comparison |
| "same shape for each customer" | Case study |
| "where we are on a map" | Map / footprint |
| "the title", "the ask" | Cover / hero, Closing |

## The lint

Every write of `Slides` returns it. Act on the flags rather than reporting them:

- **number-density** — too many numbers in the headline and point. Counted in the
  prose only, **never** the visual line: a chart slide is many numbers and exactly one
  point, which is the whole archetype.
- **one-point** — the point is more than one sentence.
- **missing-visual** — no visual line.
- **topic-headline** *(advisory)* — the headline reads as a label, not a conclusion.
- **wrong_kind** — most slides bust the pitch budget. That is not a broken pitch deck;
  it is an **email deck wearing the wrong `kind`**. Say so and offer both fixes: relax
  to `kind:email`, or cut it down to something narratable.

A flag is a conversation, not an auto-fix. Propose the change and let them decide.
