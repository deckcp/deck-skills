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
  - The **Tier 1 skills work right now, no account**: `deck-interview`,
    `deck-outline`, `github-lookup`. A founder can get a full brief + story
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

## Step 3 — one question, then route

Ask what they're trying to make happen (or infer it if they already said),
and route to exactly one skill:

| The user wants… | Route |
| --- | --- |
| A new deck (pitch, sales, partnership) | `deck-interview` → `deck-outline` → `deckcp-brand-kit` → `deckcp-build-deck` (which ends in `deckcp-quality-control`) |
| To set up their brand — logo, colours, fonts, "match our website" — or they have none and want it to look designed | `deckcp-brand-kit` |
| To understand a deck that already exists | `deckcp-read-deck` |
| To know if the deck is any good — the story | `deck-critique` |
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
- Slides are validated (`check_slide`) and rendered — the agent looks at its
  own work before showing you — and no deck is called done until it passes
  `deckcp-quality-control`: scored on brand accuracy, alignment, spacing,
  polish, repetition, and "does this look generated", then fixed.
- Nothing is emailed, shared publicly, or deleted without asking first.
- The full tool surface behind these skills is documented in `MCP-TOOLS.md`
  in this repo.

## Guardrails

- One routing question max — this skill's output is a next action.
- Never block a no-account user; Tier 1 is the pitch, not a consolation.
- Don't re-run onboarding for a user who's clearly mid-workflow.
