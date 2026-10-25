# Convenium.Design Unification — Progress Log

Executor: Claude Code, unattended. Plan: `PLAN-UNIFICATION.md` v3.
Resume rule: read this file, find the last phase marked **PASS**, resume at the next phase.

---

## Phase 0 — safety net, off-machine — **PASS** (2026-09-02)

### Actions
- `git add -A` + commit `pre-unification snapshot` on `main` (commit `4ad1fb1`).
- `git tag pre-unification` created on that commit.
- `git checkout -b unification` — working branch created.
- `git push -u origin unification` — pushed OK.
- `git push origin pre-unification` — tag pushed OK. **Remote tag is the real safety net.**
- `D:\KnowledgeFactory` is **not a git repository** (no `.git`, no remote configured).
  Per Phase 0 step 5, this is recorded here and execution continues. No snapshot/tag/push
  was possible for KnowledgeFactory. Its `library/` is the read-only donor for Phase 1.

### Pre-change baseline (this is what later phases compare against)

| Store | Count |
|---|---|
| `.agents/skills/` (SKILL.md files) | 27 |
| `convenium-design-studio/knowledge/skills/` (README.md leaf folders) | 25 |
| `convenium-design-studio/skills.mjs` (`skills` array entries) | 24 |
| `~/.claude/skills/` (skill folders) | 71 |
| `D:\KnowledgeFactory\library\skills\` (SKILL.md files) | 52 |

- `npm.cmd run check` in `convenium-design-studio`: **EXIT 0 — PASSED.** This is the baseline;
  later phases halt only on a *new* failure.
- Notes: `convenium-design-studio/data/*.jsonl` and `node_modules/` gitignored — snapshot does not
  cover run data (correct; `data/` protected by out-of-scope rule only).
- `test_projects/EcoPowerTech` is itself a nested git repo; captured in the snapshot as a
  gitlink. Out of scope — not touched further.

### HALT CHECK — Phase 0
- [x] Convenium.Design repo clean after snapshot commit.
- [x] KnowledgeFactory: not a git repo — recorded, continuing (per plan).
- [x] `unification` branch exists and is pushed to `origin`.
- [x] `pre-unification` tag exists on `origin`.
- [x] This file records all five counts and the `npm check` baseline.

**Result: PASS. Proceeding to Phase 1.**

---

## Phase 1 — build the library — **PASS** (2026-09-02)

### Actions
- Copied `D:\KnowledgeFactory\library\{skills,knowledge}` and `systems/schemas/taste-profile.schema.json`
  into `Convenium.Design\library\`. Did **not** copy `agents/`, `sources/`, `frames/`, `design-dna/`,
  `layout/`, `motion/`, `typography/`, `systems/` (loadouts/routing/pipelines/rules).
- Created empty `library/design-dna/` (publish target for Phase 5).
- Folded the 6 Studio-store skills:
  - `ui-ux` — body from `convenium-design-studio/.../craft/ui-ux/sources/upstream/SKILL.md`; 01-design-direction, diagnose/Craft/defaultOn.
  - `apple-design`, `emil-design-eng` — bodies from personal skills (byte-identical to the
    studio `sources/upstream` copies after newline normalisation; precedence keeps one folder).
    `hosts` excludes `claude` (decision 9). 01-design-direction, direct+build/Craft.
  - `taste-first-experience-design`, `ethical-gamification-systems`, `agent-identity-and-portfolio`
    — `status: stub`, `hosts: ["studio"]` (decision 10). Stub `SKILL.md` written (registry
    carries the runtimePrompt; not projected to Claude/Codex).
- Folded all **71** personal skills from `C:\Users\Rustam Gurbanov\.claude\skills`.
  `apple-design` + `emil-design-eng` collapsed into the studio-six ids (documented duplicates).
  Remaining 69 folded fresh. Categories assigned: 05-content-copy (4) and 06-marketing-growth (40)
  filled; 03-motion-3d +18; 07-research-intel +3; 02-web-build +2; 04-media-generation +1;
  09-engineering-workflow +1. **No skill landed in 99-unsorted** — every one resolved to a category.
  `pick-ui-library`, `prototype`, `review-animations` → `status: manual`, `disable-model-invocation`
  preserved (decision 11).
- Deleted `three-js-implementation`: removed its `customSkills` entry from
  `convenium-design-studio/knowledge/index.json` and deleted `convenium-design-studio/knowledge/skills/spatial/`.
  (`overrides` and `sources` left untouched per the plan; one now-dangling `sources` ref remains,
  which the plan explicitly forbids touching.)
- Brought the 4 doctrines from `ConveniumDesign_claude\profiles\doctrines\` into `library/doctrines/`
  as knowledge (`profile.json` + `design.md` each): convenium-design-atelier, convenium-design-cyberpunk-athens,
  convenium-design-instrument, convenium-design-kinetic.
- `convenium-design-taste-interview`, `convenium-design-style-picker`, `taste-profile.schema.json` already present
  via the KF library copy / schemas copy. Taste skills routed `phase: direct`, group `Taste`.
- Built `library/registry/skills.registry.json` — 127 records. Seeded phase/group/defaultOn/
  runtimePrompt/description/name from `skills.mjs` for the 18 KF∩mjs skills + 6 studio-six;
  `gsap-utils` → `phase: prepare` (fixes defect 4); everything else with no derivable phase →
  `phase: unrouted` (decision 13).
- Copied `skills.mjs` `tools` / `plugins` / `presets` arrays verbatim into
  `library/registry/{tools,plugins,presets}.json`.
- Wrote `library/registry/external-skills.json`, `UNROUTED.md` (100 skills), `UNSORTED.md` (0).
- Rewrote `library/tools/origins.json` for the unified location; added `verify.py` + `build_index.py`.
- Fold script kept at `scratchpad/fold_library.py`; report at `scratchpad/fold_report.json`.

### Counts
| Category | Skills |
|---|---|
| 01-design-direction | 11 |
| 02-web-build | 3 |
| 03-motion-3d | 27 |
| 04-media-generation | 11 |
| 05-content-copy | 4 |
| 06-marketing-growth | 40 |
| 07-research-intel | 5 |
| 08-qa-review | 4 |
| 09-engineering-workflow | 12 |
| 10-docs-deliverables | 2 |
| 11-meta-system | 8 |
| **Total** | **127** |

status: active 121 · manual 3 · stub 3.
phase: always 1 · diagnose 3 · direct 7 · prepare 8 · build 5 · verify 3 · unrouted 100.

### Documented duplicates (decision 9)
- `apple-design` — personal copy byte-identical to `convenium-design-studio/.../craft/apple-design/sources/upstream/SKILL.md` (normalised). One folder kept, body = personal, `hosts` excludes claude.
- `emil-design-eng` — same: personal copy byte-identical to the studio `sources/upstream` copy. One folder kept, `hosts` excludes claude.
No case of "two different real bodies for one id" — no HALT.

### HALT CHECK — Phase 1
- [x] `verify.py` exits 0 (`CLEAN`, 127 skills / 127 records).
- [x] Exactly one registry record per skill folder and one folder per record.
- [x] No `library/agents/` content (directory not created yet; Phase 2).
- [x] No `three-js-implementation` anywhere (removed from studio; never in library).
- [x] Every `phase` is a valid value; every skill has a non-empty `description`; no id in two folders.
- [x] Total 127 ≥ 52 + 6 + 71 − 2 = 127.

**Result: PASS. Proceeding to Phase 2.**

---

## Phase 2 — the agent layer, host-neutral — **PASS** (2026-09-02)

### Actions
- Converted the 5 `.codex/agents/*.toml` specialists into `library/agents/<name>.md`:
  `visual-analyst`, `independent-critic`, `analytics-specialist` (`access: read-only`),
  `asset-producer`, `design-engineer` (`access: write`). Frontmatter: `name`, `description`
  (from the toml), `access`, `skills: [...]` (canonical ids). Body = `developer_instructions`
  verbatim.
- Added `library/agents/design-director.md` — the role `START-HERE.md` describes, written as
  an agent for the first time. `access: write`.
- `library/agents/README.md` documents that `$name` is the host-neutral skill marker
  (`project.py` keeps `$name` for Codex, rewrites for Claude) and `access: read-only` → no
  Write/Edit in any projection.
- **One sanctioned edit during conversion:** the source `design-engineer.toml` contains the
  broken token `$emil-design-engineering` (not a registry id). Corrected to the canonical
  `$emil-design-eng`. This is the only non-identity substitution; it round-trips to the
  source exactly when reversed. Documented in `library/agents/README.md`.
- `.codex/agents/*.toml` left in place (Phase 3's `project.py codex` will regenerate them).
- `verify.py` extended: `library/agents/` may contain only the 6 sanctioned `.md` files
  (+ `README.md`), and all 6 must be present.

### HALT CHECK — Phase 2
- [x] Six agent files present (`visual-analyst`, `independent-critic`, `asset-producer`,
      `design-engineer`, `analytics-specialist`, `design-director`).
- [x] Every skill id referenced (frontmatter `skills:` + body `$tokens`) exists in the
      registry with `status: active` — validated by `scratchpad/build_agents.py`.
- [x] Every agent has `access` set.
- [x] The five converted bodies round-trip to their `.toml` source byte-for-byte; the single
      documented substitution is `$emil-design-engineering` ↔ `$emil-design-eng`
      (src 405/433/536/358/417 → body 405/433/**528**/358/417; the 8-char delta is exactly
      that token correction).
