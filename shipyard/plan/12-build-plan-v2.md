# 12 — Build plan v2: live library, Forge, trials, Regatta

Written 2026-11-08 by the director from the owner-approved plan (`federated-weaving-thompson`).
The scope is in `PRODUCT.md § v2`, the technical design in `ARCHITECTURE.md § v2`, and the activation
plan in `00-run-plan.md`. v1 (`06-build-plan.md`, T0–T14) stays valid wherever v2 does not amend it.

## 1. Owner decisions (2026-11-08)

| Topic | Decision |
|---|---|
| **Trials** | Dry trials (Simulated) **and** live trials (dev server, headless Claude Code on a scratch copy; Verified and Model-judged) |
| **Compare** | Full game scoring: winner, ratings, leaderboard. Replaces the 06 § 7.6 "no ranking" rule |
| **Write-back** | The dev server's Forge writes allow-listed `library/` files, runs `project.py all` and `verify.py`, rolls back on failure and hot-reloads. The deployed build stays read-only |
| **Paid 3D** | Higgsfield, each asset approved against a recorded `get_cost` (§ 7) |
| **Governance** | `verify.py` swaps its fixed agent list for a 1:1 mapping from agent files to `crew.json` |

## 2. Art direction for the new surfaces

The v1 material carries over unchanged: warm noir hull, cotton type, one red signal, family
pigments only as data (`DESIGN.md`). The new surfaces add **places on the ship**, not new styles:

| Surface | Place on the ship | What makes it read as a game |
|---|---|---|
| **Forge** (`#/forge`) | The workbench bay. The agent being forged stands on the turntable with its worn artifacts | **Dial-and-plate controls:** the model tier is a three-position switch, routes are sockets, the phase is a stage plate. The diff reads as a hull blueprint. The apply log is a ticker tape |
| **Regatta** (`#/regatta`) | The course outside the bridge window: buoys for stages and gates, ships as the FleetRing hulls | Each hull advances one buoy per simulated or streamed stage event. The winner gets one bow wave and a pennant, once, only at the finish |
| **Leaderboard** | The harbour board: a slate with chalk rows | Each row shows rank, ship, rating, n, date and a truth label. Simulated scores sit in their own pale column |
| **Dry dock** (Hangar) | Hulls on blocks, beside the FleetRing | The card lists the workflow's problems, with **Open in Forge** |
| **Library-changed banner** | A signal lamp on the ShipNav | A chili-soft lamp with "Library changed · Rebuild". After a rebuild: "N new · M changed" for 8 s |

**Type and numbers** follow the existing `DESIGN.md` scale: Archivo for decisions, Newsreader for
explanation, Inter tabular figures for scores. **The palette is unchanged.** The winner mark is
cotton plus the word "Winner", never colour alone. **Motion** follows the existing contract: 160,
240 and 700 ms. The arena runs at 0.6–1.2 s per buoy; under reduced motion it is a static board
with no per-stage animation.

## 3. Screen and scene map

| Route | Primary action (one per screen) | 3D | No-WebGL / reduced motion |
|---|---|---|---|
| `#/` Hangar | Board the focused ship | FleetRing, plus dry-dock cards in the DOM | FleetGrid, plus the same cards |
| `#/forge` | Preview changes, then **Apply** | Workbench turntable (dev only) | The form and diff only |
| `#/regatta` | **Start regatta** (dry), or Launch live trial (dev) | Arena course | The static results board |
| `#/regatta/board` | none (read only) | none | the same |
| Ship screens | as in v1 | as in v1 | as in v1 |

The ShipNav gains a **Trial** entry, which opens the Regatta with this ship preselected. The global
nav gains **Forge** (dev only; the deployed build shows a read-only note) and **Regatta**.

## 4. Tasks (each ends green with one commit)

