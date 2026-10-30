# Kickoff — build Convenium Shipyard on the local machine

## Before you paste

1. Get the plan: in your Convenium.Design checkout run
   `git fetch origin claude/shipyard-plan && git checkout claude/shipyard-plan`
   (or merge that branch into `main` first, then build on a new branch).
2. Have your ArkhEthos checkout on the same machine (the media is imported from it).
3. Start a **fresh** Claude Code session in the Convenium.Design folder (`claude`), with Node ≥ 22
   and Python 3 on PATH. Optional: `/model` → an Opus model for the director session; the
   subagents pick their own model from `.claude/agents/*.md`.
4. Replace `<CD>` and `<ARK>` below with the two absolute paths (Windows paths are fine, e.g.
   `D:/Analyst_Designer/Convenium.Design`).

## Paste this

```text
You are the design-director (main session) for a build run in this repository.
Build Convenium Shipyard exactly as planned in shipyard/. The plan was written and approved in an
earlier session; this is the fresh implementation session the build-plan rule asks for.

Paths: Convenium.Design = <CD>   ArkhEthos (media + code to port, read-only) = <ARK>

Read, in order and in full: shipyard/CLAUDE.md, shipyard/README.md, shipyard/PRODUCT.md,
shipyard/DESIGN.md, shipyard/plan/06-build-plan.md, shipyard/ARCHITECTURE.md,
shipyard/plan/00-run-plan.md, shipyard/plan/05-asset-manifest.md. The repo-root CLAUDE.md and
AGENTS.md apply (activation protocol, model rule, loop bounds, one SKILL.md body per phase).

Do not re-run intake and do not ask me questions the plan already answers. The brief, direction,
design-system numbers and acceptance criteria are fixed; trail is abridged.

Steps:
1. Replace <CD> in shipyard/plan/00-run-plan.md with the real path, then run
   python library/tools/verify.py --plan shipyard/plan/00-run-plan.md  — it must print CLEAN.
   Spawn only the agents that file names, in its order, one skill body each, sequentially.
2. Work task by task T0 → T14 from 06-build-plan.md § 11. Each task ends green (typecheck, lint,
   unit tests, its e2e) and gets one commit on a branch named shipyard/build. Record decisions in
   shipyard/PROGRESS-AND-DECISIONS.md as you go.
3. Port, don't re-invent: copy the ArkhEthos ship modules from <ARK>/src/features/ship per the
   Port map in ARCHITECTURE.md; never edit anything in <ARK>. Import media with
   node shipyard/scripts/import-arkhethos-media.mjs --from <ARK> (bytes + sha256 must match 05).
4. T1 first: library/registry/artifacts.json, project.py shipyard, verify.py checks, then
   python library/tools/project.py all && python library/tools/verify.py must be CLEAN — and the
   2D console ship/index.html must still work.
5. Proof before polish: by the end of T3 + T9, SS Full Run must export a 00-run-plan.md that
   verify.py --plan reports CLEAN (npm run test:plans does this for all four library ships).
6. No paid generation, no new dependencies beyond ARCHITECTURE.md's pinned list, no network at
   runtime. Gamification must pass the ethics gate in 06 § 7.6. Run one Playwright project at a
   time (software WebGL is CPU-heavy).
7. Finish: author QA → shipyard/plan/07-qa.md with screenshots (1440/1024/390/360, keyboard,
   reduced motion, no WebGL); then the independent-critic finish review →
   shipyard/plan/10-finish-review.md, scored against DESIGN.md; at most two fix cycles.
   Then ask me Gate C with what works, what does not, and the open decision in
   PROGRESS-AND-DECISIONS.md (07-qa owner in the Full Run conversion).

Report only what you verified; anything not run, say so.
```
