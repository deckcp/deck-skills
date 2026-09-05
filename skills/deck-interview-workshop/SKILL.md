---
name: deck-interview-workshop
description: The deck interview on a workshop clock — same standards, far fewer turns. Batch the questions, deliver each pushback in the same breath as the next question, and finish a usable brief.json in minutes instead of a conversation. Use in live workshops, cohorts, office hours, or any room where a table of people is building decks at once and there is no time for a long back-and-forth. Emits the same brief.json as deck-interview.
argument-hint: "[--out ./deck-brief] [--type investor|sales|partnership|internal] [--rounds 2]"
---

# Deck Interview — workshop mode (main-loop model)

Same job as `deck-interview`: get the story straight before a slide exists, and write
`brief.json` for `deck-outline` / `deckcp-build-deck`. Same standards, same honesty.

**What changes is the turn budget, not the register.** A workshop has one facilitator,
a room of people, and a clock. The long form's one-question-at-a-time interrogation is
what eats the session — not its candor. So: batch the questions, say the hard thing
*while* moving to the next one, keep every judgment to a line.

## The one rule

> **Do not soften. Just say it faster, once, and keep going.**

A softened workshop interview is worse than no interview — the participant leaves with
a clean brief and an unexamined pitch. If the ask is vague, still say it's vague. You
just don't spend three turns landing it.

| | `deck-interview` | this |
|---|---|---|
| Questions | one at a time, react to each | batched, 2 rounds |
| Pushback | Step 3, stop and revise together | inline, same message as the next question |
| Length | as long as it takes | ~1 line per judgment |
| Ends when | the user has revised | the brief is written; revision is optional |
| Brief | identical schema | identical schema |

## Step 0 — scaffold

`deck-interview` owns the scaffold; reuse it rather than writing your own:

```bash
bash .claude/skills/deck-interview/scripts/init-brief.sh --out ./deck-brief --type sales
```

Installed globally instead? Use `~/.claude/skills/deck-interview/scripts/init-brief.sh`.
Not installed at all? Write the schema at the bottom of this file by hand — it's the
same file either way. Zero tokens; it never overwrites an existing brief.

## Step 0.5 — read any prior evidence

If `./deck-brief/input-evidence.json` exists, read it and drop every question it already
answers. In a workshop this is the difference between two rounds and four.

```bash
cat ./deck-brief/input-evidence.json 2>/dev/null
```

Same contract as `deck-interview`: pre-fill from `intent.goal` / `deck_purpose` /
`company.*` / `content[]` / `audience`, ask only `questions_required` plus material
`unknown`s, and carry each fact's `status` honestly. `interaction_mode: autonomous`
means write the brief and confirm in one line — but still deliver Step 3's read.

## Round 1 — the frame (one message)

Ask all four at once with `AskUserQuestion` — these are choices, not stories:

1. **Deck type & setting** — investor / sales / partnership / internal; sent as a link
   or presented live.
2. **The one decision-maker** — role and what they already believe. ("Investors" isn't
   an answer; offer concrete options.)
3. **The one outcome** — *"this deck succeeds if, after reading it, they ___."*
4. **The ask** — the specific thing being requested.

## Round 2 — the substance (one message, with the pushback riding along)

Ask for problem, insight, solution-in-one-sentence, proof, and differentiation
together. Then, **in the same message as your follow-ups**, name what's weak:

> "Got it. Two things before we move: your ask is 'explore working together' — that
> reads as no conviction, so I'm writing it as a 30-day paid pilot; change it if that's
> wrong. And 'AI-powered' is a feature, not a moat — what stops the incumbent shipping
> it next quarter? Meanwhile: what's your strongest proof point?"

That is the whole technique. The judgment is delivered, the reframe is proposed, and
the conversation has already moved on. **Do not wait for a revision.** If they push
back on your pushback, take it — but don't stall the room on it.

Budget: **top 2 weaknesses, one line each.** Not three, not a paragraph. Pick the ones
that would change the deck.

## Step 3 — write brief.json

Identical schema to `deck-interview` (below). Two workshop-specific rules:

- **`assessment.weakest` is still mandatory.** Fewer turns never means no judgment. If
  you only got one round of answers, the weakest thing in *those* is the finding.
- **Mark the reframes unconfirmed.** You proposed them and moved on, so the participant
  never actually agreed. Set `assessment.confirmed_by_user: false` (additive; existing
  consumers only read `weakest`) so a later pass — or the facilitator — knows the
  reframes are yours, not theirs.

```json
{
  "deck_type": "investor | sales | partnership | internal",
  "setting": "sent-as-link | presented-live",
  "audience": { "who": "", "believes": "", "skeptical_of": "" },
  "success_outcome": "one sentence: after reading, they ___",
  "ask": "the specific, concrete ask",
  "problem": "", "insight": "", "solution_one_sentence": "",
  "proof": [{ "claim": "", "kind": "evidence | hope" }],
  "differentiation": "", "unfair_advantage": "",
  "objections": [{ "objection": "", "answer": "" }],
  "assessment": {
    "strongest": "", "weakest": "", "reframes_applied": ["", ""],
    "confirmed_by_user": false
  },
  "voice": ""
}
```

Close with **two lines, not a paragraph**: the strongest thing, the weakest thing. Then
hand off: *"Run `deck-outline` for the story spine, or `deckcp-build-deck` to go
straight to slides."*

## Guardrails

- Brevity is fewer words, **never** fewer standards. Flattery to save time is the one
  real failure mode here.
- Never invent proof. `"proof": []` with the gap flagged is a finding, not a hole.
- One decision-maker, one outcome, one ask — same as the long form.
- If a participant is clearly onto something and wants to dig, let them. This skill is
  a default pace, not a gag order — hand off to `deck-interview` for the full session.
