# input-evidence.json — Complete Schema

`input-evidence.json` is the **upstream evidence record**: what the user gave, what
each thing is, what we can conclude from it, where every conclusion came from, and
how sure we are. It is written **before** `deck-interview`, `deck-outline`,
`deckcp-brand-kit`, and `deckcp-design-director` run, and it is **additive** — if the
file is absent, every existing skill behaves exactly as it did before.

It is **not** a replacement for any existing artifact:

| Artifact | Owns |
| --- | --- |
| `input-evidence.json` | what we know and **where it came from** (evidence + provenance + routing) |
| `brief.json` | the resolved **story** (audience, ask, proof) |
| `brand-kit.json` | the resolved **brand / design system** |
| `design-direction.json` / `slide-plan.json` | the resolved **art direction** (v0.8.2, untouched) |

Downstream skills *consume* `input-evidence.json` to skip work already done (a fact
already observed is not asked again; a color already extracted is not re-extracted).
They never treat it as the final answer — `brand-kit.json` is still the brand truth,
`brief.json` is still the story truth. This file only records the evidence that feeds
them.

## Complete shape

```json
{
  "schema_version": "1.0",
  "generated_by": "deckcp-input-intelligence",
  "generated_at": null,

  "detected_inputs": [
    {
      "id": "in1",
      "raw": "https://acme.ai",
      "channel": "url",
      "type": "website_url",
      "role_hint": "company_source",
      "acquisition": "fetched",
      "notes": "official marketing site"
    },
    {
      "id": "in2",
      "raw": "./deck-assets/acme-logo.svg",
      "channel": "file",
      "type": "logo",
      "role_hint": "brand_source",
      "acquisition": "on_disk",
      "notes": "vector wordmark + mark"
    }
  ],

  "intent": {
    "goal": "investor",
    "goal_confidence": "exact",
    "explicit_overrides": [],
    "notes": "user said 'make me a 12-slide investor deck'"
  },

  "deck_purpose": "Raise a seed round from generalist VCs by proving AI logistics traction.",

  "audience": {
    "value": "seed-stage generalist VC",
    "status": "inferred",
    "confidence": "low",
    "source": "goal=investor default; not stated"
  },

  "company": {
    "name":        { "value": "Acme AI", "status": "observed", "confidence": "high", "authority": "official_website", "source": "acme.ai <title> + og:site_name" },
    "positioning": { "value": "AI that automates warehouse inventory counts", "status": "observed", "confidence": "high", "authority": "official_website", "source": "acme.ai hero H1" },
    "product":     { "value": "computer-vision inventory agent", "status": "observed", "confidence": "medium", "authority": "official_website", "source": "acme.ai /product" },
    "market":      { "value": "mid-market 3PL warehouses", "status": "inferred", "confidence": "low", "authority": "industry_inference", "source": "positioning implies" },
    "proof":       [ { "value": "'trusted by 40 warehouses'", "status": "observed", "confidence": "medium", "authority": "official_website", "source": "acme.ai logos strip" } ]
  },

  "brand": {
    "colors": [
      { "value": "#176BFF", "role_hint": "primary", "status": "observed", "confidence": "exact",  "authority": "logo",            "source": "acme-logo.svg fill x14" },
      { "value": "#0B1020", "role_hint": "text",    "status": "observed", "confidence": "high",  "authority": "official_website", "source": "site :root --ink" },
      { "value": "#FFFFFF", "role_hint": "bg",      "status": "observed", "confidence": "high",  "authority": "official_website", "source": "site body background" }
    ],
    "fonts": [
      { "value": "Inter", "role_hint": "body", "status": "observed", "confidence": "high", "authority": "official_website", "source": "site font-family + Google Fonts link" }
    ],
    "logo": { "value": "./deck-assets/acme-logo.svg", "status": "observed", "confidence": "exact", "authority": "logo", "source": "user-supplied SVG" },
    "visual_behavior": { "value": "screenshots framed in rounded panels on white", "status": "observed", "confidence": "medium", "authority": "official_website", "source": "acme.ai screenshots" }
  },

  "content": [
    { "kind": "problem", "value": "manual inventory counts take 3 days/month per warehouse", "status": "observed", "confidence": "medium", "source": "acme.ai /product" },
    { "kind": "stat",    "value": "40 warehouses live",                                        "status": "observed", "confidence": "medium", "source": "acme.ai logos strip" }
  ],

  "imagery": [
    { "ref": "https://acme.ai/img/dashboard.png", "kind": "screenshot", "status": "observed", "source": "acme.ai og:image" }
  ],

  "reference_intent": {
    "present": false,
    "classification": "none",
    "confidence": "unknown",
    "signals": [],
    "target_ref": null,
    "notes": "no deck/pdf/pptx supplied"
  },

  "conflicts": [],

  "missing": [
    { "field": "audience", "material": false, "why": "investor default is safe enough to proceed; refine at interview" }
  ],

  "questions_required": [],

  "interaction_mode": "autonomous",
  "recommended_route": "autonomous",
  "route_reason": "explicit goal + sufficient company & brand evidence from site + logo; nothing material missing",

  "handoff": {
    "prefill_brief": true,
    "brand_evidence_ready": true,
    "notes": "deck-interview should confirm, not re-ask; brand-kit should EXTRACT from brand[] before any synthesis"
  }
}
```

