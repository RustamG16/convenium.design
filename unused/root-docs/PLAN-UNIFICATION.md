---
plan: convenium-design-unification
version: 3
supersedes: v2.1 (same path), v1 (KnowledgeFactory/library/systems/plans/)
written: 2026-09-02
executor: Claude Code, unattended, resumable
status: approved to run
---

# Plan — make Convenium.Design one self-contained system, universal for Codex and Claude

## How to run this

Paste as your first message to Claude Code, from `D:\Analyst_Designer\Convenium.Design`:

> Read `PLAN-UNIFICATION.md` completely, then execute every phase in order without stopping
> for approval. After each phase, run its HALT CHECK. If any check fails, stop immediately,
> write the failure to `PROGRESS.md`, and do not continue. Commit after each phase. Do not
> touch anything under "Out of scope".

**Every decision is made.** There are no approval gates. The human gates of the previous
version are replaced by machine-verifiable HALT CHECKs — a phase either passes its checks and
continues, or stops dead. Nothing is left to runtime judgment except the two items in
*Unresolvable at runtime* below, both of which halt rather than guess.

**Expect this to span more than one session.** Eight phases will exhaust one context window.
That is why every phase commits and updates `PROGRESS.md`: a fresh session reads
`PROGRESS.md`, finds the last completed phase, and resumes at the next one. One take is the
intent, not a constraint on session count.

---

## Decisions — all pre-made