| T | Phase | Done when |
|---|---|---|
| T15 | v2-docs | These docs, CLEAN run plan, Higgsfield quotes recorded |
| T16 | v2-quick-wins: n1 hull minimum, n3 orbit spread and lift 0.15, n4 names in `fix.ts`, n5 veil `role=status`, ready-lift and an 8 s "Enter without 3D", residues (turntable `svh`, rim light, chip padding at 360, identity role at 22px) | typecheck, lint, unit, bridge, board and hangar e2e green |
| T17 | v2-data-driven: `project.py` fails loudly; the `verify.py` governance check; slug ids; body and hull manifests; KB defaults; `relic` fallback; `deriveTable`; dry dock; persist v2; invariant tests with `kb-min.json` | `project.py all` + `verify.py` CLEAN; a workflow with no table derives a voyage |
| T18 | v2-live-kb: `dev/kbWatch.ts`, `/__shipyard/rebuild`, hot reload in `KbProvider`, banner | e2e: a fixture skill appears without a reload; the fixture is reverted |
| T19 | v2-forge: `dev/forge.ts`, `features/forge/` | e2e: create an agent and a skill; a forced failure rolls back; the preview build makes no `/__shipyard` call |
| T20 | v2-variants: `crew/override`, export, PF-16, fork, promote | unit tests plus `test:plans` with an override |
| T21 | v2-dry-trials: briefs, `trial.ts`, rubric | golden scores |
| T22 | v2-regatta: setup, results, leaderboard, `ethics.test.ts` | a regatta e2e names a winner; the ethics test is green |
| T23 | v2-live-trials: `dev/trial.ts`, launch dialog, log drawer, fake CLI | fake-CLI e2e passes; a real smoke run, or a written "not run: no CLI" |
| T24 | v2-arena-3d: `Arena.tsx`, workbench, approved assets | fallbacks pass; the asset ledger is complete |
| T25 | v2-author-qa | `07-qa.md § v2` |
| T26 | v2-finish-review | `10-finish-review.md § v2`; target 85 or more |

## 5. Rubric (dry and live share it; 100 points)

| Criterion | Points | Dry (Simulated) | Live (Verified) |
|---|---|---|---|
| Coverage | 35 | the brief's `needs` matched to the active skills on the voyage | the needs evidenced in `run.json` phases |
| Artifacts | 15 | `requiredArtifacts` produced by some stage output | the files present in the scratch project |
| Gates | 15 | the brief's gates present in the voyage | the gates recorded in `run.json` |
| Pre-flight | 20 | `passed / applicable × 20` | `verify.py --plan` CLEAN gives 20, else 0 |
| Economy | 10 | 10 minus the tier cost over the brief's budget (opus 3, sonnet 2, haiku 1) | tokens used against the estimate |
| Clarity | 5 | no unphased crew, no duplicate skills | no failed phases |

Ties are shown as ties. A critic number (Model-judged) is shown beside the total, never added to it.

## 6. Tests added in v2

- **Unit:**
  - `trial.test.ts` (golden scores);
  - `derive.test.ts` (`deriveTable`);
  - `persist-v2.test.ts`;
  - `override.test.ts`;
  - `ethics.test.ts`.
- **e2e:**
  - `live-kb.spec.ts`;
  - `forge.spec.ts`;
  - `regatta.spec.ts`;
  - `trial-live.spec.ts` (fake CLI);
  - `no-dev-routes.spec.ts` (preview build).
- **Fixtures:**
  - `tests/unit/fixtures/kb-min.json`;
  - `fixtures/briefs/{landing-refresh,mobile-retrofit,fleet-audit}.json`;
  - `fixtures/projects/<id>/` (tiny static sites);
  - `tests/fixtures/fake-claude.mjs`.

## 7. Paid-asset order (each one is a separate owner yes against its quote)

1. **ship-e replacement (n2).** First try the CC0 hulls and kit already in the repo, at no cost.
   Only then quote a Higgsfield hull.
2. **One neutral rigged recruit body.** It serves `fleet-measurer` and Forge-created agents, tinted
   by pigment. Prototype it against the existing clips before approving more.
3. **Arena environment.** Built in the remote Blender scene builder from its catalog, then exported
   as GLB.
4. **Per-agent bodies:** only on a separate request.

The quotes are recorded in `05-asset-manifest.md § v2`.

## 8. Cut order (if scope runs out)

1. Seedance video
2. per-agent paid bodies
3. the 3D Forge workbench (keep the 2D Forge)
4. the critic in live trials
5. creating workflows from the Forge
6. the overall leaderboard (keep it per brief)