## Field guidance

### `detected_inputs[]`
One row per thing the user supplied. Keep `raw` literal (the URL, the filename, or
`"chat text"`). Vocabulary:

- **`channel`**: `prompt` · `url` · `file` · `attachment` · `mcp_brand` (an existing
  DeckCP brand seen via `get_brand`).
- **`type`**: `prompt_text` · `website_url` · `social_url` · `logo` · `brand_guide` ·
  `pdf` · `pptx` · `company_deck` · `image` · `screenshot` · `spreadsheet` · `data` ·
  `svg` · `deckcp_brand` · `unknown`.
- **`role_hint`** (what it is *for*): `brand_source` · `company_source` ·
  `content_source` · `design_reference` · `imagery` · `data_source` ·
  `intent_signal` · `unknown`. A single input can be reclassified later (a website is
  usually both `brand_source` and `company_source` — pick the dominant hint and note
  the rest).
- **`acquisition`**: `observed_in_chat` · `on_disk` · `needs_fetch` · `needs_import` ·
  `fetched` · `imported` · `unavailable`. **Acquisition is separate from reasoning** —
  a `needs_fetch` input that could not be retrieved this session is recorded, not
  invented, and its dependent evidence is marked `unknown`.

### `intent`
`goal` is the one fact that is **never** inferred at high confidence — inferring the
deck's purpose wrong wastes the whole build. If it is not explicit, `goal_confidence`
is `low`/`inferred` and it usually becomes the single clarification question.
`explicit_overrides` captures literal user instructions that re-weight authority
("match this deck exactly", "use our real colors, ignore the website").

### `company` / `content` / `imagery`
`company` is **facts** (name, positioning, product, market, proof) harvested from
sources — it pre-fills `brief.json`. `content` is narrative raw material (problem,
solution, proof, quotes, stats). `imagery` is usable pictures. Every value carries
`status` + `confidence` + `source`; `company` values also carry `authority`.

### `brand`
Visual-identity signals only. This **feeds** `deckcp-brand-kit`; it does not replace
`brand-kit.json`. Colors/fonts/logo/visual_behavior each carry `status`, `confidence`,
`authority`, `source`. Copy hexes **literally** — never round `#176BFF` to "blue".

### Provenance triple (on every value-bearing field)
- **`status`** — `observed` (directly in a source), `inferred` (a defensible DeckCP
  decision, **not** an official fact), or `unknown` (not established). This is the
  OBSERVED / INFERRED / UNKNOWN contract: an inferred brand choice must never be
  presented as an official brand rule.
