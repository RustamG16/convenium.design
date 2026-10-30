# AGENTS — Convenium Shipyard

## Read order

`ARCHITECTURE-ESSENTIALS.md`, then only the file the current task needs: `PRD.md` / `PRODUCT.md`
(scope), `DESIGN.md` (numbers), `plan/06-build-plan.md` (the design), `ARCHITECTURE.md` (code).
The repository root `AGENTS.md` is the doctrine and wins on any conflict.

## Ownership and boundaries

- Build only inside `shipyard/`, plus the T1 data-pipeline changes in `library/registry/artifacts.json`,
  `library/tools/project.py`, `library/tools/verify.py` and the generated-tree lists in the root docs.
- Never hand-edit `shipyard/public/data/` (generated), `.claude/`, `.agents/`, `.codex/`, `ship/data/`.
- Keep `ship/index.html` working and true. Do not change ArkhEthos.
- The app never writes to `library/`; proposals are exported for a reviewed commit.

## Evidence and safety

- Every number shown in the UI is computed from the knowledge base or the owner's own actions and
  carries a truth label. No invented metrics, rankings or "popular" labels.
- No paid generation (see `plan/05-asset-manifest.md`). Crew media is owner-owned, not CC0.
- No secrets, no network calls at runtime beyond loading the app's own files.

## Verification

`npm run typecheck && npm run lint && npm test && npm run test:plans && npm run test:e2e`
(one Playwright project at a time), then `python library/tools/project.py all && python library/tools/verify.py`
from the repo root. Author QA in `plan/07-qa.md`, independent finish review in `plan/10-finish-review.md`.
