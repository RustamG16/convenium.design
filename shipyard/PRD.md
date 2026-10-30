# PRD — Convenium Shipyard

## Problem

Choosing which agent carries which skill for a Convenium.Design run means reading
`AGENTS.md`, the registry, `slots.json` and agent files, then hand-writing `00-run-plan.md`. The
ArkhEthos ship view explains the system beautifully but is fixed (one crew, slot swaps only) and
lives in a private app; the repo's 2D console is read-only.

## Requirements (acceptance criteria are in `plan/06-build-plan.md` § 1)

1. Default ship SS Full Run with seven crew; four library workflows as read-only templates.
2. Armory over the whole knowledge base (101 skills + doctrines, plugins, tools); every skill an
   artifact with family, tier and anchor.
3. Equip / unequip / move / hold artifacts on crew via drag, keyboard and touch; visible on the
   3D body and in the DOM anchor diagram.
4. Commission ships (blank / clone / import), recruit and edit crew (1–8), plan the voyage.
5. Pre-flight from the real rules; export ship.json, 00-run-plan.md (verify CLEAN), kickoff prompt.
6. Logbook and commissions from verified outcomes only; ethics gate passes.
7. Works without WebGL, with reduced motion, at 360px, keyboard-only.

## Out of scope

Running agents, accounts, cloud sync, paid media, replacing `ship/index.html`, changing the pipeline.
