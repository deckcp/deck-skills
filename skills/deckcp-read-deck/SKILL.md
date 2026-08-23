---
name: deckcp-read-deck
description: Read and understand an existing DeckCP deck — its structure, narrative, and how each slide looks — before editing, critiquing, or presenting it. Use when the user says "read my deck", "what's in this deck", "look at the deck", "summarize the deck", or before any edit/critique of a deck you haven't seen. Requires the DeckCP MCP connected.
argument-hint: "[--deck <slug>]"
---

# Read a Deck (DeckCP MCP orchestration — minimal tokens)

Orient on a deck the way an editor would: structure first, then the actual
pixels, then the story. Every other DeckCP skill (edit, critique, share,
analyze) starts from what this skill establishes — never edit a deck you
haven't read.

## Step 0 — find the deck

```
whoami            # confirm which DeckCP user you are
list_decks        # slugs, titles, brands, slide counts
```

If the user named a deck, match it to a slug. If the token can't see it,
that's an access problem, not a retry — tell the user to share the deck with
the `whoami` email.

## Step 1 — structure

```
get_deck { slug: <deck_slug> }
```

Note for later use (other skills need these):

- **slide ids + slide_orders** — every edit/reorder/delete tool addresses
  slides by these.
- **frontmatter per slide** — `title`, `level`, `variant`, `master`.
- **brand + deck_theme** — what design system the deck lives in. If
  `get_brand` shows an empty palette and the deck has no `deck_theme`, the
  deck was built on defaults — note it; `deckcp-brand-kit` is the fix before
  any visual edit is worth making.
- **`deck_variety`** — `get_deck` returns a server-side pacing score
  (`score`, `issues`). Under ~70 means repeated skeletons; that's a
  `deckcp-quality-control` finding, not something to fix by hand here.

Save the `get_deck` result to `./deck-brief/deck.json` — the downstream
scripts (`deck-critique`'s `spine.js`, `deckcp-quality-control`'s
`scan-deck.js`) read it.

## Step 2 — look at it

Structure lies; pixels don't. Render before you summarize:

```
render_slides { deck_slug }                                  # user-visible inline viewer
render_slides { deck_slug, slide_orders:[N], format:'image' } # your eyes only, per slide
```

Use the `format:'image'` path when you need to actually inspect a slide
(density, hierarchy, whether a chart reads). The plain call is for showing
the user.

## Step 3 — read it as a story

Walk the slides in order and reconstruct the argument from the headlines
alone, the same test `deck-outline` applies in reverse:

- What is this deck trying to make happen (the ask)? Is it explicit?
- Do the headlines form a coherent argument without the body text?
- Where does the proof live? Is anything asserted without evidence?
- Which slides don't move the audience toward the ask?

## Step 4 — report

Give the user a compact map, not a transcript:

- One line per slide: `order — headline (purpose)`.
- The deck's spine as you read it, and where it breaks.
- 2–3 observations max (weakest slide, missing proof, buried ask).

Then route by what you saw:

| What the read showed | Route |
| --- | --- |
| The argument is the problem — labels for headlines, buried ask, proof that's hope | `deck-critique` |
| The look is the problem — off-brand colours, same grid every slide, "looks generated", misaligned | `deckcp-quality-control` |
| Built on an empty brand / default theme | `deckcp-brand-kit`, then `deckcp-quality-control` |
| One specific change — copy, theme, order | `deckcp-edit` |
| How real viewers move through it | `deckcp-analyze` |

## Guardrails

- Don't paste slide MDX back to the user — report by headline and purpose.
- Don't critique in depth here; that's `deck-critique`'s job. This skill is
  reconnaissance.
- Keep the slide id ↔ order map in your context — every downstream edit
  needs it.
