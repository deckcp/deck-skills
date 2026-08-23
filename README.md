# DeckCP deck-making skills

A [Claude Code](https://claude.com/claude-code) skill pack for making decks that
actually work — built for **founders, salespeople, and BD** who need a deck to
*make something happen*, not just look finished.

Most AI deck tools skip straight to slides. This pack doesn't. It interrogates
you first, fixes the story, establishes a real design system, and only then
builds — because a deck fails at the narrative level long before it fails at
the design level, and a generated deck fails at the design level the moment
it's built on the generator's defaults instead of your brand. Nothing is
called done until it passes a quality gate.

## Start here

1. **Install the pack** (two ways, below — takes a minute).
2. **Connect the DeckCP MCP** — mint a token or use the OAuth connector at
   [deckcp.com/mcp](https://deckcp.com/mcp). *Optional to start:* the Tier 1
   skills (interview, outline, critique, GitHub lookup) work with no account at all.
3. **Run `/deckcp-onboard`** — it checks your setup, orients on your decks and
   brand, asks one question about what you're trying to make happen, and routes
   you to the right skill. New user? It'll walk you into building your first
   real deck end to end.

## The workflow

```
/deck-interview → /deck-outline → /deckcp-brand-kit → /deckcp-design-director → /deckcp-build-deck → /deckcp-share → /deckcp-analyze
   brief.json       outline.json    brand-kit.json          design-direction.json      generate/author → QC     out the door   who viewed / follow-up
                    ↓ /deck-critique  extract/synthesize     + slide-plan.json            ↓ /deckcp-quality-control
                      pressure-test                                                         scored + fixed before "done"
```

1. **`/deck-interview`** — gets grilled *by* your agent: who is this deck for,
   what must it make happen, what's the ask, where's the proof. It pushes back
   on weak positioning instead of politely transcribing it. Emits `brief.json`.
2. **`/deck-outline`** — turns the brief into a story spine, picked for the
   deck type (investor, sales, partnership; live vs. sent-as-link) — so every
   slide earns its place and every headline states a conclusion, not a topic.
3. **`/deckcp-brand-kit`** — decides what the deck is built *on*. Have a
   logo, a brand guide, an old deck, or a website? It **extracts** your real
   brand — literal hex from the SVG, real CSS variables and fonts from the
   site, the PPTX theme slots — and cites every token. Have nothing? It
   **synthesizes** a premium system benchmarked on
   [deckcp.com/templates](https://deckcp.com/templates): one surface pair,
   one accent, one type pairing, one signature device. Then writes it into
   the DeckCP theme (and brand masters, when you own the brand).
4. **`/deckcp-design-director`** — turns the outline + brand/reference into
   the actual art direction for this deck: one visual thesis, build mode
   (`fast` / `brand` / `reference-exact`), deck rhythm, and a binding
   composition packet for every slide. This is the step that prevents the
   generator from interpreting brand prose however it wants. It also decides
   the **visual translation** of each idea — should this be a diagram, a
   spatial plan, a map, a proportion graphic, a photo, or is typography the
   strongest medium here? — so the deck communicates visually, not just in text,
   without forcing graphics where words are stronger. The full path:
   *brand system → design direction → visual translation → per-slide art
   direction → build → visual QC.*
5. **`/deckcp-build-deck`** — drives the [DeckCP](https://deckcp.com)
   pipeline from the brand kit + design plan. It uses constrained server
   generation for fast/brand work and can route geometry-sensitive reference
   matches to precise manual authoring. Then it runs **`/deckcp-quality-control`**:
   every slide rendered and scored on brand accuracy, design/reference fidelity,
   alignment, spacing, visual polish, intentional rhythm/repetition, and
   "does this look AI-made", and fixed until it passes.
6. **`/deckcp-share`** — invite people with roles, or set the gate: public
   link, email-gated (views become identified leads), or password.
7. **`/deckcp-analyze`** — read the per-slide dwell curve like an editor: the
   slide where viewers drop off is your next edit. Then `/github-lookup` +
   `/deckcp-email` to work the follow-up.

And in between: `/deck-critique` to pressure-test the story at any point
(an outline, a built deck, a PDF someone sent you), `/deckcp-read-deck` to
orient on any existing deck, and `/deckcp-edit` to change it — theme, copy,
order — without regenerating.

Steps 1–2 work with **no DeckCP account at all**. Use them with any deck tool.

## Install

**With the DeckCP MCP connected:** ask your agent to call
**`install_deck_skills`** — it fetches these files into your `.claude/skills`.

**Manually** (Node 18+):

```bash
node - <<'JS'
(async () => {
  const fs = require('fs'), path = require('path'), os = require('os');
  const rawBase = 'https://raw.githubusercontent.com/deckcp/deck-making-skills/main';
  const treeApi = 'https://api.github.com/repos/deckcp/deck-making-skills/git/trees/main?recursive=1';
  let dest = '.claude/skills'; // use '~/.claude/skills' to install globally
  if (dest === '~' || dest.startsWith('~/')) dest = path.join(os.homedir(), dest.slice(1));
  const tree = (await (await fetch(treeApi)).json()).tree || [];
  for (const e of tree) {
    if (e.type !== 'blob' || !e.path.startsWith('skills/')) continue;
    const out = path.join(dest, e.path.replace(/^skills\//, ''));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await (await fetch(rawBase + '/' + e.path)).arrayBuffer()));
    if (out.endsWith('.sh')) fs.chmodSync(out, 0o755);
    console.log('wrote', out);
  }
})();
JS
```

Restart Claude Code so the new `SKILL.md` files are picked up, then invoke any
skill by name: `/deck-interview`, `/deck-outline`, `/deckcp-build-deck`.

## The skills

Two tiers. **Tier 1** is provider-agnostic deck craft — useful with no DeckCP
account. **Tier 2** drives the DeckCP MCP to build, edit, and share real decks —
the full 34-tool surface is documented in [`MCP-TOOLS.md`](MCP-TOOLS.md).

| Skill | Tier | What it does |
| --- | --- | --- |
| `deckcp-onboard` | 1 | Start here: checks your setup, orients, and routes you to the right skill with one question. |
| `deck-interview` | 1 | Interview you about audience, goal, ask, and proof — and push back on weak positioning. Emits `brief.json`. |
| `deck-outline` | 1 | Build the story spine from the brief before any slides exist. Emits `outline.json` + `outline.md`. |
| `deck-critique` | 1 | Pressure-test the story: headline-only read, the skeptic, the 5-second test, proof audit, the ask. Seven findings max, prioritized, with the fix and the skill that makes it. |
| `github-lookup` | 1 | Resolve a person from GitHub — username, commit SHA, or email — to a name, profile, and contact. Zero tokens (`gh` CLI). |
| `deckcp-gather-assets` | 2 | Find your own images/videos on disk, dedupe by hash, upload to DeckCP — so slides use your real photos, not stock art. |
| `deckcp-brand-kit` | 2 | The design system the deck is built on: extract the real brand/reference or synthesize one; now records a structured `design_system` (geometry, type scale, imagery, containers, color jobs, chrome, measured fidelity rules) in addition to legacy prose. |
| `deckcp-design-director` | 2 | Outline + brand kit → `design-direction.json` + `slide-plan.json`: visual thesis, build mode, deck rhythm, semantic archetype, density, focal point, composition, hierarchy, image/data treatment, and avoid-list for every slide. |
| `deckcp-build-deck` | 2 | Brief/outline → brand kit → design direction → constrained generate or reference-exact authoring → validate every slide → render → quality gate. |
| `deckcp-quality-control` | 2 | Mandatory final gate: scan + render every slide + sequence review; score seven dimensions (brand, design/reference fidelity, alignment, spacing, polish, intentional rhythm, generic-AI look), fix and re-score. |
| `deckcp-read-deck` | 2 | Orient on an existing deck: structure, rendered slides, and the story its headlines tell. The step before any edit. |
| `deckcp-edit` | 2 | Deterministic edit recipes — theme (colors/fonts/margins), update a slide, reorder, duplicate, delete — validated and rendered after every change. |
| `deckcp-author-slides` | 2 | Manual editing: hand-write slides against the rendering contract — exact words, exact layout, charts, presets, masters — when the pipelines shouldn't decide. |
| `deckcp-share` | 2 | Per-person grants with roles + the deck-wide gate (public / email-gated / password / remix). Asks before widening access. |
| `deckcp-analyze` | 2 | Sessions, engaged time, per-slide dwell and drop-off — turned into "fix this slide, follow up with these two people". |
| `deckcp-capture` | 2 | Capture a person into the CRM from anything — a chat, a card photo, a memo, a GitHub commit. Email optional; the note carries the context. |
| `deckcp-voice-memos` | 2 | Semantic search over your voice-memo transcripts — turn a recorded pitch into deck material, a mentioned person into a contact, a call into a citable fact. |
| `deckcp-email` | 2 | Email a contact or lead via the Zavu API — cc, reply-to, dry-run preview by default. Needs `ZAVU_API_KEY`. |

### Roadmap

Planned next (see [`manifest.json`](manifest.json) for the full inventory and status):

- **Analysis** — `deck-analyze-multi` (run the investor / sales / skeptic /
  5-second lenses as separate passes and synthesize). The consistency and
  visual scans landed inside `deckcp-quality-control`.
- **Voice** — `deck-writing-samples` distills your tone from things you've written.
- **Brand record write** — `deckcp-brand-kit` writes the deck theme and
  brand masters today; the brand record itself (palette/logos/guidelines) is
  still pasted into the web UI until the MCP grows a brand-write tool.

## Design principles

- **Scripts over tokens.** Deterministic bash/node does the heavy lifting for
  free — asset dedup, hashing, consistency scans, GitHub lookups, sending mail.
- **Right model for the step.** Pure script where possible; a cheap model only
  for mechanical classification; **your own model, not a downgraded one**, for
  the judgment steps — interview, outline, critique, the QC look — because
  that's where deck quality actually comes from.
- **A real system, a real art direction, then a real gate.** Generation never
  starts on an empty brand or an unplanned visual language, and nothing is
  "done" until it has been rendered, scored, and fixed.
- **Useful before you sign up.** Tier 1 stands on its own. If it makes your
  story better, Tier 2 is waiting.

## Requirements

- [Claude Code](https://claude.com/claude-code) (skills runtime)
- Node 18+ for the script-backed skills
- Tier 2 only: the [DeckCP](https://deckcp.com) MCP connected
- `github-lookup`: an authenticated [`gh`](https://cli.github.com) CLI
- `deckcp-email`: `ZAVU_API_KEY` in the environment or `.env.local`

---

Made for [DeckCP](https://deckcp.com) — say the idea, get the slides.
