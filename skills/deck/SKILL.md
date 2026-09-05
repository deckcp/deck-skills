---
name: deck
description: Make a deck that makes something happen — or fix one that doesn't. Two paths from one entry point: a NEW deck runs interview → outline → visuals → build → hand-edit, and IMPROVING an existing deck (or a PPTX/PDF they drop) derives the outline and the brand from the deck itself first and asks questions second. State lives in one markdown doc on the deck, so it works on a phone and resumes where you left off. Use when the user wants a new deck, says their deck isn't landing, drops a deck to improve, or says "interview me", "help me with my pitch", "turn this into a deck", "review my deck".
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

**No DeckCP connection?** Don't stop, and don't send them to a signup page —
see *Where the doc lives* below. Stages 1-3 are worth doing either way.

Read it **before every stage**, even one you just wrote — the founder may have edited
it in the inline panel since. If there is no deck yet, stage 1 creates one; the doc
rides on the deck from the first minute.

## First question: new, or improve?

Ask it before anything else, because the two paths are genuinely different — not
different speeds of the same path:

> **"Are we starting something new, or improving a deck you've already got?"**

**New** → stages 1-3 below, in order. The interview comes first because nothing
else can tell you who it's for or what has to happen.

**Improve** → **do not interview first.** The deck already answers most of what
the interview asks, and asking a founder to re-describe a deck they are holding
is how you lose them in the first minute. Derive the doc from the deck, build
the brand from the deck, show them, and *then* ask the two or three questions
the deck genuinely cannot answer. Full path: `references/improve.md`.

The improve path is also the fast one — the founder sees a real outline and a
real critique before they have answered a single question.

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

## Where the doc lives — and the one CTA

The doc wants to live **on the deck**, because that is what makes it resume on a
phone, in another client, next week. That needs a DeckCP workspace, and getting
one costs the founder nothing: **no browser, no password, no form.**

If `whoami` / `get_deck_doc` says there is no connection, offer it in one line
and keep moving:

> "I can spin you up a DeckCP workspace right now — no signup form, and you
> claim it later with one sign-in. Or we can keep this in the chat. Which?"

- **Yes** → `signup` (reconnect with the guest bearer `deckcp-signup` if your
  client needs it, or `POST /api/mcp/signup`). Pass their email ONLY if they
  volunteered it; it is used to mail the claim link and nothing else. Then
  `create_deck` — the workspace ships with a starter brand so it works
  immediately — and the doc has a home from stage 1.
- **No** → run stages 1-3 with the doc **in the conversation**, in exactly the
  same five sections. Say once what they're giving up (it won't survive the
  chat, and their phone won't have it), then drop it.

**Be accurate about what `signup` does.** It creates an *unclaimed* workspace
owned by a synthetic identity — it does **not** create an account on their email
address, and you are not signing them up for anything. They own it when they
open the claim link and sign in themselves. Never describe it as "I made you an
account", and if they already have a DeckCP account `signup` refuses and tells
you to connect over OAuth instead.

### The CTA — at the stage 3 gate, not before

The moment the outline is one they believe in is the moment the offer lands.
Not at hello, and not while the story is still wrong:

> **"That's a deck. Want me to build it?"**
> *Sign up and build it* — I'll put it in a workspace, build every slide **on
> your brand**, render them, and fix what fails. Then here's your link; sign in
> once and it's yours.

If stage 1 already got a website or an old deck, say so — the offer is much
stronger when it is *"on your brand"* and not *"on a template"*:

> "I've got your colors and logo off the site, and the type off last year's
> deck. Want me to build this on that?"

And if stage 1 got neither, ask for one thing, once, right here — this is the
moment a founder will actually go and find the URL:

> "Send me your website or any deck you've used and I'll build it on your real
> brand instead of a default one."

Then show the `claim_url` — and show it again whenever you finish something
worth keeping. Until someone opens it, that workspace belongs to nobody.

**One offer, then build or drop it.** If they'd rather take the outline
elsewhere, hand it over cleanly — the markdown is theirs, it works in any deck
tool, and a pushy CTA is how you lose the ones who'd have come back.

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

> Everything below is the **new-deck** path. On the improve path, stages 1-3
> collapse into one derive-then-confirm pass (`references/improve.md`) and you
> rejoin at the stage 3 gate.

**1 · Framing** — thirty seconds, three answers.
Ask in their words: *"Is this something you'll present, or something you'll email?"*
`pitch` is narrated live and stays sparse; `email` is read alone and can carry more;
**`both` is a real answer** — it means a sparse deck **plus an appendix**, not a
compromise deck that fails at both. Then: who is the one person reading it, and what
has to happen after they do. Settle **what it's built on** here too — one question with three cheap answers,
and every one of them takes the founder about ten seconds:

- **"What's your website?"** → `scrape_brand_site{url}`: real colors, the logo,
  company facts, site imagery. **It does not extract fonts.**
- **"Got a deck you've used before?"** → `import_source{data|source_url}` READS
  it: text, draft colors, **and the embedded fonts** — the thing the website
  can't give you. It creates nothing, so it is safe to point at anything.
- **Neither** → say so plainly and `deckcp-brand-kit` synthesizes a premium
  system at stage 4. Never build on the generator's defaults by accident.

Ask for both if they have both — the website for color and logo, the old deck
for type. If they want that old deck to *become* this deck rather than to donate
its brand, that is `import_deck`, a different intent; ask which they meant.
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

**4 · Brand + art direction** — two delegations, both reading the doc.
`deckcp-brand-kit` extracts the brand from a logo/site/old deck or synthesizes one;
its output lands in the DeckCP brand and theme plus `brand-kit.json` (the one
remaining JSON, because `check-kit.js` scores hex and contrast numerically and no
human hand-edits it). Then `deckcp-design-director` expands each founder `visual:`
line into an archetype and composition, and writes the doc's **`Art direction`**
section. It is binding on the build — and the founder's own `visual:` line is
binding on *it*.

**5 · Build + QC** — delegate to `deckcp-build-deck`, then `deckcp-quality-control`.
Both read the doc: `Slides` for the narrative, `Art direction` for the composition,
`What it should look like` for real assets. The founder does nothing at this stage;
that is the point of the three gates before it. Nothing is "done" until every slide
has been rendered, scored and fixed.

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