- **`confidence`** — `exact | high | medium | low | inferred` (`unknown` when status
  is `unknown`). See the crosswalk below.
- **`source`** — a short literal audit string (`"acme-logo.svg fill x14"`,
  `"site :root --primary"`, `"guide p.4 'Pantone 2935 C'"`).
- **`authority`** — on `company` and `brand` values: `instruction | brand_guide |
  company_template | design_reference | official_website | official_collateral |
  official_social | logo | industry_inference | synthesis`. Authority is **per
  dimension** — see `references/authority-routing.md`.

### `reference_intent`
Set only when a deck/PDF/PPTX is supplied. `classification` ∈ `design-reference |
company-template | content-source | structure-reference | edit-target | ambiguous |
none`. The **default is not `reference-exact`** — see `references/authority-routing.md`.

### `conflicts[]`
A conflict is two sources disagreeing on one dimension. Record every claim with its
`source`/`authority`/`freshness`. `resolution` ∈ `auto | ask | unresolved`; `material`
says whether it changes the deck. Only a material + unresolved conflict becomes a
question.

### `interaction_mode` vs `recommended_route`
**They are orthogonal.** `interaction_mode` (`autonomous | minimal_clarification |
interview`) is *how many questions to ask*. `recommended_route` (`autonomous |
brand-discovery | interview-led | reference-led | repair-transform`) is *which skill
chain runs next*. `interaction_mode: autonomous` with `recommended_route:
brand-discovery` is valid and common (a website gives the company, so no questions,
but the brand still needs building).

### `handoff`
Flags downstream skills read: `prefill_brief` (deck-interview pre-fills from
`company`/`content`/`intent`), `brand_evidence_ready` (brand-kit consumes `brand[]`
before synthesizing).

## Acquired evidence (Phase 4a — extend this store, don't fork it)

Evidence acquired to close a content-preflight `evidence_gap` (via `fetch_page`,
`import_source`, `scrape_brand_site`, `upload_asset`, or a user upload) is
recorded as an `acquired_evidence[]` entry here — the same file, so downstream
skills read one store:

```jsonc
{
  "acquired_evidence": [
    {
      "dimension": "traction",
      "value": "the fact/snippet used",
      "source_url": "https://…",
      "source_type": "annual_report",          // WHAT the source is → drives authority (per dimension)
      "acquired_via": "import_source",          // HOW it arrived (separate from authority)
      "authority": "high",                      // for this dimension, per the input-intelligence model
      "freshness": { "published_date": "2026-02-01", "fetched_at": "2026-…" },
      "observed_status": "observed",
      "confidence": "high"
    }
  ]
}
```

Rules: **authority describes what the source is, not how it arrived** — a
user-uploaded current annual report is `source_type: annual_report` (high
authority for financials); a random uploaded blog PDF is `general_web` (low).
Keep `freshness` only when a source actually states it (`fetch_page` never infers
a date). Newer authoritative evidence wins a tie; an older authoritative source
of a stable fact is not discarded. These entries feed each slide's
`evidence_sources` and let a held slide flip to `kept` on the next preflight.

## Confidence crosswalk (coexists with brand-kit)

`brand-kit.json` colors use extraction-method labels (`literal | sampled | named |
chosen`). `input-evidence.json` uses a general confidence scale. When brand evidence
flows into `brand-kit.json`, map:

| input-evidence `confidence` | brand-kit `confidence` | meaning |
| --- | --- | --- |
| `exact` | `literal` | a literal token in a source (SVG fill, `:root` var, PPTX slot) |
| `high` | `literal` | strong role-named literal (`--primary`, `theme-color`) |
| `medium` | `named` | named but not a hex (a Pantone name, a font named in prose) |
| `low` | `sampled` | approximate (a hex eyeballed from a raster) |
| `inferred` | `chosen` | a DeckCP decision, not from any source |

Both vocabularies stay valid; neither field is removed.
