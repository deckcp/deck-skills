---
name: deckcp-input-intelligence
description: Understand what the user gave you BEFORE the deck pipeline runs — detect and classify every input (prompt, logo, website, social, brand guide, PDF/PPTX, existing deck, images, data, existing DeckCP brand), gather what evidence is available, decide where each fact came from and how sure you are, resolve conflicts by source authority, and ask only the questions that genuinely can't be discovered. Emits input-evidence.json and routes to exactly one next skill. Use right after deckcp-onboard whenever the user supplies anything beyond a bare one-line prompt, or says "here's our logo/website/deck, make me a deck".
argument-hint: "[--out ./deck-brief]"
---

# Input Intelligence (understand the inputs before the pipeline runs)

This skill is the **reasoning layer between the user and the deck pipeline**. It does
not build anything. It answers five questions and writes them down so every later
skill starts from evidence instead of an interrogation:

1. **What did the user give me?** (detect + classify every input)
2. **What can I actually learn from it?** (acquire evidence — separately from reasoning)
3. **Where did each fact come from and how sure am I?** (provenance + confidence)
4. **Does anything conflict, and can I resolve it myself?** (authority)
5. **What's genuinely missing, and is it worth a question?** (adaptive questioning)

Output: `./deck-brief/input-evidence.json` + one routing decision. Then hand off.

**Where it sits:**

```
USER → deckcp-onboard → deckcp-input-intelligence → (ask only if necessary)
     → deck-interview / deck-outline / deckcp-brand-kit
     → deckcp-design-director → deckcp-build-deck → deckcp-quality-control
```

It is **additive**. If this skill never runs and `input-evidence.json` never exists,
every downstream skill behaves exactly as before. Nothing about the v0.8.2 design
pipeline changes — this skill only decides *which* existing skills run next and *what
evidence they start from*.

## When to run

Run when the user supplies **anything beyond a bare one-line prompt**: a file, a URL, a
social link, an existing deck, an existing DeckCP brand, or a request that names their
company/site. For a truly bare prompt ("make me a sales deck for an AI startup") you
may skip straight to `deck-interview` — but writing a minimal `input-evidence.json`
that records `interaction_mode: interview` is cheap and keeps the flow uniform.

## Step 1 — detect & classify the inputs (no tokens for the on-disk part)

List everything the user gave. For files already on disk, let the script inventory and
classify them deterministically:

```bash
bash scripts/classify-inputs.sh --out ./deck-brief ./deck-assets ./path/to/logo.svg https://acme.ai
```

It writes `./deck-brief/input-inventory.json` — one row per path/URL with an
extension-and-name-based `type` + `role_hint` guess (zero tokens, no network). Read it,
then **you** refine: a `.pdf` could be a brand guide, a company deck, or a research
report — the script marks it `pdf`; you decide from the user's words and, if needed, a
look at the file. URLs and things pasted in chat are classified by you.

Record the result as `detected_inputs[]` in `input-evidence.json` (schema in
[`references/input-evidence-schema.md`](references/input-evidence-schema.md)). Cover
the situations in that schema's `type` list: prompt-only, logo, website, social, brand
guide, PDF, PPTX, existing company deck, design reference, content source, structure
reference, edit target, screenshots/images, mixed assets, spreadsheet/data, and an
existing DeckCP brand (from `get_brand`).

Also check for an existing DeckCP brand — it is evidence too:

```
whoami
list_decks
get_brand { brand_slug }      # a real palette/logos = a high-authority brand source
```

## Step 2 — acquire evidence (keep acquisition SEPARATE from reasoning)

Acquisition and reasoning are different jobs. Acquire with whatever is available this
session; reason over the result in later steps.

- **Local files** — `deckcp-brand-kit`'s `scripts/extract-brand.js` already reads
  literal tokens from `.svg / .css / .pptx / .pdf` and from a URL (single page). Run it
  to pull brand tokens without tokens; do **not** re-implement extraction here.
- **Website** — Phase 1 acquisition uses existing capability only: `extract-brand.js`
  for the brand tokens of one page, and the agent's own browser/fetch to read company
  copy (positioning, product, proof) and see the visual behavior. **Do not build a
  crawler.** A richer multi-page scrape arrives in Phase 2 as an MCP wrapper
  (`scrape_brand_site`) around the app's existing crawler; this skill is written so
  website evidence can come from that wrapper later without changing the schema.
- **PDF/PPTX** — read text/theme with the existing extractors and the `pdf`/`pptx`
  skills; Phase 2 adds an `import_source` MCP wrapper around the app's mature importer.
- **Social** — Phase 1: record the link and mark `acquisition: needs_fetch` /
  `unavailable`; do not scrape it. It informs imagery/tone later.

**The honesty rule:** if a category cannot be retrieved reliably this session, mark it
`status: unknown` (and the input `acquisition: unavailable`). **Never fabricate** a
company fact or a brand hex to fill a gap. An unknown recorded honestly is what lets
the next step ask a good question instead of shipping a wrong deck.

## Step 3 — provenance & confidence (OBSERVED / INFERRED / UNKNOWN)

