# Authority, reference-intent, questioning & routing

The decision tables behind `deckcp-input-intelligence`. Kept out of `SKILL.md` so the
skill stays a readable procedure. Claude does the reasoning; these are the rules it
reasons with.

---

## 1. Source authority — per dimension, not one global ranking

There is **no single "most authoritative source."** A website out-ranks a logo for
*company facts*; a logo out-ranks a website for *the exact primary hex*. Resolve each
dimension with its own order, highest → lowest:

| Dimension | Authority order (high → low) |
| --- | --- |
| **Intent / goal** | explicit user instruction **only** (never inferred as high) |
| **Explicit overrides** | explicit user instruction only |
| **Brand color / type** | brand_guide → company_template (own PPTX/brand record) → logo (for its own literal hexes) → official_website CSS → official_social → industry_inference → synthesis |
| **Brand logo / mark** | brand_guide → user-supplied logo file → official_website assets → official_social → synthesis (wordmark only) |
| **Complete design system** (chrome, layout, imagery behavior) | design_reference (a measured deck) → brand_guide → company_template → official_website application → synthesis. **A logo alone is weak here** — it gives color, not a system. |
| **Company facts** (name, positioning, product, market, proof) | explicit user text → official_website → official_collateral → company_template (their deck) → official_social → voice-memo/CRM → industry_inference |
| **Design / layout reference** | the deck the user says "match this" → brand_guide → official_website application → synthesis |
| **Narrative / structure** | explicit user ask → reference deck (only if intent = structure-reference) → category template |
| **Imagery** (photos, product shots) | user assets → official_website images → official_social → brand_guide → (stock, last resort) |

**The override rule.** An explicit user instruction *re-weights* a source for one
dimension. "Match this deck exactly" promotes that deck to design truth for the
*design-system* dimension (but not necessarily for *company facts*). "Use our real
colors, ignore the site" demotes the website for the *brand-color* dimension only.
Authority is a **default that instruction overrides**, never a constant.

Do not build numeric scores. The enum + a one-line reason per resolved dimension is
enough and stays auditable.

---

## 2. Reference-intent — what a supplied deck/PDF/PPTX is *for*

When any deck/PDF/PPTX is supplied, classify intent **before** using it. **The default
is `ambiguous`, never `reference-exact`.** Sending every uploaded deck to
reference-exact is the exact failure this step prevents.

| User words / cues | `classification` | What it feeds | Route effect |
| --- | --- | --- | --- |
| "make it look like this", "match this style", "same design team" | **design-reference** | brand-kit measurement → design-director may pick `reference-exact` | reference-led |
| "this is our deck", "our current template", "our house style" | **company-template** | brand-kit extracts brand + chrome; content optional | brand-discovery / reference-led |
| "use the info in this", "pull the numbers/content from this" | **content-source** | facts → `company`/`content` → `brief.json`. **NOT a design source.** | whatever the brand path needs |
| "same flow", "similar narrative", "structure like this" | **structure-reference** | its spine informs `outline.json`; not a design source | interview-led / autonomous |
| "improve this", "polish this", "fix this deck" | **edit-target** | the deck itself is the thing being changed | repair-transform |
| *(a deck appears, no verb, unclear)* | **ambiguous** | nothing yet | ask ONE question (below) |

**The one question**, only when ambiguous *and* the answer materially changes the
workflow:

> "Should I match its **design**, reuse its **content**, or **improve it in place**?"

