---
name: deck
description: Make a deck that makes something happen — the whole process, one stage at a time, from "what are we making" through interview, outline, visuals, build and hand-editing. The state lives in one markdown doc on the deck itself, so this works on a phone and picks up where you left off. Use when the user wants a new deck, wants to rework an existing one, or says "interview me", "help me with my pitch", "turn this into a deck".
argument-hint: "[deck-slug] [--stage framing|interview|outline|visuals|build|edit] [--critique]"
---

# Deck — one document, six stages

There is **one artifact**: the deck doc, a markdown document that lives on the deck
in DeckCP (`get_deck_doc` / `update_deck_doc`). It starts as interview notes, gains a
slide list, gains a visual line per slide, gets critiqued, and gets built. The founder
edits it at every stage, and it **is** the state — so you never ask them to repeat
themselves, and this works identically on a phone, on claude.ai, and in Claude Code.

No JSON. No files on disk. See `docs/architecture/deck-doc-process.md` in the DeckCP
repo for the format.

## Start every session here

```
get_deck_doc{deck_slug}     # exists:false → nothing has run yet; frontmatter.stage → where you are
```

Read it **before every stage**, even one you just wrote — the founder may have edited
it in the inline panel since. If there is no deck yet, stage 1 creates one; the doc
rides on the deck from the first minute.

## The two rules

> **1. The gate is theirs.** Show what you propose. Wait. Only then write. Only pass
> `confirm:'<stage>'` when they have actually said it's right — never because a stage
> looks done to you.

This is structural, not a reminder, because a reminder demonstrably does not work: an
agent with *"AI is often in a rush to build"* freshly in its context still said
"writing it" and started building in the middle of the discussion. `frontmatter.confirmed`
is the check that survives your own enthusiasm.

> **2. Their words, not yours.** Record what the founder said in **their phrasing**.
> Never paraphrase a founder's sentence into your register. The voice is the whole
> reason the deck is theirs rather than everyone else's — and it is what you are
> handing the build stage to preserve.

## Voice-first

The flagship case is a phone: **talk, don't type.** Ask questions that are answerable
out loud, in one breath. Accept rambling, half-finished, doubled-back answers as
*good* answers — that is what speech sounds like — and do the tidying yourself without
flattening their words. Never ask someone to type a paragraph.

Before you ask anything, use what you already have: `get_brand`, `scrape_brand_site`,
`import_source` on an old deck, the repo you are sitting in. Then **confirm in one
line** instead of asking from scratch: *"I read off your site that you do X for Y —
right?"* Re-asking what the evidence already told you is how an interview loses a
founder in the first two minutes.

## The six stages

**1 · Framing** — thirty seconds, three answers.
Ask in their words: *"Is this something you'll present, or something you'll email?"*
`pitch` is narrated live and stays sparse; `email` is read alone and can carry more;
**`both` is a real answer** — it means a sparse deck **plus an appendix**, not a
compromise deck that fails at both. Then: who is the one person reading it, and what
has to happen after they do. Settle the brand here too (`get_brand`, or note that it
needs extracting/synthesizing later — it is a prerequisite, not a narrative stage).
→ `update_deck_doc{kind, brand, section:"What we're making", markdown}` → **gate**.

**2 · Interview** — `references/interview.md`.
The question set, the pushback register, and what to do when they say "just make it".
Also writes `What it should look like` — the asset inventory and *what has to be seen
to be believed*. Not per-slide: no slides exist yet.
→ `update_deck_doc{section:"The story", …}` → **gate**.

**3 · Outline, then visuals** — `references/outline.md`.
Two passes over the same `Slides` section. Pass 1 settles the argument: every headline
states a conclusion, one point per slide. Pass 2 walks the same list for visuals only.
The lint runs on every write — act on its flags.
→ `update_deck_doc{section:"Slides", …}` → **gate**.

**4 · Brand** — delegate to `deckcp-brand-kit` when the brand still needs extracting
from a logo/site/old deck, or synthesizing from nothing. Its output belongs in the
DeckCP brand and theme, not in the doc.

**5 · Build + QC** — delegate to `deckcp-build-deck`, then `deckcp-quality-control`.
Hand them the doc. The founder does nothing at this stage; that is the point of the
three gates before it. Nothing is "done" until every slide has been rendered, scored
and fixed.

**6 · Edit by hand** — `references/edit-by-hand.md`.
This happens **in the editor, not through you**. Your last act is to name the few
slides most likely to read as AI-written, and get out of the way.

## Critique is a mode, not a stage

Available at any point, including `--critique`. When the founder asks for a critique
you are **held** in it: findings only, and you change nothing. *"Critique my outline.
Don't edit it"* means exactly that. Findings go in chat, or into `My read` — never as
an edit to one of the founder's own sections. See `references/critique.md`.

If they ask you to critique and you find yourself writing a fix, stop: you have left
the mode they put you in.

## Guardrails

- **Never invent proof.** A missing number is a finding, stated out loud, not a
  plausible-looking figure. This is the single thing that makes a deck read as AI slop.
- **One decision-maker, one outcome, one ask.** If they insist on several, help them
  pick the primary and note the rest.
- **`My read` is yours; every other section is theirs.** Put your assessment there —
  strongest, weakest, reframes you proposed — and never smuggle it into their prose.
- **A weak pitch honestly recorded beats a strong-sounding brief you wrote.** If the
  positioning is weak, say so and propose a stronger frame. Do not transcribe a bad
  pitch into a clean doc.
- **Don't skip to build because the doc looks ready.** See rule 1.