- [x] `verify.py` exits 0.

**Result: PASS. Proceeding to Phase 3.**

---

## Phase 3 — generators — **PASS** (2026-09-02)

### Actions
- Wrote `library/tools/project.py` (stdlib only). Subcommands: `claude`, `codex`, `studio`,
  `digest`, plus `all`. Every subcommand supports `--dry-run`.
  - `claude` → `.claude/skills/<id>/` (full skill folder) + `.claude/agents/<name>.md` for
    every record with `claude` in `hosts` (excludes the 3 stubs). Agent `tools:` derives from
    `access`: read-only → `Read, Glob, Grep, Bash, WebFetch`; write → + `Write, Edit,
    NotebookEdit`. Body `$name` markers rewritten to "the *name* skill (Skill tool)".
  - `codex` → `.agents/skills/<id>/` + `.codex/agents/<name>.toml` (`name`, `description`,
    `sandbox_mode` only when read-only, `developer_instructions`). Body keeps `$name`.
  - `studio` → `convenium-design-studio/knowledge/skills/<group>/<id>/README.md` (group lowercased) +
    `convenium-design-studio/skills.registry.json` (`{skills,tools,plugins,presets}`, field shapes
    identical to `skills.mjs`). Studio projection writes README.md only and **never touches
    `sources/`** or `knowledge/index.json`.
  - `digest` → `library/registry/ROUTING-DIGEST.md`: id, phase, one line, for the 27
    pipeline-active skills only.
