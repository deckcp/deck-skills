---
name: deckcp-onboard
description: Start here — get set up with the DeckCP skill pack, verify the MCP connection, orient on your decks and brand, and get routed to the right skill for what you're trying to do. Use when the user says "get started", "set up deckcp", "what can these skills do", "which skill do I use", or right after installing the pack.
argument-hint: ""
---

# Start Here (onboarding — one question, then route)

The front door of the pack. Establish what the user has, what they're trying
to make happen, and hand them to exactly one next skill. Do not tour all the
skills — route.

## Step 1 — check the wiring

Try the MCP:

```
whoami        # the DeckCP user this session acts as
```

- **Works** → note the email; every "not authorized" error later resolves to
  "share the deck with this address".
- **No DeckCP MCP connected** → say so, and split the road honestly:
  - **`deck` stages 1-3 work with no DeckCP account** if you keep the doc in the
    conversation instead of on a deck (you lose resume-anywhere), and
    `github-lookup` needs nothing. A founder can get a full brief + story
    spine today and take it to any deck tool.
  - To build/edit/share real decks, connect the MCP: **deckcp.com/mcp** (mint
    a token, or use the OAuth connector), then come back.

  Don't fail hard — offer to start the interview anyway.

## Step 2 — orient (30 seconds, MCP connected)

```
list_decks                      # what already exists
get_brand { brand_slug }        # if decks exist — the design system they live in
```

Report one line: how many decks, which brand(s), anything archived — and
whether the brand is **real or empty**. `get_brand` answering "No approved
palette on file" / "No approved logos on file" means every deck built on it
will be generic by default; say so, and make `deckcp-brand-kit` the first
stop before any build.

**The brand decision drives everything else** — set it up front so the deck
matches the user's real company, not a generic template:

- **Any brand asset exists** — a logo, a brand guide, an existing deck, a
  website, a colour list — that is the **primary source of truth**.
  `deckcp-brand-kit` extracts it *literally* (colours, type, imagery, layout,
  the repeating chrome) so the deck looks like their own design team made it.
- **Nothing exists** — do **not** settle for a basic deck. `deckcp-brand-kit`
  synthesizes a premium design system benchmarked on
  [deckcp.com/templates](https://deckcp.com/templates).

Whether the user has brand assets is detected in Step 2.5, not asked here.

## Step 2.5 — if the user brought inputs, understand them first

If the user supplied **anything beyond a bare one-line prompt** — a logo, a
website URL, a social link, a brand guide, a PDF/PPTX, an existing deck, a
folder of assets, or a real DeckCP brand from Step 2 — hand off to
`deckcp-input-intelligence` **before** asking anything else. It detects and
classifies every input, gathers what evidence it can, records where each fact
came from and how sure it is, resolves conflicts by source authority, and asks
only what genuinely can't be discovered — then routes to exactly one next
skill. This is what turns *"here's our website, make me an investor deck"* into
a finished deck with zero unnecessary questions.

A bare one-line prompt with nothing attached can skip straight to the routing
table below — `deckcp-input-intelligence` would just record `interview-led`
anyway.

## Step 3 — one question, then route

Ask what they're trying to make happen (or infer it if they already said),
and route to exactly one skill:

| The user wants… | Route |
| --- | --- |
| A new deck (pitch, sales, partnership) | **`deck`** — it runs the whole process (framing → interview → outline → visuals → build → hand-edit) over one markdown doc on the deck, gating each stage on the user. It delegates to `deckcp-brand-kit` / `deckcp-build-deck` / `deckcp-quality-control` itself |
| A new deck, in a live workshop / cohort / office hours — a room on a clock | **`deck`**, saying up front that you're batching for the clock: same gates, fewer turns. The doc lives on the deck, so a participant on a phone can talk instead of type |
| To improve / polish an existing deck they supply | `deckcp-input-intelligence` (classifies it as edit-target) → `deckcp-read-deck` → `deckcp-edit` |
| To set up their brand — logo, colours, fonts, "match our website" — or they have none and want it to look designed | `deckcp-brand-kit` |
| To understand a deck that already exists | `deckcp-read-deck` |
| To know if the deck is any good — the story | **`deck --critique`** — findings only, changes nothing |
| To know if the deck looks right — brand, alignment, "does it look AI-made" | `deckcp-quality-control` |
| To change something — copy, theme, order | `deckcp-edit` |
| To write/place slides by hand, precisely | `deckcp-author-slides` |
| Their own photos/screenshots in the deck | `deckcp-gather-assets` |
| To send it out | `deckcp-share` (gate + invites), then `deckcp-email` |
| To know who viewed and what to do about it | `deckcp-analyze` |
| To contact someone they found on GitHub | `github-lookup` → `deckcp-email` |

The default first run for a new user is the top row, end to end — a real
deck from a real interview is the best tour of the pack.

## Step 4 — set expectations (one paragraph, not a lecture)

Worth saying once to a new user:

- Every deck is built on a design system — yours, extracted literally from
  your logo/site/guide, or one synthesized to the standard of
  deckcp.com/templates — never on the generator's defaults.
- Before slides generate, `deckcp-design-director` turns the story + brand into
  a visual thesis and per-slide art-direction plan, so the generator is not
  inventing composition from scratch.
- Slides are validated (`check_slide`) and rendered — the agent looks at its
  own work before showing you — and no deck is called done until it passes
  `deckcp-quality-control`: scored on brand accuracy, design/reference fidelity,
  alignment, spacing, polish, intentional rhythm, and "does this look generated",
  then fixed.
- Nothing is emailed, shared publicly, or deleted without asking first.
- The full tool surface behind these skills is documented in `MCP-TOOLS.md`
  in this repo.

## Guardrails

- One routing question max — this skill's output is a next action.
- Never block a no-account user; Tier 1 is the pitch, not a consolation.
- Don't re-run onboarding for a user who's clearly mid-workflow.
