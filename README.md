# The /deck skill kit

`/deck` is a skill kit for founders and salespeople who need a deck that gets a
prospect interested and then gets them to yes. It runs inside the AI you already
use — Claude, ChatGPT, Gemini, Grok, whichever one already has your context —
and it does the whole job, from the first question to the finished slides.

![Use your AI to interview you. Your AI already has your context — your spreadsheets, your numbers, your logos.](https://deckcp.com/blog/deck-skill/use-your-ai.webp)

It starts with an interview: what you're building, why it matters, who it's for.
Your numbers, your voice, the pictures you already have. That becomes an outline.

You then work through the outline together, one slide at a time. What each slide
says and what it leaves out, which number carries it, what it looks like.

Before anything gets built, your AI critiques the outline and you fix what it finds.

Then it builds the deck.

**v0.9 is one skill, not twenty.** `/deck` runs the whole process over a single
markdown document that lives on your deck, with your sign-off required at every
stage. The old multi-skill chain and its six JSON handoffs are gone; the craft
they encoded is still here, just no longer wearing a schema.

## Install

One line, into the current project:

```bash
npx -y giget@latest gh:deckcp/deck-skills/skills .claude/skills --force
```

Use `~/.claude/skills` instead to install globally. Restart your client so the new
`SKILL.md` files are picked up, then run `/deck`.

### What it reports back, and how to turn that off

`/deck` pings us when a stage starts or gets signed off. Stages 1-3 run with nothing
connected, so without it we can't tell whether the interview and the outline are used
at all — only that a deck eventually got built.

It sends four things and no others: the **stage name**, whether it **started or was
signed off**, the **client** (`claude-code`, say), and a **random id** the install
writes once to `~/.deckcp/anon-id`. That id isn't derived from your username,
hostname, IP or account, and can't be linked to one. Delete the file and you're a new
id.

It sends **none of your deck**: no outline, no headline, no numbers, no company name,
no file paths, no IP address. `scripts/ping.sh` has no argument that accepts them.

To switch it off completely:

```bash
export DECKCP_TELEMETRY=0
```

`DO_NOT_TRACK=1` works too. Either check runs before the script reads or writes
anything, so nothing is queued and no id file is created.

**With the DeckCP MCP already connected**, you can skip the command and ask your
agent to call **`install_deck_skills`** — it fetches the same files. To connect the
MCP, mint a token or use the OAuth connector at [deckcp.com/mcp](https://deckcp.com/mcp).

`/deck`'s first question is the only one that changes the path: **new deck, or
improve one you've already got?**

## How it goes

There is **one artifact**: a markdown document on the deck itself. It starts as
interview notes, gains a slide list, gains a visual line per slide, gets critiqued,
and gets built. You edit it at every stage, and it *is* the state — so nothing asks
you to repeat yourself, and it resumes days later in a different client.

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

### 1. The interview

Open whichever assistant already has your spreadsheets, your numbers and your
logos, ask it to interview you, and do it out loud, walking around, on a phone.

Talking gets you a wall of text nobody would ever type, and at this stage that's
the useful thing to have. Five minutes of rambling contains more of your actual
company than anything you'd compose at a keyboard. An agent that skips this step
has to fill sixteen slides from one sentence, which is where generic decks come from.

### 2. The interview becomes an outline

![A raw interview transcript on the left, an arrow, and a structured session outline on the right.](https://deckcp.com/blog/deck-skill/step-2-outline.webp)

That screenshot is our own workshop deck being made — the transcript on the left,
the outline it shipped under on the right.

Headlines state conclusions rather than naming topics. When it proposes a better
headline it keeps your original on a `was:` line, so you can see exactly what
changed and refuse any of it.

Writing the slide list runs a deterministic check: one point per slide, a number
budget (counted in the prose, never in a chart), a visual line on every slide. If
most slides bust the budget it says the real diagnosis — this isn't a broken pitch
deck, it's an email deck, and those have different rules.

### 3. It's often in a rush to build

![AI can add a lot of value, new ideas, and perspective. But it's often in a rush to build.](https://deckcp.com/blog/deck-skill/step-3-critique.webp)

That slide predates this kit, and it turned out to describe us. While we were
building `/deck`, with that exact slide open in the conversation and that exact
failure as the subject, our own agent announced it was "writing it" and started
generating slides. Mid-sentence.

So the gates aren't instructions, because we've now watched an instruction fail
while pointing directly at itself. Each stage ends with your sign-off, and the
sign-off is recorded in the document rather than recalled from earlier in the
conversation. The agent can't advance past you, and it can't decide on your behalf
that a stage looks done.

Critique is a mode it gets held in for the same reason. "Critique my outline, don't
edit it" means findings only, no edits, until you let it out.

### The part nobody has words for

Somewhere between the outline and the deck, a decision gets made about what each
slide looks like. Most tools make it silently, from their own defaults, which is how
you end up with sixteen slides that share a template. `/deck` writes it down, one
line per slide:

```markdown
### 4. We hit $40k MRR in five months
point: growth is real and recent, not a projection
visual: one big number, the $40k, nothing else on it
```

You read that and know immediately whether it's wrong. Then you fix the sentence.

There are nineteen named layout archetypes behind this and you will never see one of
them; the agent maps your sentence to the right name when it builds. Nobody should
have to learn what "split feature" means to say "picture on the left, points on the
right." Text-only slides get a visual line too, because "just the one line, big" is a
real decision about scale and whitespace, and having made no decision is what leaves
you with the defaults.

### 4. Hand it the outline

**One thing makes the deck yours.** Your website gives it your real colors, logo,
company facts and imagery, though not fonts. Any deck you've used before gives it
the fonts and the type scale someone already made decisions about. Both is best.
Neither and it says so, then designs you a system on purpose instead of quietly
inheriting one.

**You don't need an account to start, or a form to get one.** Everything up to the
build runs with nothing connected — the interview and the outline are the part that
decides whether the deck works. When you do want it built there's still no signup
page: your agent creates the workspace itself, without a browser or a password, and
hands you a link. Sign in once and it's yours; until somebody opens that link the
workspace belongs to nobody, so walking away leaves nothing to cancel.

### 5. Editing is yours

![Editing AI writing by hand gives it a real human voice. Yours.](https://deckcp.com/blog/deck-skill/step-5-edit-by-hand.webp)

Every line, by hand. This is the step the kit deliberately doesn't do for you: what's
being assessed in the room is you. Its last useful act is to point at the slides most
likely to read as machine-written, and then stop.

Two other things it won't do. It won't invent proof: a missing number comes back as a
finding, never as a plausible-looking figure. And on an existing deck it won't replace
all thirty slides, because that's a new deck with extra steps and you won't recognise
it as yours. It fixes what the diagnosis names.

## Improving a deck you already have

If you've got a deck — in DeckCP, or a PPTX/PDF you drop in — it **doesn't interview
you.** Your deck already answers most of what an interview asks, and being asked to
re-describe a deck you're holding is insufferable.

Instead it reads the deck, renders every slide and looks at them, and writes the whole
document up front: the outline as it stands, a better headline wherever yours is a
topic label, what the deck currently claims, your real assets, and a diagnosis. It
takes the brand **from your deck**, including the embedded fonts, which a website
can't give it.

Then it shows you that and asks the two or three things your deck can't answer: who is
this for *now*, what's the ask *now*, and what proof do you have that never made it
onto a slide. In most real decks the top finding is the same one: headlines that name
a topic instead of stating a conclusion.

## After it's built

The deck lives on DeckCP, so you send a link rather than a file. `/deckcp-share` sets
the gate (public link, email-gated so views become identified leads, or password).
`/deckcp-analyze` reads the per-slide dwell curve like an editor — the slide where
viewers drop off is your next edit. `/github-lookup` and `/deckcp-email` work the
follow-up, and sequences send it off that signal: wait two days, branch on whether
they reached the ask, send from your own mailbox.

The longer write-up of why it's built this way is on the blog:
[Introducing the /deck skill kit](https://deckcp.com/blog/introducing-slash-deck-skill).

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

A with/without-skill ablation harness runs against `deck-interview` /
`deck-interview-workshop`: scripted founder replies, identical input to both arms,
scored deterministically plus an LLM grader against a written rubric. It lives in
the authoring repo (`skill-pack/evals/`) rather than here, since it isn't part of
what gets installed.

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
