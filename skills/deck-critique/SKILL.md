---
name: deck-critique
description: Pressure-test a deck's story before it goes out — the headline-only read, the skeptic's pass, the 5-second test, the proof audit, and whether the ask lands — and return a short, prioritized, honest fix list. Use when the user says "critique my deck", "is this deck any good", "poke holes in this", "what's weak", or after deck-outline / deckcp-build-deck. Works on an outline, a DeckCP deck, a PDF/PPTX, or pasted slide text — no account needed.
argument-hint: "[--outline ./deck-brief/outline.json] [--deck <slug>] [--file deck.pdf] [--lens investor|sales|partner|skeptic|all]"
---

# Deck Critique (main-loop model — honest, specific, prioritized)

A deck fails at the story level long before it fails at the design level.
This skill is the pressure test: it reads the deck the way the audience
will — impatient, skeptical, skimming — and says what breaks, in order of
how much it costs. It does **not** fix (that's `deck-outline`, `deckcp-edit`,
`rewrite_slide`) and it does **not** judge pixels (that's
`deckcp-quality-control`). It judges the argument.

## Why this is a main-loop step

Spotting that the "insight" slide is actually a restated problem, that the
proof is a hope wearing a number, that the ask arrives two slides after the
reader decided — that's the judgment the user came for. Run it in the
session's own model. Never hand a critique to a downgraded model; a bland
critique is worse than none because it reassures.

Register: **a sharp friend who has seen a thousand decks fail.** Warm,
direct, no hedging. "This is fine" is not a finding.

## Step 0 — get the deck in front of you

Take whichever exists, in this preference order:

```bash
node scripts/spine.js                 # prints brief (audience/ask/proof), outline headlines, or deck titles
```

- **Outline** (`./deck-brief/outline.json`) — critique *before* slides exist;
  cheapest place to fix anything.
- **DeckCP deck** — run `deckcp-read-deck` first (it gives you structure,
  renders, and the slide-id map); save `get_deck` to `./deck-brief/deck.json`
  so `spine.js` can read it.
- **PDF / PPTX** — extract the text (`pdftotext`, or the `pdf`/`pptx` skills)
  and render or read page images for anything chart-shaped.
- **Pasted text** — fine; say you're critiquing copy only.

Also read `./deck-brief/brief.json` if it exists: the critique is held
against *that* audience and *that* ask, not a generic one. If there's no
brief, ask exactly two things — **who is the one decision-maker** and
**what must they do after reading** — and proceed.

## Step 1 — the headline-only read

Read only the headlines, in order, out loud (or print them with
`spine.js`). Ask:

1. Do they form a complete argument with no body text? (If a reader skims,
   this *is* the deck.)
2. Is every headline a **conclusion** ("The wedge is a $4B niche nobody
   serves") or a **label** ("Market")? Count the labels.
3. Where does the argument jump — which slide assumes something the previous
   ones didn't establish?
4. Where is the ask? Is it the destination every earlier slide points at, or
   a line at the end?

This single read usually produces finding #1.

## Step 2 — the lenses

Run each; keep only what actually bites. Pick the lens set by
`brief.deck_type`, or `--lens all`.

- **The skeptic.** You are the decision-maker's most cynical colleague. For
  each slide: what's the first objection? Is it answered within two slides?
  Unanswered objections are findings; pre-empted ones are strengths — say
  those too.
- **The 5-second test.** Per slide: cover everything but the headline and
  the biggest visual for five seconds. What did you take away? If it's not
  the slide's point, the slide is mis-built.
- **The proof audit.** List every claim that asks to be believed. For each:
  evidence, or hope? (`brief.proof[].kind` if there is a brief.) A number
  with no source, a logo wall with no contract, "pipeline" presented as
  revenue — name them. **Never supply missing proof yourself.**
- **The ask.** Specific? Singular? Concrete enough to say yes to in one
  sentence? Does it arrive once the reader is ready — or too early, or
  buried?
- **Audience fit.** Re-read as the one decision-maker from the brief: what
  do they already believe that the deck wastes slides proving? What are
  they skeptical of that the deck never touches?
- **Setting fit.** `sent-as-link` decks must self-explain (headlines as
  conclusions, enough words); `presented-live` decks must stay out of the
  speaker's way (sparse, one idea per slide). A link deck with 6-word
  slides and a live deck with paragraphs are both findings.
- **Investor / sales / partnership specifics:**
  - *Investor:* why now, why this team, the wedge vs. the vision, use of
    funds tied to the milestones the raise buys.
  - *Sales:* cost of inaction quantified, a named customer outcome, pricing
    or next step on its own slide, no "about us" before the buyer's problem.
  - *Partnership:* mutual framing, what each side brings, a proposal with a
    shape (pilot, term, scope), not "let's explore".

## Step 3 — prioritize and write it down

At most **seven** findings, ordered by cost to the outcome. Each one:

```
#N  [blocker | weak | polish]  Slide(s) X
    What's wrong:  one sentence, specific to this deck
    Why it costs:  what the audience does when they hit it
    Fix:           the concrete move — and which skill makes it
```

- **blocker** — the reader stops or says no (no ask, a proof that's a hope,
  a label-only spine).
- **weak** — it still lands, but softer than it should (buried ask, an
  objection unaddressed, a slide that doesn't move toward the ask).
- **polish** — wording, order, a slide to cut.

Finish with **two lines on what's strong** — a critique that is only
negative teaches the user nothing about what to protect. Write the whole
thing to `./deck-brief/critique.md`; print the scorecard line:

> `blockers: 1 · weak: 3 · polish: 2 — headline spine: 7/10 conclusions`

## Step 4 — route

Each finding names its fix. In general:

| Finding type | Route |
| --- | --- |
| Spine / sequence / missing slide / cut | `deck-outline` (edit `outline.json`, then rebuild or re-order) |
| One slide's copy | `deckcp-edit` → `rewrite_slide` with the finding as the instruction |
| Missing proof | back to the user: the brief needs the number, or the claim needs to go |
| The ask | `deck-interview` Step 1.4 again — it's a positioning problem |
| Looks generated, off-brand, misaligned | `deckcp-quality-control` — not this skill's lane |

## Guardrails

- Specific or nothing. "Tighten the narrative" is not a finding; "slides
  4–6 each restate the problem; cut 5 and 6, move the insight to 4" is.
- Seven findings max. A 20-item list is a way of not prioritizing.
- Never invent proof, numbers, or customers to fill a hole — say the hole
  is there.
- Don't critique design here beyond flagging that it undermines the story
  (a chart nobody can read *is* a story problem); pixels go to
  `deckcp-quality-control`.
- Honest over kind, kind over cruel. If the deck is good, say so and say
  why — that's still specific.
