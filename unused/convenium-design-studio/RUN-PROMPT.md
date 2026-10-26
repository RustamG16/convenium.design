# Unattended run prompt — Convenium.Design Studio redesign

Open Claude Code with the `Convenium.Design` folder attached, put it in auto/accept-edits mode, and paste
everything between the rules below.

---

Read `D:\Analyst_Designer\Convenium.Design\convenium-design-studio\LOADOUT-PLAN.md` in full and implement it,
starting at P0 and continuing through P4 in order, without stopping between phases.

## Autonomy contract

I am AFK. This is an unattended run. It ends when you run out of context or session budget, not
when a phase completes.

- **Do not ask me anything.** If a decision is missing, choose the option that best serves UX
  quality, write the choice and its reason into `convenium-design-studio/PROGRESS-AND-DECISIONS.md`, and
  keep going.
- **There are no approval gates in this run.** Gates A/B/C in `AGENTS.md` and
  `START-HERE.md` govern *client website projects*; this is work on Convenium.Design Studio itself and
  they do not apply. The gates in `CONTINUOUS-IMPROVEMENT-PLAN.md` are void — that file says so
  now. Every exit gate in LOADOUT-PLAN.md is a measurement you verify yourself.
- **Do not stop to summarise or ask "shall I continue".** Finish a slice, verify it, journal it,
  start the next one.
- **Full redesign is mandated.** The current look is evidence and anti-reference, not something
  to preserve. Keep product truth, content, function, the Olympus pipeline and all business
  logic; replace the visual world.
- **One direction. No alternatives.** Do not produce two or three concepts, do not run a
  critique-of-three, do not ask me to pick. Resolve one coherent world at intake, commit to it,
  and hold it for the whole run.
- **Target is the best UX/UI you can build.** The T1–T11 thresholds in LOADOUT-PLAN.md §06 are
  the floor, not the ambition.

## Before touching anything

1. **Branch both repositories, then checkpoint.** This folder contains two overlapping git
   repos: `Convenium.Design/` (currently on `unification`, and it separately tracks 196 files under
   `convenium-design-studio/`) and `Convenium.Design/convenium-design-studio/` (currently on `main`). Every edit inside
   `convenium-design-studio` dirties both, and P3 touches `library/`, which exists only in the root repo.
   So, in this order:

   ```
   cd D:\Analyst_Designer\Convenium.Design
   git rev-parse --abbrev-ref HEAD                 # record it in the journal
   git checkout -b redesign/loadout-program        # uncommitted work follows you across

   cd convenium-design-studio
   git rev-parse --abbrev-ref HEAD                 # record it in the journal
   git checkout -b redesign/loadout-program
   ```

   Then commit the checkpoint in **both** repos on the new branch:
   `git add -A && git commit -m "checkpoint before redesign run"`.
   The root repo is clean as of commit `979cbd7`. The `convenium-design-studio` repo has ~74 uncommitted
   files; they come along to the branch, which is what I want. `main` and `unification` must be
   left untouched at their current commits so I can walk away from the whole program with one
   `git checkout` in each repo.

   **Never push.** Commit locally only, in both repos, for the whole run.
2. Read in the order `CLAUDE.md` prescribes: `ARCHITECTURE-ESSENTIALS.md`, `AGENTS.md`,
   `START-HERE.md`, then `convenium-design-studio/LOADOUT-PLAN.md`, `convenium-design-studio/DESIGN.md`,
   `convenium-design-studio/PRODUCT.md`.
3. Read `library/doctrines/convenium-design-instrument/design.md`. It already specifies the token
   substrate that is missing. Use it as raw material for P1, not as a mandate.

## Protected — do not break these

- Do not edit generated trees: `.claude/`, `.agents/skills/`, `.codex/agents/`,
  `convenium-design-studio/knowledge/skills/`. Author in `library/`, then rebuild with
  `python library/tools/project.py all` and `python library/tools/verify.py`.
- Do not hand-edit `convenium-design-studio/data/`. The `Untitled system` active-record bug is fixed with
  a guard plus an on-load migration in `systems.mjs`, not by editing my JSON.
- Do not delete anything under `convenium-design-studio/public/media/`. To satisfy T10, stop *referencing*
  the decorative WebPs in CSS and markup. Agent portraits stay.
- Do not add a runtime dependency, a build step, a framework, or a WebGL surface. This stays
  Node 20 ESM + vanilla JS + the two vendored libraries.
- Preserve every `/api/*` contract and the demo/live distinction.
- For P3, do not add fields to `library/registry/skills.registry.json` — a rebuild may
  overwrite it. Author the slot map as a new `library/registry/slots.json` keyed by skill id,
  and teach `skills.mjs` to join it.

## Verify every slice, before you journal it

1. `npm.cmd run check`
2. `node scripts/ui-metrics.mjs` — the T1–T11 table. After P0 exists, no slice may regress any
   threshold. Record the before/after numbers.
3. Load the app at 1280×800, 1440×900 and 1920×1080: no horizontal overflow, no console
   errors or warnings, keyboard path through the primary flow works, visible focus everywhere,
   reduced-motion honoured.
4. If a slice fails verification, repair it in that slice. Do not carry a known defect forward
   and do not start the next phase on a red build.

## Journal, so a fresh session can resume

After **every** completed slice, append a dated entry to
`convenium-design-studio/PROGRESS-AND-DECISIONS.md` containing: the phase and slice, what changed, the
T1–T11 numbers before and after, decisions made and why, defects found and repaired, and the
exact next slice. Then `git commit` that slice with a message naming the phase.

If you are resuming a previous run, read the tail of `PROGRESS-AND-DECISIONS.md` first, run
`node scripts/ui-metrics.mjs` to confirm the recorded state, and continue from the next slice —
do not restart at P0.

## Order

P0 instrument → P1 replace the spec → P2 rebuild the substrate → P3 loadout model →
P4 surface passes (Work → Loadouts → Library → Playground → Pipeline map → Runs).

Do not skip P0 or P1. Writing CSS before DESIGN.md is replaced is the specific failure this
plan exists to stop: DESIGN.md currently ratifies 9px labels, so any faithful implementation
of it rebuilds the defect.

Expect the interface to look worse in the middle of P2 — density triples and layouts that only
fit at 9px will break. That is correct. Fix the layout; never shrink the type back.

Begin with the checkpoint commit, then P0.

---
