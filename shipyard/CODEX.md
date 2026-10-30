# CODEX — project router

1. Always read `ARCHITECTURE-ESSENTIALS.md`.
2. Product or scope question: read `PRD.md` (and `PRODUCT.md`).
3. Runtime, data, build or deployment question: read `ARCHITECTURE.md`.
4. Work boundaries or release checks: read `AGENTS.md`.
5. Prior decisions only when needed: search `PROGRESS-AND-DECISIONS.md`.

Build: `cd shipyard && npm install && npm run dev` · Data: `python library/tools/project.py shipyard`
Checks: `npm run typecheck && npm run lint && npm test && npm run test:plans` · Repo: `python library/tools/verify.py`
