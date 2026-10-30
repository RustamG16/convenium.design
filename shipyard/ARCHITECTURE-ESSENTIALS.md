# Architecture essentials — Convenium Shipyard

One screen. **Status: planned, not built (2026-10-30).**

- **What:** a local web app (Vite + React + R3F) in `convenium.design/shipyard/` that turns the
  Convenium.Design system into a ship game: ships = workflows, crew = agents (characters are
  cosmetic, the agent is what runs), artifacts = skills worn on six body anchors (9 slots).
- **Truth:** reads `public/data/knowledge-base.json`, generated from `library/` by
  `python library/tools/project.py shipyard`. Ships live in localStorage and `*.ship.json` files.
- **Default:** one ship, SS Full Run, seven crew with loadouts derived from agent routes and slots.
- **Output:** `ship.json`, `00-run-plan.md` (must pass `verify.py --plan`), a kickoff prompt.
- **Game layer:** hull integrity = pre-flight rule checks; codex discovery; commissions for real
  firsts; logbook from imported `run.json`. No XP, streaks, timers or rankings.
- **Reference:** port of the ArkhEthos ship view (`ArkhEthos/src/features/ship/`).
- **Design doc:** `plan/06-build-plan.md`; numbers in `DESIGN.md`; code map in `ARCHITECTURE.md`.
