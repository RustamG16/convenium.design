# Convenium Shipyard — plan package (nothing implemented yet)

**Status: PLAN ONLY (2026-10-30).** No application code exists in this folder. Every feature
below is specified, not built. Do not report any of it as working until a build session has
implemented and verified it.

Shipyard is the playable, editable successor to the ship view inside ArkhEthos
(`ArkhEthos/src/features/ship/`): the Convenium.Design system shown as a spaceship. Crew members
are the agents, the skills they carry are **artifacts** on anchors of their bodies, ships are
workflows. Unlike the ArkhEthos tour (one fixed crew, slot swaps only) and the 2D console
(`ship/index.html`, read-only), Shipyard lets the owner:

1. Board the **default ship** — *SS Full Run*, the seven-member crew from `library/registry/crew.json`.
2. Open the **Armory** — the whole knowledge base (all 101 registry skills, the doctrines,
   plugins and tools) where every skill is an artifact with a family, a tier and an anchor.
3. **Equip** artifacts on crew members (drag to an anchor: hand, off-hand, belt, back, head, orbit).
4. **Commission a new ship** — blank or cloned from any workflow — recruit and edit crew, plan
   the voyage (stages, gates, one active artifact per stage).
5. Run **pre-flight** — the real `AGENTS.md` rules as hull checks — and **export** a
   `ship.json`, a `00-run-plan.md` that passes `verify.py --plan`, and a kickoff prompt.

The game layer is honest: readiness is computed from the real rules, progress comes from
verified exports and imported `run.json` files, and nothing is ranked, timed or streaked.

## Read order (for the build session)

1. `CLAUDE.md` (this folder) → the repo's `CLAUDE.md` and `AGENTS.md` still apply.
2. `PRODUCT.md`, `DESIGN.md` — product intent and the token block as numbers.
3. `plan/06-build-plan.md` — **the design document**: art direction, screens, artifact system,
   gamification, motion numbers, tasks with done-when.
4. `ARCHITECTURE.md` — stack, folder tree, the port map from ArkhEthos, data pipeline.
5. `plan/00-run-plan.md` — the activation plan (which agent, one skill each).
6. `plan/05-asset-manifest.md` — media, sources and licences (no paid generation by default).
7. `schemas/` and `data/` — the contracts and the drafted artifact families.

## Run it at home

`prompts/KICKOFF-LOCAL.md` is the paste-ready prompt for a fresh local Claude Code session.