| # | Question | Decision |
|---|---|---|
| 1 | Which repo is the system? | `D:\Analyst_Designer\Convenium.Design`. ConveniumDesign_claude is a donor, then archived. |
| 2 | Where does the knowledge base live? | Inside Convenium.Design, as `Convenium.Design\library\`. Convenium.Design becomes self-contained. |
| 3 | What comes from KnowledgeFactory? | Skills and knowledge only. |
| 4 | Which agents survive? | Only Convenium.Design's — five `.codex/agents/*.toml` specialists plus the Design Director. ConveniumDesign_claude's twelve are not ported. |
| 5 | `three-js-implementation`? | Deleted, not stubbed. |
| 6 | Concept count? | Fixed-three rule removed. Direction is decided by the intake questionnaire; one direction by default; more only when the user asks. |
| 7 | MNEMOSYNE? | Stays in KnowledgeFactory; publishes into `Convenium.Design\library\design-dna\`. |
| 8 | The 70 personal skills? | Folded in during Phase 1. Claude Code reads `C:\Users\Rustam Gurbanov\.claude\skills` directly; approve the out-of-project read once. |
| 9 | A personal skill collides with a plugin skill of the same bare name (`emil-design-eng`, `apple-design`, `gsap-*`, `impeccable`, `seo-audit`, `dataviz`)? | The library keeps the file as the canonical record, but its `hosts` **excludes `claude`** so it is not projected into `.claude/skills` — projecting it would shadow the plugin and create two answers to one name. Still projected for `codex` and `studio`. Never create a variant name like `emil-design-eng-2`. |
| 10 | The three `runtimePrompt`-only skills (`taste-first-experience-design`, `ethical-gamification-systems`, `agent-identity-and-portfolio`)? | `status: stub`, `hosts: ["studio"]`. The Studio needs the registry entry; a three-line stub `SKILL.md` is worse than none, so they are **not** projected as skill bodies for Claude or Codex. |
| 11 | The three `disable-model-invocation: true` skills (`pick-ui-library`, `prototype`, `review-animations`)? | Flag preserved verbatim, `status: manual`, projected normally. They run only when typed. |
| 12 | A personal skill that fits no category? | `99-unsorted`, `defaultOn: false`, `phase: unrouted`, listed in `library/registry/UNSORTED.md`. **Do not guess a category.** |
| 13 | A skill with no derivable phase? | `phase: "unrouted"`, projected, but excluded from `ROUTING-DIGEST.md`'s active table and listed in `library/registry/UNROUTED.md`. |
| 14 | Keep the `garden-*` / `superpowers-*` prefixes? | Yes. Their bare names collide with plugin skills. Everything else drops any prefix. |
| 15 | Push target? | Branch `unification`, pushed to `origin`. **Never push to `main`.** Opening a PR is left to Rustam. |
| 16 | `npm.cmd run check` already failing before any change? | Phase 0 records the baseline. Halt only on a **new** failure, not a pre-existing one. |
| 17 | Where does the final validation happen? | Not in this plan. The end-to-end redesign test needs a real website project; Phase 8 reports readiness and stops. |

### Unresolvable at runtime — halt, do not decide

1. **Two different real `SKILL.md` bodies for the same id.** The precedence rule in
   *Canonical rules* resolves store-vs-store. If two bodies are both real and materially
   different, stop and report both paths. Do not merge, pick, or rename.
2. **A generator would delete a file it did not create.** See the delete budget in Phase 3.

---

## Why this is needed

Convenium.Design's method is sound and is not being replaced. `AGENTS.md` carries token and loop
controls, `START-HERE.md` gates the run at A/B/C, `ARCHITECTURE.md` carries a real routing
table and an accurate post-mortem of the failed all-at-once setup. The problem is underneath.

### Verified defects, audited 2026-09-02

1. **`.agents/skills` is not a path Claude Code loads.** It loads `<project>/.claude/skills`
   and `~/.claude/skills`. Every `$ux-evidence-audit`-style reference in `START-HERE.md` is
   therefore prose in a Claude session — the model improvises the skill instead of loading it.
   All 27 skills are invisible to Claude. Same for the five specialists: `.codex/agents/*.toml`
   is Codex-only.
2. **No `CLAUDE.md` at the Convenium.Design root.** Claude Code has no entry point.
3. **Three stores inside Convenium.Design hold the same skills and disagree**: `.agents/skills`
   (27 `SKILL.md`), `convenium-design-studio/knowledge/skills` (26 folders of `README.md` + `sources/`),
   and `convenium-design-studio/skills.mjs` (24 skills **hardcoded as a JS array**, read by the Studio
   and the `convenium_design_get_context` MCP tool).
4. `gsap-utils` has a `SKILL.md` but no registry entry → loadable, unroutable.
5. `three-js-implementation` is registered in `knowledge/index.json` with a folder but **no
   `SKILL.md` anywhere** → the Studio routes to instructions that do not exist.
6. **Six skills are routable with no body**: `ui-ux`, `apple-design`, `emil-design-eng`,
   `taste-first-experience-design`, `ethical-gamification-systems`,
   `agent-identity-and-portfolio`. Three are recoverable from
   `knowledge/skills/craft/{ui-ux,apple-design,emil-design-eng}/sources/upstream/SKILL.md`
   (15 / 23 / 27 KB); three exist only as a `runtimePrompt` string.
7. **Store D is code, not data** — no generator can maintain a hardcoded array; it drifts silently.
8. **One rule change costs eleven edits.** The fixed-three rule is written in `AGENTS.md` ×2,
   `START-HERE.md`, `ARCHITECTURE.md` ×2, `concept-studio/SKILL.md` ×3,
   `award-rubric/SKILL.md` ×2, `olympus-design-director/SKILL.md`, `routing-contract.md`,
   `templates/02-concepts.md` ×2, `skills.mjs`, and the Studio `README.md` mirror.
9. **No taste memory.** `reference-deconstruction` extracts transferable visual logic; the run
   uses it and discards it. `library/design-dna/` was built for this and is empty. Effort never
   compounds — run fifty-one costs what run one cost.
10. **Greenfield has no entry.** `START-HERE.md` assumes an existing page; `ux-evidence-audit`
    is explicitly dormant for greenfield, so new work falls through the routing table.

## Target architecture

```
D:\Analyst_Designer\Convenium.Design\
├── library/                        ← SOURCE OF TRUTH, authored here and only here
│   ├── skills/<category>/<id>/SKILL.md
│   ├── agents/<name>.md              5 specialists + director, host-neutral
│   ├── doctrines/                    4 design doctrines (from ConveniumDesign_claude)
│   ├── knowledge/                    MNEMOSYNE's verified conclusions
│   ├── registry/                     skills.registry.json · tools/plugins/presets.json
│   │                                 external-skills.json · ROUTING-DIGEST.md
│   │                                 UNROUTED.md · UNSORTED.md
│   ├── schemas/                      taste-profile.schema.json
│   ├── design-dna/                   the persistent taste profile
│   └── tools/                        verify.py · build_index.py · project.py
│
│         generated, never hand-edited
│   ┌──────────────┬─────────────────┬──────────────────┐
│   ▼              ▼                 ▼                  ▼
├── .claude/     .agents/skills   .codex/agents    convenium-design-studio/
│   skills/ agents/   (Codex)      (Codex)          knowledge/ + skills.registry.json
│   (Claude Code)
│
└── AGENTS.md · CLAUDE.md · USAGE.md · START-HERE.md · ARCHITECTURE.md · PROGRESS.md
```

**Rule:** a generated tree is disposable. Editing one is a defect; the generator overwrites it.
Every generated directory carries `GENERATED.md` naming its source and rebuild command, plus a
`MANIFEST.txt` listing every file the generator wrote.

### Canonical rules

- One skill = one canonical id = one folder in `library/skills/`. Lowercase kebab-case.
- **`name:` in frontmatter must equal the folder name.** Claude Code keys a skill by its
  directory; disagreement is how a skill silently fails to load.
- Precedence when stores disagree, highest wins: a real `SKILL.md` with a body → the
  `sources/upstream/` copy → an ConveniumDesign_claude copy → a `runtimePrompt`-only entry (becomes a
  stub per decision 10).
- Plugin skills are never copied into the library as bodies — they are installed, not owned.
  They are declared in `library/registry/external-skills.json`.

---

# Phases

## Phase 0 — safety net, off-machine

1. In `D:\Analyst_Designer\Convenium.Design`: `git status`. Stage and commit everything present
   (`git add -A`, message `pre-unification snapshot`). Note that `convenium-design-studio/data/*.jsonl`
   and `node_modules/` are gitignored — **the snapshot does not cover run data**, which is
   correct but means `data/` is protected only by this plan's out-of-scope rule.
2. `git tag pre-unification`.
3. `git checkout -b unification`.
4. `git push -u origin unification` and `git push origin pre-unification`. The tag on the
   remote is the real safety net — it survives the machine.
5. Same in `D:\KnowledgeFactory`: commit, tag `pre-unification`, and push **only if a remote
   is configured**. If none, record that in `PROGRESS.md` and continue.
6. Record the pre-change baseline in `PROGRESS.md`: skill counts per store
   (`.agents/skills`, `convenium-design-studio/knowledge/skills`, `skills.mjs` entries,
   `~/.claude/skills`), the output of `npm.cmd run check` in `convenium-design-studio`, and whether it
   passed. This baseline is what later phases compare against.

**HALT CHECK:** both repos clean; `unification` branch exists and is pushed;
`pre-unification` tag exists on `origin`; `PROGRESS.md` records all five counts and the
`npm check` baseline.

## Phase 1 — build the library

1. Copy `D:\KnowledgeFactory\library\` → `Convenium.Design\library\`, taking **skills, knowledge,
   doctrines, schemas, tools** only.
   **Do not copy `library/agents/`** (decision 4) or `sources/`, `frames/`, `design-dna/`,
   `layout/`, `motion/`, `typography/` (MNEMOSYNE resolves those by path in KnowledgeFactory).
   Create an empty `library/design-dna/` as the publish target.
2. Fold in the six Studio-store skills. Verify against the live tree; the audit found:

   | id | Body source | Category | Registry fields |
   |---|---|---|---|
   | `ui-ux` | `knowledge/.../craft/ui-ux/sources/upstream/SKILL.md` | `01-design-direction` | phase `diagnose`, group `Craft`, defaultOn `true` |
   | `apple-design` | `.../craft/apple-design/sources/upstream/SKILL.md` | `01-design-direction` | phase `direct`, group `Craft`, defaultOn `true` |
   | `emil-design-eng` | `.../craft/emil-design-eng/sources/upstream/SKILL.md` | `01-design-direction` | phase `build`, group `Craft`, defaultOn `true` |
   | `taste-first-experience-design` | runtimePrompt → stub (decision 10) | `01-design-direction` | phase `direct`, group `Experience`, defaultOn `false` |
   | `ethical-gamification-systems` | runtimePrompt → stub | `11-meta-system` | phase `direct`, group `Progression`, defaultOn `false` |
   | `agent-identity-and-portfolio` | runtimePrompt → stub | `11-meta-system` | phase `prepare`, group `Agents`, defaultOn `false` |

3. **Fold in the 70 personal skills** from `C:\Users\Rustam Gurbanov\.claude\skills`. Approve
   the out-of-project read once. Apply decisions 9, 11 and 12. This fills the empty
   `05-content-copy` and `06-marketing-growth` categories and resolves the eight external ids
   the old ConveniumDesign_claude loadouts referenced.
4. **Delete `three-js-implementation`**: its `customSkills` entry in `knowledge/index.json`
   and its `knowledge/skills/spatial/` folder.
5. Bring the four doctrines from `ConveniumDesign_claude\profiles\doctrines\` into `library/doctrines/`
   as **knowledge, not agents** — `profile.json` + `design.md` each. They become direction
   input to the questionnaire, which is what gives Convenium.Design the problem-type routing it lacks.
6. Bring `convenium-design-taste-interview`, `convenium-design-style-picker` and `taste-profile.schema.json` from
   ConveniumDesign_claude. These are load-bearing under decision 6.
7. Build `library/registry/skills.registry.json`, one record per skill:
   ```json
   { "id": "...", "name": "...", "phase": "always|diagnose|direct|prepare|build|verify|unrouted",
     "group": "...", "defaultOn": false, "description": "...", "runtimePrompt": "...",
     "category": "...", "hosts": ["claude","codex","studio"], "status": "active|stub|manual" }
   ```
   Seed `phase`/`group`/`defaultOn`/`runtimePrompt` from `skills.mjs` for the 24 that have
   them; derive the rest from `ARCHITECTURE.md`'s routing table; anything underivable gets
   `unrouted` per decision 13.
8. Copy `skills.mjs`'s `tools`, `plugins`, `presets` arrays verbatim into
   `library/registry/{tools,plugins,presets}.json`.
9. Fix `library/tools/origins.json` for the new location. Run `verify.py`, `build_index.py`.
10. Write `library/registry/UNROUTED.md` and `UNSORTED.md`.

**HALT CHECK:** `verify.py` exits 0. Exactly one registry record per skill folder and one
folder per record. No `library/agents/` content from ConveniumDesign_claude. No `three-js-implementation`
anywhere. Every `phase` is a valid value. Every skill has a non-empty `description`. No two
folders share a canonical id. Total skill count ≥ 52 + 6 + (personal count from the Phase 0
baseline) − (documented duplicates).

## Phase 2 — the agent layer, host-neutral

1. Convert each `.codex/agents/*.toml` into `library/agents/<name>.md`: frontmatter
   (`name`, `description`, `access: read-only|write`, `skills: [...]`) plus the
   `developer_instructions` body verbatim. Five files — `visual-analyst`,
   `independent-critic`, `asset-producer`, `design-engineer`, `analytics-specialist`.
2. Add `library/agents/design-director.md` — the role `START-HERE.md` describes, written down
   as an agent for the first time.
3. Replace the `$skill-name` prose convention inside the instructions with a host-neutral
   marker the generators translate: `$name` for Codex, the Skill tool for Claude.

**HALT CHECK:** six agent files; every skill id they reference exists in the registry with
`status: active`; each has `access` set; the five converted bodies match their `.toml` source
byte-for-byte after marker substitution.

## Phase 3 — generators

Write `library/tools/project.py`, stdlib only, four subcommands, each supporting `--dry-run`:

1. `claude` → `.claude/skills/<id>/` and `.claude/agents/<name>.md` for every record whose
   `hosts` includes `claude`. Agent `tools:` allowlist derives from `access`; read-only agents
   get no Write/Edit.
2. `codex` → `.agents/skills/<id>/` and `.codex/agents/<name>.toml` (existing schema:
   `name`, `description`, `sandbox_mode`, `developer_instructions`).
3. `studio` → `convenium-design-studio/knowledge/skills/<group>/<id>/README.md` and
   `convenium-design-studio/skills.registry.json`. **Merge, never delete, `sources/`** — user notes live there.
4. `digest` → `library/registry/ROUTING-DIGEST.md`: id, phase, one-line description, nothing else.

**Delete budget — the substitute for a human reviewing the dry run.** A generator may delete a
file only if that exact path appears in the target directory's `MANIFEST.TXT` from the previous
run. Deleting anything else — or any file in a directory with no `GENERATED.md` — is a hard
halt, printing the paths. On a first run, where no manifest exists, the generator writes only
and deletes nothing.

**HALT CHECK:** all four `--dry-run` runs exit 0 and write nothing (verify by `git status`
being unchanged). Each dry run's planned delete list is empty on this first pass.

## Phase 4 — cut over

1. Run `project.py codex`, `claude`, `digest`. `.claude/skills` and `.claude/agents` now
   exist — **this fixes defects 1 and 2.**
2. Convert `convenium-design-studio/skills.mjs` from code to data: replace the four literal arrays with
   reads of the registry JSON. **Keep the exported symbol names and field shapes identical** —
   `knowledge.mjs`'s `mergeSkill`, `server.mjs` and `mcp-server.mjs` consume them and must not change.
3. Run `project.py studio`. Leave `knowledge/index.json`'s `overrides` and `sources` alone; user data.
4. Extend `scripts/validate-system.ps1`, keeping every existing check and adding: every registry
   id has a folder in both `.agents/skills` and `.claude/skills` (subject to `hosts`); every
   folder has a record; every agent exists in both host formats; no `GENERATED.md` directory
   differs from a fresh `--dry-run`; `ROUTING-DIGEST.md` ≤200 lines; `CLAUDE.md` and `CODEX.md`
   ≤120 lines each.
5. `npm.cmd run check` in `convenium-design-studio`; start it; confirm `/api/health` responds and
   `convenium_design_get_context` returns an inventory ≥ the Phase 0 baseline count.

**HALT CHECK:** `validate-system.ps1` exits 0. `npm check` result no worse than the Phase 0
baseline. `convenium_design_get_context` count ≥ baseline. `git diff` shows **zero** changes to
`server.mjs`, `knowledge.mjs`, `mcp-server.mjs`, `convenium-design-studio/data/`, `evidence/`,
`handoffs/`, `public/media/`, or any `.olympus/`.

## Phase 5 — direction by questionnaire

**The new rule, written in exactly one place** (`AGENTS.md`), referenced everywhere else:

> Direction is decided at intake, not by generating alternatives. The questionnaire and taste
> profile must resolve direction before Gate A. The default output is **one** direction.
> Produce more only when the user asks for alternatives, and state how many and why.

1. Remove the fixed-three rule from all eleven locations in defect 8. Each becomes a reference
   to the `AGENTS.md` rule, or nothing.
2. **Extend `templates/00-brief.md`'s "Taste references" section into a direction block** with
   exactly these fields, so nothing is invented at runtime:
   - Chosen doctrine (one of `library/doctrines/`, or `none — derive from references`)
   - Structural posture: editorial / dense-systematic / cinematic / conventional
   - Motion posture: none / state-feedback only / scroll-narrative
   - Type and colour logic: one sentence each
   - Explicitly ruled out: list
   - Alternatives requested: no / yes, how many
3. **Make the taste profile load-bearing.** If `library/design-dna/` holds no profile and the
   supplied references do not resolve the direction block, the director runs
   `convenium-design-taste-interview` or `convenium-design-style-picker` **before Gate A** rather than guessing.
   Write the result to `library/design-dna/`; it persists across projects. This is the fix for
   defect 9 — the reason effort starts compounding.
4. Rewrite `concept-studio`: produce the one direction the brief specifies, in full.
   Alternatives are an explicit request, not a default.
5. Rewrite `award-rubric`'s contract: critique the single frozen direction against the brief;
   it may reject it; it may not author a replacement. Its `ARCHITECTURE.md` activation
   condition changes from "three concepts exist" to "a direction is frozen".
6. `templates/02-concepts.md` becomes one direction section, repeatable on request.
7. Give greenfield an entry (defect 10): with no existing page the run starts at the
   questionnaire, `ux-evidence-audit` stays dormant, and `reference-deconstruction` carries the
   evidence phase.

**HALT CHECK:** `grep -ri "exactly three\|three concepts\|three distinct"` across the repo,
excluding `.git`, `node_modules`, `library/knowledge` and this plan, returns **zero** matches.
The direction block exists in `00-brief.md` with all six fields. Regenerate the affected skills
and re-run `validate-system.ps1` — exits 0.

## Phase 6 — dual-host instructions

The trap is writing doctrine twice; two copies drift, both get loaded, and the agent pays for
contradictory guidance.

- **`AGENTS.md` stays the single substantive doctrine.** Do not fork it.
- **New `CLAUDE.md`, ≤120 lines.** Contains only: read order
  (`ARCHITECTURE-ESSENTIALS.md` → `AGENTS.md` → `START-HERE.md`, then only the file the current
  decision needs); the host differences (skills load from `.claude/skills` and are invoked with
  the Skill tool, not `$name`; agents come from `.claude/agents`; PowerShell runs via
  `powershell -File`); and a pointer to `USAGE.md`.
- **New `USAGE.md`** — the human runbook: what the system does, the A/B/C gates in three
  sentences, the kickoff prompt for each host, follow-up commands, and how to rebuild the
  projections.
- `PROMPT.md` becomes the Codex variant, pointing at `USAGE.md`.
- Add `CLAUDE.md` and `USAGE.md` to `validate-system.ps1`'s required files.

**HALT CHECK:** `CLAUDE.md` ≤120 lines and contains no doctrine text duplicated from
`AGENTS.md` (no shared sentence over 15 words). `USAGE.md` carries a kickoff prompt for both
hosts. `validate-system.ps1` exits 0.

## Phase 7 — token discipline and loop guards

1. **Verify duplication is gone.** No two `SKILL.md` files under Convenium.Design share identical content
   except across a generated pair. Check by hash. This is the largest single saving.
2. **Two-stage skill loading**, stated in `AGENTS.md` only: route from `ROUTING-DIGEST.md`
   (one line per skill); load a `SKILL.md` body only after the routing decision; never more
   than one body per phase.
3. **Loop bounds, each written once:** QA repair 2 cycles then escalate; intake asked once in
   one message, never re-asking an answered question; audits never re-run against unchanged
   evidence — the `.olympus/` artifact is the cache.
4. **New anti-loop rule:** if a phase's output is byte-identical to the previous attempt, stop
   and escalate. Two identical outputs mean the model is not converging and a third attempt
   will not either.
5. **Cost feedback.** Convenium.Design has token rules but measures nothing, so they cannot be tuned.
   Record per-run phase counts in `.olympus/run.json`.

**HALT CHECK:** the hash check finds no unexpected duplicate pair. Each of the four loop bounds
and the anti-loop rule appears in exactly one file (`grep -c` per rule = 1).

## Phase 8 — archive and report

1. Confirm nothing under Convenium.Design references `D:\KnowledgeFactory\ConveniumDesign_claude`.
2. Mark `ConveniumDesign_claude` archived with a README pointing at Convenium.Design. **Do not delete it** — the
   dashboard and loadout work has reference value.
3. Commit, push `unification`.
4. Write the final report into `PROGRESS.md`: per-phase pass/fail, final counts, the contents
   of `UNROUTED.md` and `UNSORTED.md`, every duplicate resolved under decision 9, and anything
   that halted.

**Then stop.** The end-to-end validation — one real redesign run, compared against the Phase 0
token baseline — needs a real website project and is not part of this plan.

---

## Out of scope — do not touch

- `mnemosyne/`, `library/sources/`, `library/frames/` in KnowledgeFactory. `config.py` resolves
  them by path.
- `convenium-design-studio/data/`, `evidence/`, `handoffs/`, `public/media/`, any `.olympus/`. User
  records and project evidence. `ARCHITECTURE-ESSENTIALS.md` point 2 forbids it, and the
  Phase 0 snapshot does not cover the gitignored `data/*.jsonl`.
- `server.mjs`, `knowledge.mjs`, `mcp-server.mjs`. Phase 4 changes only where `skills.mjs`
  gets its data.
- `~/.claude/skills` — read it, never modify or delete from it. It stays the global load path.
- `.skill-backups/`, `test_projects/`, `third-party/` licences.
- `main` — every commit lands on `unification`.

## Order

```
0 safety+push → 1 library → 2 agents → 3 generators → 4 cutover
  → 5 questionnaire → 6 dual-host docs → 7 tokens → 8 archive+report
```

Each phase: do the work, run the HALT CHECK, commit with the phase number in the message,
update `PROGRESS.md`. On any halt: stop, record, do not improvise a fix.
