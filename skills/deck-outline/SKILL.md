---
name: deck-outline
description: Turn a deck brief into a story spine before any slides — problem → insight → solution → proof → ask — so the narrative is right before design starts. Use when the user says "outline my deck", "what slides do I need", "help me structure the pitch", or right after deck-interview. Reads brief.json, emits outline.json + outline.md.
argument-hint: "[--brief ./deck-brief/brief.json] [--out ./deck-brief]"
---

# Deck Outline (outline-first, main-loop model)

A deck fails at the story level before it ever fails at the design level. This
skill builds the **narrative spine** from the brief so every slide earns its place,
then hands a slide-by-slide outline to the build step.

## Why this is a main-loop step

Sequencing an argument — which claim must land before the next is believable, where
the proof goes, how to open so a skeptic keeps reading — is judgment, not
templating. Run it in the current session's model. A script (`scripts/scaffold-outline.sh`)
only writes the empty structure; you fill the story.

## Step 0 — read the brief

```bash
cat ./deck-brief/brief.json
```

If there is no brief, run `deck-interview` first (or interview inline). Pay special
attention to `audience`, `ask`, `assessment.weakest`, and `objections` — the
outline must *route around the weakest points and preempt the objections*, not
ignore them.

## Step 0.5 — get the genre playbook (evidence-first, before any spine)

Call the deck's genre intelligence and let it decide *what* must be communicated:

```
get_deck_playbook { deck_type }     # investor | sales | marketing | company_overview | report | franchise
```

It returns (LAYER 1) the universal quality rules — the evidence-first slide
contract, concrete-language rules, the company-specificity test, the
authentic-asset hierarchy, anti-card-default, the content preflight, and the
content QC checks — and (LAYER 2) the genre's **audience-question set** and
abstracted exemplars. Genre intelligence decides *what*; `deckcp-design-director`
still decides *how it looks*. Build the spine below from the questions your
**current** evidence (from `input-evidence.json` / `scrape_brand_site` /
`import_source`) can answer — skip the rest rather than filling them with
strategy language. Current facts come from current authoritative sources, never
from an exemplar.

## Step 1 — pick the spine

