# DeckCP MCP — complete tool reference

Every tool the [DeckCP](https://deckcp.com) MCP server exposes — 55 in all —
grouped by what they're for, with access requirements and the skill in this
pack that teaches the workflow around each. Connect the MCP, then any tool
below is callable from your agent.

## How access works

- Your bearer token maps to **one DeckCP user** (`whoami` tells you which).
  All tools run as that user.
- **Read** a deck (render, get): owner, org member, or any share grant.
- **Write** slides (upsert, rewrite, delete, generate): owner, org member,
  or an `editor`/`owner` grant.
- **Sharing tools** are owner-level only (owner, org member, or an `owner`
  grant) — an editor can change slides but not who sees them.
- **Analytics & CRM** are owner/org surfaces — a share grant or public link
  is never enough to see who viewed.
- A per-deck "not authorized" error is not a token problem; share the deck
  with the `whoami` email. A 401 is a token problem; reconnect.

## The deck doc — where every deck-making session starts

| Tool | What it does |
| --- | --- |
| `get_deck_doc` | The deck's process document: framing, interview notes in the user's own words, what it should look like, the slide list with a plain-words visual line each, the art direction, and the agent's read. Its frontmatter says which stage the work is at and which stages the user has SIGNED OFF, so this is how you resume without asking them to repeat themselves. Call it FIRST, and again before every stage. `exists: false` means nothing has run yet. On MCP-Apps hosts it opens an inline editor the user can edit section by section. Returns the slide check whenever `Slides` has content. |
| `update_deck_doc` | Write ONE section (`section` + `markdown`), and/or merge frontmatter (`kind` / `stage` / `brand` / `confirm`). There is deliberately no whole-doc write: the user's own words live in those sections. Every write snapshots the prior doc first, so an edit is undoable. Writing `Slides` returns the lint — one point per slide, the number budget, a visual line on every slide, and whether the density says this is really an email deck. |

Skill: [`deck`](skills/deck/SKILL.md) — the whole process, six stages, one document.

**`kind` sets the rules for everything downstream:** `pitch` (narrated live —
sparse, one point per slide), `email` (read alone — carries more), `both` (a
sparse deck PLUS an appendix; the body is held to the pitch budget).

**Never `confirm` a stage the user didn't confirm out loud.** The gate is
theirs; the frontmatter is only its memory.

## Identity & orientation

| Tool | What it does |
| --- | --- |
| `whoami` | The authenticated user's id + email. Run first; sharing errors resolve to "share the deck with this email". |
| `list_decks` | All non-deleted decks — slug, title, description, audience, slide count. `search` filters by title; `include_archived` optional. |
| `get_deck` | One deck by slug: metadata + ordered slides (id, order, frontmatter, MDX). On MCP-Apps hosts it also opens the inline deck viewer. |
| `install_deck_skills` | Returns the install procedure for this skill pack (repo, raw URLs, a ready-to-run Node script). No auth or deck access needed. |
| `get_started` | Call ONCE on first connect with no specific task: what DeckCP is, the state of this account (empty / imported / active), and the best first moves to offer. Skip it when the user already gave a task. |
| `interview_deck` | The question set no tool can answer for you — audience, the one outcome, the status quo, the proof, the hero fact, the objection, format, voice — routed to four-to-six by product `stage`. Pass `answers` back to get a brief plus the `outline_context` string for `generate_outline`. Static and cheap; at `stage:'idea'` proof is deliberately skipped, because demanding traction that doesn't exist is how decks acquire invented numbers. |
| `get_deck_playbook` | Genre-aware quality rules + audience questions + abstracted exemplars for a `deck_type` (investor / sales / marketing / company_overview / report / franchise), plus the evidence-acquisition and asset decision contracts. |

Skill: [`deckcp-read-deck`](skills/deckcp-read-deck/SKILL.md).

## Deck lifecycle

| Tool | What it does |
| --- | --- |
| `create_deck` | New deck (placeholder first slide). Requires `title` + `brand_slug`; slug auto-derived if omitted. |
| `update_deck` | Metadata + theme: title, description, audience, brand move, archive. `deck_theme` is **shallow-merged** — change `accent` alone; `null` clears a field back to brand default. Fields: `accent`, `secondary`, `fontDisplay`, `fontBody`, `defaultMood`, `pageMargin`. |
| `delete_deck` | ⚠️ Soft-deletes the deck **and all its slides**. Reversible only via the database. Confirm with the user, always. |
| `import_deck` | Converts an external PPTX/PDF into a real editable DeckCP deck — layout, imagery, embedded fonts, and a draft brand distilled from the file. Chunked: a big file returns `status:"in_progress"`, so call again with `job_id` until `done`. This is the tool when the user wants *this file* to become their deck. |
| `create_import_upload` | A signed URL to PUT a local file to, for anything over a few MB — then pass its `path` as `import_deck{upload_path}`. Don't send large base64. |
| `import_source` | READS a PPTX/PDF: text, slide count, draft colors/fonts, media. Creates nothing — evidence for a deck you will author. Never claim you edited a source you only analyzed. |
| `fetch_page` | Fetches one HTML page as evidence (investor relations, newsroom, a product page). The follow-up to a link `scrape_brand_site` discovered. |
| `scrape_brand_site` | A website's company facts, colors, logo and images. Authority: official site. Fonts are NOT extracted. |

Skills: [`deckcp-build-deck`](skills/deckcp-build-deck/SKILL.md) (create),
[`deckcp-edit`](skills/deckcp-edit/SKILL.md) (update),
[`deckcp-brand-kit`](skills/deckcp-brand-kit/SKILL.md) (`deck_theme` is how a
brand kit lands on a deck — it's the highest-precedence layer, so it's also the
safe place to apply a *third party's* brand without touching the user's own).

## Slides — write, validate, view

| Tool | What it does |
| --- | --- |
| `upsert_slides` | Create/replace slides keyed by `(deck_slug, slide_order)`; a version snapshot is saved before overwrite. Each slide takes **either** `mdx_content` or `slide_tree` (editor-native, full fidelity). Strips inline styles from MDX — `deck-*` vocabulary classes only. Use order gaps of 10. |
| `rewrite_slide` | AI copilot rewrites ONE slide from a natural-language instruction; it sees the current slide, contract, and brand lockdown, persists the result, and returns a fresh `check_slide` report. |
| `delete_slides` | Soft-delete slides by id (ids from `get_deck`). |
| `reorder_slides` | Pass the **complete** id list in the new order; renumbers to 10/20/30; atomic. |
| `duplicate_slide` | Exact copy of one slide, placed after the original (or at a given order). |
| `set_slide_visibility` | Hide/show a slide without deleting it. A hidden slide owns NO page number, so every surface counts the sequence the audience actually sees. |
| `check_slide` | Free, deterministic, no render: class-vocabulary validation, structure lint, layout-balance analysis on the 1920×1080 canvas, catalog-tag advisories. Run before every upsert and after every edit. |
| `render_slides` | Intent first: bare `{deck_slug}` shows the user the inline viewer; `format:'image'` returns bitmaps **only you** can see (for inspecting your own edits); `format:'urls'`/`'html'` return links/snapshots. Rendering is incremental; `refresh:true` after theme/master changes. |

Skills: [`deckcp-edit`](skills/deckcp-edit/SKILL.md),
[`deckcp-build-deck`](skills/deckcp-build-deck/SKILL.md),
[`deckcp-quality-control`](skills/deckcp-quality-control/SKILL.md) (the gate:
`check_slide` on every slide + `render_slides format:'image'` on every slide,
then a six-dimension score and the fix loop).

## Sequences — automated follow-up

| Tool | What it does |
| --- | --- |
| `generate_sequence` | Draft a follow-up sequence (email / wait / branch steps) for a deck and audience. |
| `create_sequence` | Persist a sequence — the tree of steps that drips after a view. |
| `list_sequences` / `get_sequence` | The org's sequences, and one sequence's full step tree + enrollment state. |
| `enroll_lead` / `unenroll_lead` | Put a lead into a sequence, or take them out. One active enrollment per lead per org; unsubscribes and reply-exit are handled server-side. |

No skill yet — `deckcp-analyze` is where the follow-up decision gets made today.

## Generation (server-side AI pipelines)

| Tool | What it does |
| --- | --- |
| `generate_outline` | Context text → outline array + saved `outlineId`. Does not create slides. Pass `brandSlug` so the outline respects the brand lockdown. |
| `generate_slides_from_outline` | Approved outline (`outlineId` or inline array) → finalized on-brand slides written to the deck. |
| `generate_slides_from_text` | One-shot: raw context → slides appended to a deck, optional reference image. Faster but skips the outline-review step — prefer the outline path so the user sees the story before slides exist. |

Skill: [`deckcp-build-deck`](skills/deckcp-build-deck/SKILL.md).

## Templates & design fallback

Use when there is no strong company design source — a template supplies the DESIGN VOCABULARY (typography, grids, spacing, treatments, closing pattern), never the content. Match multi-dimensionally, then apply and recompose to your outline.

| Tool | What it does |
| --- | --- |
| `list_deck_templates` | The design families with matchable metadata (`category`, `use_case`, `tags`, `accent`) + a derived `design_profile` (light/dark, personality, typography, image dependency, data density, composition). No slides. Optional `category` filter. |
| `get_deck_template` | One template's design vocabulary: `deck_theme`, masters, typography, and a per-slide archetype summary (cover/content/closing). Design patterns, not content to copy. |
| `apply_deck_template` | Clone the template's DESIGN into a new deck you own (returns `deck_slug`). The clone carries the template's sample content — then RECOMPOSE to your outline and drop every sample. |

Skill: [`deckcp-design-director`](skills/deckcp-design-director/SKILL.md) (picks `build_mode: template-fallback`) → [`deckcp-build-deck`](skills/deckcp-build-deck/SKILL.md) (apply → adapt → recompose).

## Authoring reference (read-only, no side effects)

| Tool | What it does |
| --- | --- |
| `get_authoring_guide` | The ground truth for writing slides. `topic:'contract'` → MDX rules + class vocabulary + canvas budget; `'components'` → props/examples for ~60+ components and charts (Card, Stat, LineChart, FlowDiagram, Timeline…); `'classes'` → the machine-readable `allowed_classes` array. |
| `get_brand` | Brand record + rendered design lockdown: palette, logos, approved images, guidelines, non-negotiable rules. Fetch before generating or authoring. |
| `list_style_presets` | Named presets usable via `data-preset` on nodes and in masters' title/subtitle zones — built-ins plus the deck's custom presets. |
| `get_masters` | A deck's master slides (named layouts: background, logo slot, title/subtitle presets, footers, decor layer), MERGED across global ← brand ← deck scopes. Assign via `frontmatter.master` in `upsert_slides`. |
| `set_masters` | Replace the master array wholesale (get, modify, PUT back). `scope:'deck'` needs editor access; `scope:'brand'` (owner/org) installs a house style inherited by **every** deck on the brand. Follow with `render_slides refresh:true`. |

Skills: [`deckcp-author-slides`](skills/deckcp-author-slides/SKILL.md) — the
manual-editing skill built on this whole group (contract, presets, masters);
[`deckcp-brand-kit`](skills/deckcp-brand-kit/SKILL.md) — reads `get_brand` as
an extraction source and installs a house style with `set_masters
scope:'brand'`. Note there is **no brand-write tool**: the brand record's
palette/logos/guidelines are edited in the web UI; the kit hands the user the
exact values to paste.

## Assets

| Tool | What it does |
| --- | --- |
| `upload_asset` | Image/video → deck-assets bucket → public URL for slides. Base64 `data` (images, ≤8MB) or `source_url` (required for videos, ≤50MB). |
| `search_assets` | Semantic search over the shared asset library (url, description, tags, similarity) — reuse approved images instead of generating. |
| `search_stock_images` | Real stock photography (Unsplash) for MOOD/CONTEXT/LIFESTYLE only — returns candidates (`url`, `thumb_url`, aspect, author). Use the chosen `url` as `upload_asset { source_url }` (fires the attribution ping). NEVER pass off stock UI as the product, and NEVER label a stock person as a real founder/employee/customer/investor. |

Skill: [`deckcp-gather-assets`](skills/deckcp-gather-assets/SKILL.md).

## Sharing & access

| Tool | What it does |
| --- | --- |
| `list_deck_access` | Every per-person grant + role, the deck-wide `share_mode`, password-set flag, `allow_remix`. Call before any change. |
| `share_deck` | Invite emails with a role (`viewer`/`commenter`/`editor`/`owner`); re-sharing updates the role without re-emailing, so it's also the role-change tool. `notify:false` skips invite mail. |
| `revoke_deck_access` | Remove per-person grants. Does NOT close a public link — check the gate too. |
| `set_deck_share_mode` | The deck-wide gate: `private` / `public` / `email` (viewers identify → become leads) / `password`; plus `allow_remix` (viewers can duplicate as a template). |

Skill: [`deckcp-share`](skills/deckcp-share/SKILL.md).

## Analytics & CRM

| Tool | What it does |
| --- | --- |
| `get_deck_analytics` | One deck's audience: sessions, identified vs anonymous, idle-trimmed engaged time, completions, the per-slide dwell curve, recent sessions. |
| `list_leads` | The org's lead board — everyone who was invited to or viewed the org's decks, overlaid with CRM state (stage, assignee, note, score) and the email journey. Filter by stage/search. |
| `get_lead` | One person by email: CRM state, per-deck engagement (visits, dwell per slide, completion), follow-up email ledger with opens, full activity timeline. |
| `update_lead` | Write the CRM overlay: pipeline stage (logged to the timeline), note, assignee, editable contact fields. Only for people with existing activity. |
| `create_contact` | Manually add a contact with no deck activity (business card, a call). Email optional; when given, upserts-by-email. |

Skills: [`deckcp-analyze`](skills/deckcp-analyze/SKILL.md) (paired with
[`deckcp-email`](skills/deckcp-email/SKILL.md) for the follow-up);
[`deckcp-capture`](skills/deckcp-capture/SKILL.md) for `create_contact` —
getting people into the CRM from cards, memos, GitHub, or a conversation.

## Personal

| Tool | What it does |
| --- | --- |
| `search_voice_memos` | Semantic search over the account's voice-memo transcripts — ranked by meaning, returns date/place/topic + excerpt (`full_transcript` for the whole thing). Feeds `create_contact` ("the founder I met Tuesday") and deck context. |

Skill: [`deckcp-voice-memos`](skills/deckcp-voice-memos/SKILL.md).

## Coverage map

| Group | Tools | Documented by |
| --- | --- | --- |
| The deck doc | 2 | `deck` — the entry point; every session starts with `get_deck_doc` |
| Identity & orientation | 7 | `deck` (`interview_deck`, `get_deck_playbook`), `deckcp-read-deck`, README (install) |
| Deck lifecycle | 8 | `deck`, `deckcp-build-deck`, `deckcp-edit`, `deckcp-brand-kit` (`update_deck.deck_theme`) — `delete_deck` intentionally has no skill |
| Slides | 8 | `deckcp-edit`, `deckcp-build-deck`, `deckcp-quality-control` (`check_slide` + `render_slides` as the gate) |
| Sequences | 6 | no skill yet — the follow-up decision is made in `deckcp-analyze` |
| Generation | 3 | `deckcp-build-deck` — `generate_slides_from_text` mentioned here only |
| Templates & design fallback | 3 | `deckcp-build-deck`, `deckcp-design-director` |
| Authoring reference | 5 | `deckcp-author-slides` (manual editing: contract, presets, masters), `deckcp-brand-kit` (`get_brand` as source, `set_masters` for the house style) |
| Assets | 3 | `deckcp-gather-assets` — `search_assets` and `search_stock_images` mentioned here only |
| Sharing | 4 | `deckcp-share` |
| Analytics & CRM | 5 | `deckcp-analyze`, `deckcp-capture` |
| Personal | 1 | `deckcp-voice-memos` |

---

Generated from the MCP server's own tool schemas. If a tool call disagrees
with this page, the server is right — file an issue.