`content-source`, `structure-reference` → the deck must **never** drive
`reference-exact`. Only `design-reference` (and sometimes `company-template`) may.
`deckcp-design-director` still owns the final `build_mode` decision (fast / brand /
reference-exact) from `brand-kit.json`; input-intelligence only records the intent so
brand-kit measures (or doesn't) accordingly.

---

## 3. Adaptive questioning — discover, then decide, then (maybe) ask

For every fact the deck needs (goal, audience, brand color/type, company facts, proof,
the ask, reference intent):

```
Can I discover it from the supplied evidence (files / URL / get_brand / chat)?
   └─ YES → fill it, cite provenance, DO NOT ASK.
   └─ NO  → Does the missing answer MATERIALLY change the deck?
              ├─ NO  → infer cautiously; status="inferred"; record in `missing` (material:false). DO NOT ASK.
              └─ YES → add to `questions_required`.
```

Then choose `interaction_mode` from how many *material* gaps survived:

| Material gaps after discovery | `interaction_mode` | Behavior |
| --- | --- | --- |
| 0 | **autonomous** | zero questions — write evidence, route, proceed |
| exactly 1 (usually the goal) | **minimal_clarification** | ask that one question, then proceed |
| several, or almost no usable evidence | **interview** | hand to `deck-interview` for the full conversation |

**Caps.** Never ask more than ~1–3 questions here; batch them; most-material first.
Input-intelligence is not a questionnaire — if there are many gaps, that *is* the
signal to route to `interview`, not to ask ten questions itself.

**Zero-question conditions** (all must hold for `autonomous`):
1. `intent.goal` is explicit (`goal_confidence` ≥ `high`);
2. brand evidence reaches ≥ `medium` on color **and** type (or a real `get_brand`);
3. company evidence yields at least positioning + one proof at ≥ `medium`;
4. no material unresolved conflict.

When (1) holds but (2)/(3) are thin, that is `autonomous` interaction with a
`brand-discovery` route — proceed without questions, let brand-kit do the building.

---

## 4. Conflict resolution

```
1. Normalize each source's claim per dimension (colors: compare hue; facts: contradiction).
2. A conflict = ≥2 claims disagree beyond tolerance on one dimension.
3. Resolve automatically when EITHER:
     • one claim's authority strictly dominates for that dimension (§1), OR
     • the difference is immaterial to the deck.
   → record in `conflicts[]` with resolution:"auto", chosen.value, chosen.reason.
4. Ask ONLY when material AND authority is tied/ambiguous.
   → resolution:"ask", add to `questions_required`.
```

Worked example (Scenario I — blue logo, green website, orange old deck):
- Dimension = brand primary color. Authority for *brand color*: logo (own literal hex)
  vs website CSS vs an **old** deck. The old deck loses on **freshness**; logo vs
  current site is the real contest. If the logo is an SVG literal (`exact`) and the
  site is JS-rendered/uncertain, the logo wins → `auto`. If both are strong and they
  genuinely disagree on the *identity* color, that is material + tied → `ask` one
  question. Everything lands in `conflicts[]` either way.

`freshness` values: `explicit_date` | `file_mtime` | `http_last_modified` | `unknown`.
Newer official material out-ranks older when authority ties.

---

## 5. Routes (the skill chain that runs next)

`recommended_route` is orthogonal to `interaction_mode` (see the schema). Values:

| Route | When | Next chain |
| --- | --- | --- |
| **autonomous** | goal known + brand & company evidence sufficient | pre-fill `brief.json` → `deck-outline` → `deckcp-brand-kit` (extract) → `deckcp-design-director` → build → QC |
| **brand-discovery** | company evidence ok, brand missing/empty/logo-only | `deckcp-brand-kit` (extract what exists, synthesize the rest) → design-director → build → QC |
| **interview-led** | little usable evidence (prompt-only, vague) | `deck-interview` → `deck-outline` → brand-kit → design-director → build → QC (**the legacy flow**) |
| **reference-led** | a deck supplied **and** intent ∈ {design-reference, company-template} | `deckcp-brand-kit` (measure the reference) → design-director (`brand`/`reference-exact`) → build → QC |
| **repair-transform** | intent = edit-target ("improve this deck") | `deckcp-read-deck` → `deckcp-edit` (targeted redesign, **not** a rebuild) |

Downstream design behavior (design-director, build modes, QC) is **unchanged** — the
route only decides *which* existing skills run and *what evidence* they start from.
