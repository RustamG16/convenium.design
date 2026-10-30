# Shipyard — Claude start here

This folder is a **plan package** for Convenium Shipyard, an app inside the Convenium.Design
repository. The repo root `CLAUDE.md` and `AGENTS.md` apply in full; this file adds only what is
specific to Shipyard.

1. Read `README.md`, then `PRODUCT.md`, `DESIGN.md`, `plan/06-build-plan.md`, `ARCHITECTURE.md`.
2. Implement from `plan/06-build-plan.md` task by task, in a session that did not write it.
3. Check the activation plan before the first subagent:
   `python library/tools/verify.py --plan shipyard/plan/00-run-plan.md`.
4. Shipyard's knowledge-base file is **generated** from `library/` (`project.py shipyard`); never
   hand-edit `shipyard/public/data/`. Edit `library/registry/` and rebuild.
5. `ship/index.html` (the 2D console) stays and stays true; Shipyard is a second consumer of the
   same registry, not a replacement.
6. Assets come from the owner's local ArkhEthos checkout (CC0 kit + owned crew GLBs) via
   `shipyard/scripts/import-arkhethos-media.mjs`; no paid generation without a new owner request.
7. Evidence for this build (QA screens, finish review) goes in `shipyard/plan/` as
   `07-qa.md` and `10-finish-review.md`, not in a repo-level `.olympus/`.