Default spine (adapt to deck type; don't apply mechanically):

1. **Hook** — the one line that makes them lean in. Often the insight or a
   startling number, not "Hi, we're X."
2. **Problem** — who hurts, how much. Make it their problem, felt.
3. **Insight / why now** — the thing you know that they don't; why now.
4. **Solution** — the one-sentence solution, then how it works, briefly.
5. **Proof** — traction/evidence. Strongest proof gets its own slide.
6. **Why you win** — differentiation / unfair advantage / team.
7. **The ask** — specific, concrete, singular. This is the destination; every
   prior slide should make it feel inevitable.

Variants:
- **Sales**: Problem → Cost of inaction → Solution → Proof (case study) → Pricing →
  Next step. Lead with the buyer's pain, not your company.
- **Partnership**: Shared goal → Why you two → What each brings → The proposal →
  Ask. Frame it as mutual, not a favor.
- **Live vs. sent-as-link** (from `brief.setting`): live decks can be sparse (you
  narrate); link decks must be self-explaining — more words per slide, clearer
  headlines-as-conclusions.

## Step 2 — write slide headlines as conclusions

The single highest-leverage move: **every slide's headline states the takeaway**,
not the topic. "Market" → "The wedge is a $4B niche nobody serves well." A reader
who skims only the headlines should get the whole argument.

For each slide capture: `purpose`, `headline` (the conclusion), `key_points`
(2–4 max), `evidence` (which proof from the brief, if any), a **coarse**
`visual` role (chart, diagram, photo, product, table, none), and — optionally —
a one-line `visual_intent` describing the *communication need* ("show how the
central counter format works spatially", "make the expansion multiplication
visible"). `visual_intent` is a hint for the Design Director, not a styling
instruction, and is entirely optional — omit it and the plan is still valid.

Keep this step narrative-first. Do **not** invent exact compositions here; the
new `deckcp-design-director` step does that after the brand/reference has been
understood — including the actual visual translation. The outline only answers:
*what kind of evidence or visual object should carry the claim, and what does the
audience need to understand?*

Plan enough pacing to avoid an all-text deck, but do not force artificial
variety. Two consecutive charts or three repeated case-study layouts can be
excellent when the content benefits from comparison. Repetition becomes a
problem only when it is accidental.

## Step 2.5 — content preflight (reject/rewrite BEFORE design)

Fill the evidence-first contract for every slide (fields in the schema below),
then run the preflight from the playbook. **Reject or rewrite** a substantive
slide when any of these holds — and record it in `preflight_log`:

- it says nothing concrete (no evidence / mechanism / customer behavior / product
  state / quantitative fact / meaningful comparison / causal relationship);
- it fails the company-specificity test (strip the company name — would it fit
  many unrelated companies?);
- its headline leans on an abstract strategy term (`category-defining`,
  `flywheel`, `capital-light`, `unmatched`, …) when a concrete statement is
  available — rewrite to the concrete statement;
- it asserts a fact you have **no evidence** for — omit the claim, mark it
  `inferred`, or ask ONE question only if the answer is material and
  undiscoverable. **Never fabricate a number.**
- its **central claim is only an inference** — do not present it as observed;
  acquire evidence, label `observed_status: inferred`, or hold the slide.

**High-stakes claims** (revenue, profitability, market size, users/customers,
growth, transaction economics, market share, competition, regulatory) need an
authoritative **current** source. When the website evidence is insufficient, set
`evidence_gap: true` and `recommended_acquisition: <source needed>` and **hold**
the specific claim — a plausible inference must not stand in as the fact.

**Acquire before you hold.** When a gap is *material*, try to acquire the evidence
rather than dropping the slide: from `input-evidence.json` / `scrape_brand_site`'s
discovered links, `fetch_page` an HTML source (investor-relations, newsroom,
product page) or `import_source` a linked PDF/PPTX (annual report, earnings),
append the sourced evidence (with `source_type`, `authority`, `freshness`,
`acquired_via`), and re-run this preflight. Pursue only material gaps,
highest-authority source first, don't re-fetch equivalents, and stop when the
slide is sufficiently evidenced or the evidence genuinely can't be found — then
hold/omit. `get_deck_playbook` carries the full acquisition contract; authority is
per dimension (what the source *is*, not how it arrived).

Not a number quota: a slide passes if it is concrete (a real mechanism or product
state counts). Dividers / cover / close are exempt from the specificity test.
Only slides with `preflight: kept | rewritten` continue to `deckcp-design-director`.

## Step 3 — cut

Ruthlessly. A seed deck is ~10–12 slides, a sales deck ~8–10. If a slide doesn't
move the audience toward the ask, it's an appendix slide or it's cut. Tell the user
what you cut and why.

## Step 4 — scaffold + write

```bash
bash scripts/scaffold-outline.sh --out ./deck-brief
```

Then fill `./deck-brief/outline.json`:

```json
{
  "deck_type": "", "audience": "", "ask": "",
  "spine": "the variant you chose and why",
  "slides": [
    {
      "n": 1, "purpose": "hook",
      "headline": "conclusion, not topic",
      "key_points": ["", ""],
      "evidence": "which proof, or null",
      "visual": "chart | diagram | photo | product | table | none",
      "visual_intent": "optional one-line communication need, or omit",

      "audience_question": "the genre question this slide answers (from get_deck_playbook)",
      "communication_job": "the one job this slide does",
      "slide_answer": "the concrete answer, stated plainly",
      "observed_status": "observed | inferred | unknown",
      "evidence_available": "yes | partial | no",
      "evidence_sources": ["url / document / page for each fact"],
      "evidence_gap": "true when a high-stakes claim lacks authoritative support",
      "recommended_acquisition": "if evidence_gap, the source that would close it",
      "confidence": "exact | high | medium | low | inferred",
      "company_specificity": "pass | fail",
      "authentic_asset": "the most authentic asset available for this slide, or none",
      "preflight": "kept | rewritten | rejected"
    }
  ],
  "preflight_log": [
    { "slide": "headline or question", "verdict": "rewritten | rejected", "reason": "no concrete content | fails specificity | abstract-when-concrete-available | unsupported claim", "action": "what you changed or cut" }
  ],
  "cut": ["what you removed and why"]
}
```

Also render a human-readable `outline.md` (headline per slide + key points) so the
user can eyeball the flow.

## Step 5 — read it back as a story

Read the headlines aloud in order. If they don't form a coherent argument on their
own, the outline isn't done — fix the sequence before handing off. For a
second opinion on the spine *before* any slides exist — the cheapest moment
to fix a story — run `deck-critique` on `outline.json` now.

Then route, in this order:

1. **`deckcp-brand-kit`** — establish the design system the slides will be
   built on (extract the user's real brand, or synthesize one to the
   deckcp.com/templates standard). Do this *before* building; a generator
   with no system defaults to the generic look.
2. **`deckcp-design-director`** — combine this story with the brand kit and
   create `design-direction.json` + `slide-plan.json`: deck-level art direction,
   density/rhythm, semantic archetypes, and a concrete composition packet for
   every slide. This is the bridge between "on-brand" and "actually designed."
3. **`deckcp-build-deck`** — builds from the outline + brand kit + design plan,
   then runs the `deckcp-quality-control` gate.
4. **`deck-critique`** — again on the built deck, if the story shifted
   during generation.

## Guardrails

- Headlines are conclusions, not labels. Enforce this every slide.
- The ask appears once, concretely, at the end. No burying it mid-deck.
- Respect `brief.assessment.weakest` — the outline should strengthen or sidestep it,
  never lean on it.