For every value you record, attach the provenance triple + authority (schema §"Provenance
triple"):

- **`status`**: `observed` (in a source), `inferred` (a defensible DeckCP decision —
  **not** an official fact), `unknown` (not established).
- **`confidence`**: `exact | high | medium | low | inferred`.
- **`source`**: a short literal audit string.
- **`authority`** (on `company` + `brand` values): from the per-dimension table in
  [`references/authority-routing.md`](references/authority-routing.md) §1.

Copy brand hexes **literally** — `#176BFF` stays `#176BFF`. The confidence crosswalk in
the schema keeps this compatible with `brand-kit.json`'s own `literal|sampled|named|chosen`
labels; you are not replacing brand-kit, you are feeding it.

**Never present an inferred value as an official brand rule.** A synthesized secondary
color is `status: inferred`, not "the brand's secondary."

## Step 4 — reference intent (only if a deck/PDF/PPTX was supplied)

Classify what the supplied deck is *for* — `design-reference | company-template |
content-source | structure-reference | edit-target | ambiguous` — using the table in
[`references/authority-routing.md`](references/authority-routing.md) §2. **The default
is not `reference-exact`.** If it is genuinely ambiguous and the answer materially
changes the workflow, that is the one question to ask:

> "Should I match its **design**, reuse its **content**, or **improve it in place**?"

Record it in `reference_intent`. `content-source` and `structure-reference` must never
drive a design-fidelity build; only `design-reference` (sometimes `company-template`)
may. `deckcp-design-director` still makes the final `build_mode` call — you only record
the intent so `deckcp-brand-kit` measures the reference (or doesn't) accordingly.

### Content source vs design source (they are different questions)
"What should the deck SAY" (content source) and "what should it LOOK like" (design
source) are independent. A website, IR page, or imported PDF can be strong CONTENT
evidence while carrying NO usable presentation-design system. Record a `design_source`
signal alongside the content evidence:
- `strong` — an explicit design reference, the user's current company deck/template, a
  formal brand/presentation guide, or GENUINELY rich company design evidence (coherent
  layout/composition/type — not just colors + logo).
- `weak` — only colors/logo/tone are discoverable (typical website). Colors + a logo are
  strong for identity but do **not** constitute a presentation design system.
When `design_source` is `weak`, do NOT let it produce a weak deck: note that
`deckcp-design-director` should pick `build_mode: template-fallback` (design_source:
deckcp_template) and adopt a DeckCP template as the design vocabulary. This never blocks
a build and is never a question to the user — record it and route on.

## Step 5 — conflicts (resolve what you can, flag only what you must)

Run the conflict procedure in [`references/authority-routing.md`](references/authority-routing.md)
§4: group claims per dimension, auto-resolve when one source's authority dominates or
the difference is immaterial, and add to `questions_required` **only** when a conflict
is both material and unresolved. Everything — resolved or not — is recorded in
`conflicts[]` with the chosen value and the reason (an audit trail QC can read).

## Step 6 — decide interaction mode + route (they are different axes)

Apply the adaptive-questioning decision tree ([`references/authority-routing.md`](references/authority-routing.md)
§3) to set `interaction_mode` (`autonomous | minimal_clarification | interview`), and
the route table (§5) to set `recommended_route` (`autonomous | brand-discovery |
interview-led | reference-led | repair-transform`).

They are orthogonal. `interaction_mode: autonomous` + `recommended_route:
brand-discovery` is valid (a website gives the company, so no questions, but the brand
still needs building). Fill `route_reason` in one line.

## Step 7 — write input-evidence.json, ask (if needed), hand off

```bash
bash scripts/scaffold-evidence.sh --out ./deck-brief   # writes the empty template if absent
```

Fill it in (schema in [`references/input-evidence-schema.md`](references/input-evidence-schema.md)),
then:

- If `questions_required` is non-empty → ask them now (batched, ≤3, most-material
  first). Fold the answers back into the evidence (`status: observed`, source
  `"user (chat)"`), and re-evaluate the mode/route.
- Set `handoff.prefill_brief` / `handoff.brand_evidence_ready` so the next skills know
  what's ready.
- Route to exactly one next skill per `recommended_route` (§5). One line to the user
  about what you found and where you're taking them — not a tour.

## Guardrails

- **Never fabricate.** A fact you couldn't find is `unknown`, not a guess. This is the
  whole point of the skill.
- **Inferred ≠ official.** Keep `status` honest; a synthesized choice is never a brand
  rule.
- **Ask the minimum.** Discoverable → don't ask. Immaterial → infer. Only material +
  undiscoverable → ask, and cap it. Many gaps means route to `interview`, not ask ten
  questions.
- **Default reference intent is ambiguous, never reference-exact.**
- **Acquisition ≠ reasoning.** Record what a source *is* even when you can't fetch it
  yet; mark it `needs_fetch`/`unavailable` rather than inventing its contents.
- **Additive only.** Do not modify `brief.json` / `brand-kit.json` / `design-direction.json`
  shapes; write your own artifact and let the owners consume it. Downstream design
  behavior (design-director, FAST/BRAND/REFERENCE-EXACT, QC) is out of scope here.
- **Don't re-do brand-kit's work.** You gather and cite brand *evidence*; brand-kit
  still resolves it into the design system.