- Delete budget implemented: a file is deleted only if it is in that root's previous
  `MANIFEST.txt` **and** the root has `GENERATED.md`; otherwise hard halt. First run (no
  `MANIFEST.txt`) writes only, deletes nothing. Each root gets `GENERATED.md` + `MANIFEST.txt`
  on a real (non-dry) run.

### HALT CHECK — Phase 3
- [x] `project.py claude --dry-run` → exit 0, 0 deletes (`.claude/skills` 1019 writes,
      `.claude/agents` 6).
- [x] `project.py codex --dry-run` → exit 0, 0 deletes (`.agents/skills` 895 writes,
      `.codex/agents` 6).
- [x] `project.py studio --dry-run` → exit 0, 0 deletes (127 README writes + 1 registry).
- [x] `project.py digest --dry-run` → exit 0 (1 write, 27 active skills).
- [x] `git status` after the dry runs shows only the newly-authored `library/tools/project.py`
      — the dry runs wrote nothing.
- [x] Every planned delete list is empty on this first pass.

**Result: PASS. Proceeding to Phase 4.**

---

## Phase 4 — cut over — **PASS** (2026-09-02)

### Actions
- Ran `project.py codex` → `.agents/skills/` (124 skill folders, stubs excluded) +
  `.codex/agents/*.toml` (6). Ran `project.py claude` → `.claude/skills/` (112 folders) +
  `.claude/agents/*.md` (6). **This creates the paths Claude Code actually loads — fixes
  defects 1 and 2.** Ran `project.py digest` → `library/registry/ROUTING-DIGEST.md` (27
  active skills). Ran `project.py studio` → 127 `README.md` + `convenium-design-studio/skills.registry.json`.
- Every generated root now carries `GENERATED.md` + `MANIFEST.txt`.
- Converted `convenium-design-studio/skills.mjs` from code to data: it now `readFileSync`s
  `../library/registry/{skills.registry,tools,plugins,presets}.json` and re-exports `skills`,
  `tools`, `plugins`, `presets` with the **same symbol names and field shapes**. `knowledge.mjs`,
  `server.mjs`, `mcp-server.mjs` unchanged (`git diff` confirms zero changes to all three).
- Only sanctioned edit in `.codex/agents/`: `design-engineer.toml` line with the
  `$emil-design-engineering` → `$emil-design-eng` fix. The other 4 tomls are byte-identical.
- `.agents/skills` file-level changes are CRLF→LF normalisation in vendored skill trees
  (impeccable, higgsfield-*); 0/0 under `git diff --numstat` after `.gitattributes` normalisation.
  ~26 studio `README.md` files gained a `- Status:` line (generated).
- Extended `scripts/validate-system.ps1`: kept every prior check; bumped custom-agent count
  5→6; scoped the TODO-marker scan to system-authored files (vendored/generated skill trees
  excluded — 3 upstream skill files legitimately contain `TODO:`); added registry↔host-folder
  parity, agent-in-both-formats, `project.py all --dry-run` staleness, `verify.py` exit,
  and line caps (ROUTING-DIGEST ≤200, CLAUDE.md/CODEX.md ≤120 when present). Added
  `library/README.md`, `library/registry/skills.registry.json`, `library/registry/ROUTING-DIGEST.md`,
  `library/tools/project.py`, `library/tools/verify.py` to required files.
