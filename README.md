# DeckCP deck-making skills

A [Claude Code](https://claude.com/claude-code) skill pack for making decks that
actually work — built for **founders, salespeople, and BD** who need a deck to
*make something happen*, not just look finished.

Most AI deck tools skip straight to slides. This pack doesn't. It interrogates
you first, fixes the story, establishes a real design system, and only then
builds — because a deck fails at the narrative level long before it fails at
the design level, and a generated deck fails at the design level the moment
it's built on the generator's defaults instead of your brand. Nothing is called
done until it passes a quality gate.

**v0.9 is one skill, not twenty.** `/deck` runs the whole process over a single
markdown document that lives on your deck, with your sign-off required at every
stage. The old multi-skill chain and its six JSON handoffs are gone; the craft
they encoded is still here, just no longer wearing a schema.

## Start here

1. **Install the pack** (two ways, below — takes a minute).
2. **Connect the DeckCP MCP** — mint a token or use the OAuth connector at
   [deckcp.com/mcp](https://deckcp.com/mcp).
3. **Run `/deck`** — that's the whole thing. It works out where you are and picks up
   from there, whether that's "I have nothing" or "I have a deck and slide 7 is wrong."

## One document, six stages

There is **one artifact**: a markdown document that lives on the deck itself. It starts
as interview notes, gains a slide list, gains a visual line per slide, gets critiqued,
and gets built. You edit it at every stage, and it *is* the state — so nothing asks you
to repeat yourself, and it resumes days later in a different client.

```
/deck
 1 framing    → present or email? who reads it? what has to happen?     ⟶ gate
 2 interview  → out loud, on your phone. pushback included.             ⟶ gate
 3 outline    → headlines that state conclusions, then a visual         ⟶ gate
                line per slide, in plain words you can check
 4 brand      → extract from your logo/site/old deck, or synthesize
 5 build + QC → rendered, scored, fixed. you do nothing here.
 6 edit       → by hand, in the editor. every line. that's the part
                that makes it yours.
```

**Nothing advances without you saying so.** Those three gates are the product. An agent
told "don't rush to build" will still rush to build — so the sign-off is recorded in the
document rather than trusted to the model's good intentions.

**No JSON anywhere.** The document is markdown, because every artifact a human touches
should be in the human's words. Where a script genuinely needs to compute — the slide
check, the design tokens — the machine-readable values ride in frontmatter inside the
same file, exactly how DeckCP slides already work.

### What the outline looks like

```markdown
### 4. We hit $40k MRR in five months
point: growth is real and recent, not a projection
visual: one big number, the $40k, nothing else on it
```

That `visual:` line is the whole visuals stage. Your agent proposes it in plain words;
you edit the sentence. You never learn a layout vocabulary — it maps your phrasing onto
the real archetype when it builds. And **every slide has a visual form**: "just the one
line" is a design, not the absence of one.

Writing the slide list runs a deterministic check — one point per slide, a number budget
(counted in the prose, never in a chart), a visual line on every slide. If most slides
bust the budget it says the real diagnosis: this isn't a broken pitch deck, it's an
email deck, and those have different rules.

### You don't need an account to start, or a form to get one

Stages 1-3 are worth doing with nothing connected — the interview and the
outline are the part that decides whether the deck works. When you want it
built, there's no signup page: your agent creates the workspace itself (no
browser, no password) and hands you a link to claim it with one sign-in. Until
you open that link the workspace belongs to nobody, so there's nothing to
cancel if you walk away.

**One thing makes it yours.** Give it your website and it takes your real
colors, logo and imagery. Give it any deck you've used before and it takes your
fonts too — the one thing a website can't tell it. Give it both and it uses
both. Give it neither and it designs you a system rather than quietly falling
back on a template.

### Then, once it's out the door

`/deckcp-share` sets the gate (public link, email-gated so views become identified
leads, or password). `/deckcp-analyze` reads the per-slide dwell curve like an editor —
the slide where viewers drop off is your next edit. `/github-lookup` and `/deckcp-email`
work the follow-up.


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

Restart Claude Code so the new `SKILL.md` files are picked up, then run `/deck`.

## The skills

Two tiers. **Tier 1** is provider-agnostic deck craft — useful with no DeckCP
account. **Tier 2** drives the DeckCP MCP to build, edit, and share real decks —
the full tool surface is documented in [`MCP-TOOLS.md`](MCP-TOOLS.md).

| Skill | Tier | What it does |
| --- | --- | --- |
| **`deck`** | 2 | **Start here.** The whole process in one skill: framing → interview → outline → visuals → build → hand-edit, over one markdown doc that lives on the deck. A gate at every stage. |
| `deckcp-onboard` | 1 | Start here: checks your setup, orients, and routes you to the right skill with one question. |
| `deck-interview` | 1 | Interview you about audience, goal, ask, and proof — and push back on weak positioning. Emits `brief.json`. Superseded by `deck` stage 2. |
| `deck-outline` | 1 | Build the story spine from the brief before any slides exist. Emits `outline.json` + `outline.md`. Superseded by `deck` stage 3. |
| `deck-critique` | 1 | Pressure-test the story: headline-only read, the skeptic, the 5-second test, proof audit, the ask. Seven findings max, prioritized, with the fix and the skill that makes it. Superseded by `deck`'s critique mode. |
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

## Evals

[`evals/`](evals/) has a with/without-skill ablation harness for
`deck-interview` / `deck-interview-workshop`: scripted founder replies,
identical input to both arms, scored deterministically plus an LLM grader
against a written rubric. `node skill-pack/evals/run.mjs --preflight` first —
see [`evals/README.md`](evals/README.md).

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

- Any MCP client for `/deck` itself — claude.ai (web **and** mobile), Claude Desktop,
  ChatGPT, VS Code, Claude Code. The document lives on the deck, not on disk, so the
  process works on a phone: *talk, don't type.*
- [Claude Code](https://claude.com/claude-code) to install the skill files locally
- Node 18+ for the script-backed skills
- Tier 2 only: the [DeckCP](https://deckcp.com) MCP connected
- `github-lookup`: an authenticated [`gh`](https://cli.github.com) CLI
- `deckcp-email`: `ZAVU_API_KEY` in the environment or `.env.local`

---

Made for [DeckCP](https://deckcp.com) — say the idea, get the slides.