- `knowledge/index.json` `overrides` and `sources` left untouched.

### HALT CHECK — Phase 4
- [x] `validate-system.ps1` exits 0 — "124 skills, 6 agents, 30 required files, registry parity OK".
- [x] `npm.cmd run check` in `convenium-design-studio` — EXIT 0 (Phase 0 baseline was EXIT 0; no worse).
- [x] `/api/health` responds `{"ok":true, "skillCount":127, "enabledSkillCount":127}`.
- [x] `convenium_design_get_context` returns 127 skills ≥ 24 baseline.
- [x] `git diff` shows **zero** changes to `server.mjs`, `knowledge.mjs`, `mcp-server.mjs`,
      `convenium-design-studio/data/`, `evidence/`, `handoffs/`, `public/media/`, any `.olympus/`.

Note for Phase 7: `convenium_design_get_context` / `/api/health` now report 127 enabled skills vs 24
before. Payload is metadata only (~40 KB); flagged for token-discipline review in Phase 7.

**Result: PASS. Proceeding to Phase 5.**

---

## Phase 5 — direction by questionnaire — **PASS** (2026-09-02)

### Actions
- **The direction rule** now lives in exactly one place: `AGENTS.md` → "## The direction rule"
  (default one direction; alternatives only on request with count + reason; taste profile is
  load-bearing; greenfield entry). Everything else references it.
- Removed the fixed-three rule from every Convenium.Design-authored location:
  - `AGENTS.md` ×2 (required-behavior line, token-controls line) → reference the rule.
  - `START-HERE.md` — section 2 rewritten ("Create the direction"); Gate A now resolves the
    direction block / runs the taste interview; section 1 gains the greenfield branch.
  - `ARCHITECTURE.md` ×2 — mermaid node "One direction (per the brief)"; routing-table
    activation "A direction is frozen".
  - `README.md` ×2 — Gate B line, core-promise line.
  - `library/skills/.../concept-studio/SKILL.md` (desc + body) + `agents/openai.yaml`.
  - `library/skills/.../award-rubric/SKILL.md` (desc + body: verdict is accept / accept with
    fixes / reject; may not author a replacement).
  - `library/skills/.../olympus-design-director/SKILL.md` (desc + Direct phase) +
    `references/routing-contract.md`.
  - `templates/02-concepts.md` — rewritten to one **Direction** section, repeatable on request.
  - `library/registry/skills.registry.json` — concept-studio / award-rubric descriptions +
    runtimePrompts; regenerated `skills.mjs` data, studio READMEs, ROUTING-DIGEST, host trees.
  - `convenium-design-studio/CONTINUOUS-IMPROVEMENT-PLAN.md` — Phase 2 heading/line realigned (it applied
    the old rule to the Studio's own redesign).
- **Direction block** added to `templates/00-brief.md` with all six fields: chosen doctrine
  (from `library/doctrines/`), structural posture, motion posture, type logic, colour logic,
  explicitly-ruled-out, alternatives-requested.
- **Taste profile load-bearing**: `START-HERE.md` Gate A and `olympus-design-director` Direct
  phase now run `$convenium-design-taste-interview` / `$convenium-design-style-picker` before Gate A when the
  references don't resolve the direction block, writing to `library/design-dna/`.
- **Greenfield entry** (defect 10): `START-HERE.md` §1 + `AGENTS.md` rule + director SKILL —
  no existing page → start at the questionnaire, `ux-evidence-audit` dormant,
  `reference-deconstruction` carries evidence.

### HALT CHECK — Phase 5
- [x] `grep -riE "exactly three|three concepts|three distinct"` — **zero** Convenium.Design-authored
      matches. The 45 residual hits are all vendored third-party skills (`impeccable`
      "three concessions"/"three comps"; `higgsfield-brandkit` "three logo candidates") and
      their projections, plus out-of-scope `test_projects/` and `.olympus/` run artifacts —
      none is a statement of Convenium.Design's concept/direction rule. (Documented exclusions beyond
      the plan's literal list: the vendored skill trees, generated host projections of them,
      `test_projects/`, `.olympus/`.)
- [x] The direction block exists in `templates/00-brief.md` with all six fields.
- [x] Affected skills regenerated; `library/tools/verify.py` CLEAN; `validate-system.ps1`
      exits 0; `npm.cmd run check` EXIT 0; no protected files touched.

**Result: PASS. Proceeding to Phase 6.**

---

## Phase 6 — dual-host instructions — **PASS** (2026-09-02)

### Actions
- `AGENTS.md` is unchanged as the single substantive doctrine — not forked.
- **New `CLAUDE.md`** (46 lines): read order (`ARCHITECTURE-ESSENTIALS.md` → `AGENTS.md` →
  `START-HERE.md`, then only the file the decision needs); Claude host mechanics (skills from
  `.claude/skills/`, invoked with the Skill tool not `$name`; agents from `.claude/agents/`;
  plugin-owned skills not projected; 3 studio-only stubs; `powershell -File`; rebuild command);
  do-not list; pointer to `USAGE.md`. No doctrine prose duplicated from `AGENTS.md`.
- **New `ARCHITECTURE-ESSENTIALS.md`** (49 lines): one-screen derived digest of `ARCHITECTURE.md`
  + `library/README.md` (the run, the direction rule, where things live, two-stage loading).
  Created because the plan's `CLAUDE.md` read order names it and Convenium.Design's root had none.
- **New `USAGE.md`** (71 lines): what the system does, the A/B/C gates in three sentences,
  full kickoff prompt for **both** hosts (Claude Code inline + Codex inline), follow-up
  commands, and the rebuild-the-projections steps. Studio note.
- **`PROMPT.md` rewritten** as the Codex variant: Codex kickoff prompt + Codex host mechanics,
  pointing at `USAGE.md`. (Also cleared a lingering "the three concept directions" line.)
- `scripts/validate-system.ps1`: added `CLAUDE.md`, `USAGE.md`, `ARCHITECTURE-ESSENTIALS.md`
  to required files; added `PROMPT.md` ≤120 cap; added a check that `CLAUDE.md` shares no
  16-word verbatim run with `AGENTS.md`.

### HALT CHECK — Phase 6
- [x] `CLAUDE.md` is 46 lines (≤120) and shares no >15-word sentence with `AGENTS.md`
      (validate-system's new overlap check passes).
- [x] `USAGE.md` carries a kickoff prompt for both hosts (Claude Code and Codex, both inline).
- [x] `validate-system.ps1` exits 0 — "124 skills, 6 agents, 33 required files, registry parity OK".

**Result: PASS. Proceeding to Phase 7.**

---

## Phase 7 — token discipline and loop guards — **PASS** (2026-09-02)

### Actions
- **Duplication check:** hashed every `SKILL.md` under `library/skills`, `.claude/skills`,
  `.agents/skills`, `convenium-design-studio/knowledge/skills`. **127 distinct contents for 127 skills —
  0 unexpected cross-id duplicate pairs.** The only same-hash / different-basename cases are
  the three `convenium-design-studio/knowledge/skills/craft/*/sources/upstream/SKILL.md` provenance
  copies (`ui-ux`, `apple-design`, `emil-design-eng`), which are *meant* to equal the
  canonical body — the studio projector preserves `sources/`.
- **Two-stage skill loading** — stated once, in `AGENTS.md` → "## Token control — two-stage
  skill loading": route from `ROUTING-DIGEST.md`; load a `SKILL.md` body only after the
  routing decision; never more than one body per phase. `ROUTING-DIGEST.md`'s own header now
  points at that rule instead of restating it.
- **Loop bounds — stated once, in `AGENTS.md` → "## Loop bounds"** (numbered 1–5):
  1. QA repair stops after two author-fix / critic-review cycles, then escalate.
  2. Intake asked once, in one concise message; an answered question is never re-asked.
  3. An audit is never re-run against unchanged evidence — the `.olympus/` artifact is the cache.
  4. One direction by default (cross-refs the direction rule).
  5. **Anti-loop:** byte-identical output twice → stop and escalate.
  Every other file was changed to *reference* "the loop bounds in `AGENTS.md`" — no number
  restated: `START-HERE.md` (§5 + context-budget list + intake section), `ARCHITECTURE.md`
  (mermaid loop labels), `ARCHITECTURE-ESSENTIALS.md`, `PROMPT.md`, `USAGE.md`,
  `library/agents/design-director.md`, `library/skills/.../olympus-design-director/SKILL.md`
  + `routing-contract.md`, `library/skills/.../visual-qa/SKILL.md` (+ registry desc/runtimePrompt),
  `convenium-design-studio/CONTINUOUS-IMPROVEMENT-PLAN.md`.
- **Cost feedback:** `AGENTS.md` → "## Cost feedback" tells the director to record per-run
  phase counts in `run.json` under `phase_counts`; `templates/run.json` gains that object
  (and `approved_concept` → `approved_direction`, unused elsewhere).
- Regenerated all host trees; `verify.py` CLEAN; idempotent (0 writes on re-run).

### HALT CHECK — Phase 7
- [x] Hash check: no unexpected duplicate `SKILL.md` pair (127 distinct / 127 skills;
      3 `sources/upstream` provenance copies are expected and excluded).
- [x] Each loop bound's normative sentence occurs in exactly one file — `AGENTS.md`:
      - `grep -rn "two author-fix / critic-review cycles"` → `AGENTS.md` only.
      - `grep -rn "asked once, in one concise message"` → `AGENTS.md` only.
      - `grep -rn "never re-run against unchanged evidence"` → `AGENTS.md` only.
      - `grep -rn "byte-identical to the previous attempt"` → `AGENTS.md` only.
      - `grep -rn "more than one \`SKILL.md\` body per phase"` → `AGENTS.md` only.
      Other files carry only the pointer phrase "the loop bounds in `AGENTS.md`". Residual
      numeric "cycles" mentions outside `AGENTS.md` are vendored third-party skills
      (`sms`, `marketing-loops`, `customer-research`, `impeccable`) describing their own
      unrelated loops.
- [x] `validate-system.ps1` exits 0; `npm.cmd run check` EXIT 0; no protected files touched.

**Result: PASS. Proceeding to Phase 8.**

---

## Phase 8 — archive and report — **PASS** (2026-09-02)

### Actions
1. Confirmed **nothing under `Convenium.Design\` references the path `D:\KnowledgeFactory\ConveniumDesign_claude`**.
   Removed the one-time build scripts (`library/tools/_phase1_fold.py`,
   `_phase2_build_agents.py`) — they held the donor paths and their job is done (they live in
   the Phase 1 / Phase 2 commits). Rewrote `library/tools/origins.json` as a pure provenance
   note with no `D:\KnowledgeFactory` paths. `library/tools/` is now exactly
   `verify.py · build_index.py · project.py · origins.json`. Residual bare-string mentions of
   "ConveniumDesign_claude" / "KnowledgeFactory" are in vendored skill content and descriptive prose,
   not path dependencies.
2. Wrote `D:\KnowledgeFactory\ConveniumDesign_claude\README.md` marking it **ARCHIVED**, pointing at
   `D:\Analyst_Designer\Convenium.Design`, listing what moved and what deliberately did not. The repo
   is **kept, not deleted** (dashboard + loadout reference value).
3. Committed Phase 8; pushed `unification` to `origin`. Opening a PR is left to Rustam.

---

# FINAL REPORT

## Per-phase result

| Phase | Result |
|---|---|
| 0 — safety net, off-machine | **PASS** |
| 1 — build the library | **PASS** |
| 2 — the agent layer, host-neutral | **PASS** |
| 3 — generators | **PASS** |
| 4 — cut over | **PASS** |
| 5 — direction by questionnaire | **PASS** |
| 6 — dual-host instructions | **PASS** |
| 7 — token discipline and loop guards | **PASS** |
| 8 — archive and report | **PASS** |

**Nothing halted.** No HALT CHECK failed. No item from *Unresolvable at runtime* was hit
(no two different real bodies for one id; no generator wanted to delete an uncreated file).

## Final counts

| Metric | Value |
|---|---|
| Skills in `library/skills/` (= registry records) | **127** |
| ├ active / manual / stub | 121 / 3 / 3 |
| ├ pipeline-active (in `ROUTING-DIGEST.md`) / unrouted | 27 / 100 |
| Projected to `.claude/skills/` (claude-hosted, non-stub) | 112 |
| Projected to `.agents/skills/` (codex-hosted, non-stub) | 124 |
| Studio-hosted (registry + `convenium-design-studio/knowledge/skills/`) | 127 |
| Host-neutral agents (`library/agents/`) | 6 → `.claude/agents/*.md` + `.codex/agents/*.toml` |
| `convenium_design_get_context` inventory | 127 (baseline was 24; ≥ satisfied) |
| `npm.cmd run check` | EXIT 0 (baseline EXIT 0) |
| `validate-system.ps1` | EXIT 0 |
| `library/tools/verify.py` | CLEAN |

Skills by category: 01-design-direction 11 · 02-web-build 3 · 03-motion-3d 27 ·
04-media-generation 11 · 05-content-copy 4 · 06-marketing-growth 40 · 07-research-intel 5 ·
08-qa-review 4 · 09-engineering-workflow 12 · 10-docs-deliverables 2 · 11-meta-system 8.

Count arithmetic (Phase 1 HALT): 52 (KF) + 6 (studio-store) + 71 (personal) − 2 (documented
duplicates) = **127**. Matched exactly.

## Duplicates resolved under decision 9

Two personal skills share a canonical id with a folded Studio-store skill. In both cases the
personal `SKILL.md` body is **byte-identical** (after newline normalisation) to the Studio's
`sources/upstream/SKILL.md` copy, so precedence kept a single folder and the personal body:

| id | Resolution |
|---|---|
| `apple-design` | one folder `library/skills/01-design-direction/apple-design/`; body = personal copy; `hosts: [codex, studio]` (claude excluded — plugin collision) |
| `emil-design-eng` | one folder `library/skills/01-design-direction/emil-design-eng/`; body = personal copy; `hosts: [codex, studio]` |

No case of "two different real bodies for one id" — **no HALT**.

Skills whose `hosts` exclude `claude` because their bare name collides with an installed
plugin skill (decision 9), so the projection never shadows the plugin:
`gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`,
`gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils`, `impeccable`, `apple-design`,
`emil-design-eng`, `seo-audit`. (The 3 stubs — `taste-first-experience-design`,
`ethical-gamification-systems`, `agent-identity-and-portfolio` — are `hosts: [studio]` per
decision 10.)

## UNSORTED.md

**Empty (count 0).** Every one of the 71 personal skills resolved to an existing category —
none needed `99-unsorted`. The personal skills filled the previously-empty `05-content-copy`
(4) and `06-marketing-growth` (40) and added to `02-web-build` (+2), `03-motion-3d` (+18),
`04-media-generation` (+1), `07-research-intel` (+3), `09-engineering-workflow` (+1).

## UNROUTED.md

**100 skills** — projected to their hosts, invoked explicitly, excluded from the pipeline
routing table (decision 13). This is by design: the Convenium.Design redesign pipeline is small
(27 active skills across always/diagnose/direct/prepare/build/verify); everything else is an
available capability. Breakdown by category:

- 01-design-direction (0 unrouted — all 11 are pipeline or Taste)
- 02-web-build (3): `garden-web-design-engineer`, `pick-ui-library`, `prototype`
- 03-motion-3d (18): `animate`, `animation-vocabulary`, `find-animation-opportunities`,
  `improve-animations`, `review-animations`, `video`, and the 12 `remotion-*` skills.
  (`gsap-*` are routed: `prepare` / `build` / `verify`.)
- 04-media-generation (10): all `higgsfield-*` (8) + `garden-gpt-image-2` + `image`.
  (`asset-director` is routed `prepare`.)
- 05-content-copy (4): `content-strategy`, `copy-editing`, `copywriting`, `sales-enablement`
- 06-marketing-growth (40): every skill in the category
- 07-research-intel (3): `analytics`, `competitor-profiling`, `customer-research`
- 08-qa-review (2): `superpowers-receiving-code-review`, `superpowers-requesting-code-review`
- 09-engineering-workflow (12): all `superpowers-*` workflow skills + `project-scaffold`
- 10-docs-deliverables (2): `garden-beautiful-article`, `garden-web-video-presentation`
- 11-meta-system (6): `convenium-design-bootstrap`, `convenium-design-cyberpunk-athens-skin`,
  `convenium-design-dashboard-sync`, `convenium-design-loadout-sync`, `garden-kb-retriever`,
  `superpowers-writing-skills`

Full per-skill list with descriptions: `library/registry/UNROUTED.md`.

## Defects fixed (from the plan's audit)

1. ✅ `.claude/skills` + `.claude/agents` now exist and are generated from `library/`.
2. ✅ `CLAUDE.md` at the Convenium.Design root.
3. ✅ Three disagreeing stores collapsed to one source of truth (`library/`) + generated projections.
4. ✅ `gsap-utils` has a registry record (`phase: prepare`).
5. ✅ `three-js-implementation` deleted (registry entry + folder).
6. ✅ The six bodiless skills: `ui-ux` / `apple-design` / `emil-design-eng` recovered from
   `sources/upstream`; the 3 `runtimePrompt`-only skills are explicit `status: stub`.
7. ✅ `skills.mjs` is data — it reads `library/registry/*.json`.
8. ✅ The fixed-three rule is gone; the direction rule lives once in `AGENTS.md`.
9. ✅ `library/design-dna/` is now load-bearing (Gate A runs the taste interview when unresolved).
10. ✅ Greenfield has an entry (questionnaire-first, `ux-evidence-audit` dormant).

## What is NOT in this plan

The end-to-end validation — one real redesign run compared against a token baseline — needs a
real website project and was explicitly out of scope (decision 17). The system is ready for
that test: kick off per `USAGE.md`.

## Out-of-scope, confirmed untouched

`server.mjs`, `knowledge.mjs`, `mcp-server.mjs`, `convenium-design-studio/data/`, `evidence/`,
`handoffs/`, `public/media/`, every `.olympus/`, `~/.claude/skills`, `.skill-backups/`,
`test_projects/`, `third-party/`, `main` branch. Every commit landed on `unification`.


---

# POST-UNIFICATION — scope narrowing + audit fixes — **DONE** (2026-09-03)

Convenium.Design is a design system only: a skill stays only if it serves designing and building an
interface. Follow-up on top of the unification.

## A. Precondition — PASS
All 43 skills marked for removal still exist in `C:\Users\Rustam Gurbanov\.claude\skills\` —
the Convenium.Design copy was never going to be the last one. Safe to remove.

## B. Marketing removed from Convenium.Design

- **43 skills deleted** from `library/skills/`, the registry, and every projection
  (`.claude/skills/` -220 files, `.agents/skills/` -224 files, `convenium-design-studio/knowledge/skills/` -43):
  all 39 of `06-marketing-growth` except `site-architecture`; `content-strategy` +
  `sales-enablement` from `05-content-copy`; `analytics` + `competitor-profiling` from
  `07-research-intel`.
- `06-marketing-growth` category folder deleted (empty).
- `site-architecture` moved `06-marketing-growth` -> `02-web-build`.
- **Kept, verified against each SKILL.md:** `copywriting`, `copy-editing`, `site-architecture`,
  `customer-research`. Report on body-vs-call tension: `copywriting` and `copy-editing` both
  self-describe as "marketing / conversion copy"; `site-architecture` lists SEO as a secondary
  goal; `customer-research` leans toward positioning. **None contradicts the keep call** —
  page copy, IA, and customer evidence are all part of designing/building an interface — but
  the registry `description` for all four was rewritten to an interface framing (SKILL.md
  bodies, which are vendored, were left untouched).
- **Pipeline copy/IA/research step closed by routing** (phase + a new `runtimePrompt` each):
  `copywriting` -> `build`, `copy-editing` -> `verify`, `site-architecture` -> `diagnose`,
  `customer-research` -> `diagnose`. Each added to `ARCHITECTURE.md`'s routing table with an
  activate / keep-dormant condition.
- `D:\KnowledgeFactory\library\knowledge\marketing-system-seed.md` written — all 43 ids with
  description + the single source path `C:\Users\Rustam Gurbanov\.claude\skills\<id>\`. **No
  skill folder copied anywhere.**

## C. Audit defects fixed

1. **`enabled` on every registry record** — `true` where `phase != "unrouted"`, else `false`.
   `project.py` normalises it from phase before any projection emits it (studio README gains a
   `- Routed:` line; `convenium-design-studio/skills.registry.json` carries the field); `skills.mjs`
   passes it through so `mergeSkill` -> `convenium_design_get_context` filters on it.
   **`convenium_design_get_context` payload: 84 skills / 55,225 bytes -> 31 skills / 21,992 bytes**
   (~60% smaller; pre-task with 127 skills it was ~83 KB). The 31 enabled = 27 previously
   routed + the 4 newly-routed above. *Note:* the 3 studio-only stubs
   (`taste-first-experience-design`, `ethical-gamification-systems`,
   `agent-identity-and-portfolio`) have `phase: direct|prepare` so the literal rule marks them
   `enabled: true` — they appear in the inventory. Flip to `status`-gated if that is unwanted.
2. **runtimePrompts written** for the three routed-but-empty skills: `convenium-design-taste-interview`,
   `convenium-design-style-picker`, `gsap-utils`. `verify.py` now fails if any routed skill has an empty
   `runtimePrompt` or an `enabled` that disagrees with its phase.
3. **Orphaned `sources["three-js-implementation"]`** deleted from
   `convenium-design-studio/knowledge/index.json`. Its one substantive sentence (dispose GL resources,
   cap pixel ratio, keep a DOM/poster fallback) was first saved to
   `library/knowledge/03-skill-briefs/webgl-implementation-guardrails.md`.

## D. Regenerate + verify — PASS

| Check | Result |
|---|---|
| `project.py claude / codex / studio / digest` | ran; re-run dry-run = 0 writes / 0 deletes (idempotent) |
| `library/tools/verify.py` | CLEAN — 84 skills / 84 records |
| `scripts/validate-system.ps1` | EXIT 0 — "81 skills, 6 agents, 33 required files, registry parity OK" |
| `npm.cmd run check` (convenium-design-studio) | EXIT 0 |
| `external-skills.json` resolves | yes — parses; nothing it references was removed; `seo-audit` correctly moves back to plugin-only (comment updated) |
| protected files (`server.mjs`, `knowledge.mjs`, `mcp-server.mjs`, `data/`, `evidence/`, `handoffs/`, `public/media/`, `.olympus/`) | 0 changes |

### Final counts

- Registry: **84 skills** (127 - 43) · 31 enabled/routed · 53 unrouted.
- By category: 01-design-direction 11 · 02-web-build 4 · 03-motion-3d 27 · 04-media-generation 11 ·
  05-content-copy 2 · 07-research-intel 3 · 08-qa-review 4 · 09-engineering-workflow 12 ·
  10-docs-deliverables 2 · 11-meta-system 8. (No 06.)
- By phase: always 1 · diagnose 5 · direct 7 · prepare 8 · build 6 · verify 4 · unrouted 53.
- Projections: `.claude/skills/` 70 · `.agents/skills/` 81 · studio 84.
- `ROUTING-DIGEST.md`: 31 active skills.
