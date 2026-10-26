# Task 3 — Oracle Continuum shell and navigation

## Scope and architecture

Implemented the shared shell and route ownership only. Existing feature services, data, media, API endpoints, and legacy feature rendering are retained. No dependencies or deployment changes were added. No commit was created.

The project is a local design operations workbench for people continuing project goals. Its core objects are projects, conversations, plans, runs, and evidence. The first decision is which project or goal to continue. Information priority is current project, recorded stage, next action, then feature content. Recovery uses persistent global navigation, explicit unknown/unavailable states, retry, and keyboard focus restoration. On mobile the same task context and Oracle access remain visible while the rail becomes a drawer. The approved numerical design specification supplies the UI foundation; no new visual direction was introduced. UI/UX skill review informed focus, responsive state preservation, and error recovery.

- `public/modules/router.js`: exact nine-route order; pure route resolution; nested ownership; encoded project/run deep links; legacy redirects; one visible view and active owner; document titles; focus restoration and browser history.
- `public/modules/store.js`: read-only projection of the existing workspace/config/runs snapshot. No second production store. Missing stages remain Unknown. A configured credential does not establish live capability.
- `public/modules/shell.js`: common project trail, environment/status/next action, accessible drawer, Alt+1–9 routing, shell recovery, and modest Home/Projects/Plan/Results/Settings entry states.
- `public/shell.css`: approved 210px fixed desktop rail, paper workspace, semantic state surfaces, 28px maximum type, shared bottom-center Oracle access, mobile drawer below 820px, reduced motion, and focused legacy contrast/layout compatibility.
- `public/index.html`: semantic shell landmarks and entry roots; retained legacy feature roots.
- `public/app.js`: import/bootstrap adapter, legacy route rendering callback, project selection, and startup failure wiring. Existing feature functions and APIs remain in place.

## Route compatibility

| Legacy link | Canonical destination | Retained root |
| --- | --- | --- |
| `#work`, `#/work` | `Projects / {active project} / Work` | `work` |
| `#systems`, `#/systems` | `Plan / Configure` | `systems` |
| `#architecture`, `#/architecture` | `System` | `architecture` |
| `#runs`, `#/runs` | `Results / History` | `runs` |
| `#oracle`, `#/oracle` | `Projects / {active project} / Intake` | `oracle` |

Knowledge, Playground, and Agents retain their existing roots and now own their respective global routes. Project Overview, Brief, References, Outputs, and Activity are subordinate entry states. Plan/Configure belongs to Plan; Work belongs to Projects; Results and System retain optional run identifiers; Knowledge/Connections belongs to Knowledge. Unsupported or malformed paths recover explicitly instead of silently selecting an unrelated view.

The persistent Oracle affordance opens the existing contextual Oracle dock; full intake/composer/token behavior remains Task 4. The new entry states do not claim a completed master plan, artifact review, QA, or Settings editor.

## Files changed

New: `public/modules/router.js`, `public/modules/store.js`, `public/modules/shell.js`, `public/shell.css`, `scripts/router.test.mjs`, `scripts/ui-shell.mjs`, this report, and generated `.olympus/shell-evidence/home-{390,820,1280,1440,1920}.png`.

Modified: `public/index.html`, `public/app.js`, `package.json`, and two legacy route expectations in `scripts/labels.json`. Existing measurement scripts generated their normal `metrics/latest.json`, `metrics/behaviour-latest.json`, and history outputs. `PROGRESS-AND-DECISIONS.md` records before/after metrics as required by project instructions. All unrelated pre-existing edits were preserved. Eight legacy screenshots and their contact sheet were generated under `.olympus/shell-evidence/legacy/`.

## Verification

1. Wrote the route/projection tests first and observed the expected missing-module failure before implementation.
2. `node --test scripts/router.test.mjs`: 5 tests passed. Covers all nine owners/order, nested routes, project and run IDs, every legacy alias, malformed/unknown routes, and honest loading/empty/offline/unavailable/environment projections.
3. `npm.cmd run check:shell`: 109 browser assertions passed in an isolated temporary data store, plus all 5 pure tests and new-module syntax checks. Covers all nine routes and heading focus, one visible root/owner, Oracle access, project trail, aliases, reloadable Configure links, missing-project inertness and fallback, project switching, Alt+9, Escape/focus restoration, browser Back focus restoration, widths 390/820/1280/1440/1920, fixed rail geometry, drawer focus trapping, no document overflow, reduced motion, offline/online states, empty workspace, loading and startup failure recovery, and clean console/runtime. Also verifies the five previously hash-bound legacy configuration navigation commands now reach Plan/Configure.
4. `npm.cmd run check:syntax`: passed, plus explicit syntax validation of all new shell modules.
5. `node scripts/ui-metrics.mjs --check`: final run 2026-09-15T17:19:48Z passed all T1–T11 and standing checks. Zero text/boundary contrast failures, undersized controls, overflow, and clipping across all five viewport sizes; 200% text scales; reduced motion honored; console clean.
6. Full `npm.cmd run check`: syntax, shell tests, and T1–T11 passed. The legacy behavior sweep exited 1: B1/B2/B4/B5/B6/B7 passed; B3 initially found five commands whose expected destination was the obsolete literal `#/systems`; B8 reported 102 repetitions of one missing seeded preview file (details below). Updated the two B3 label-contract rows to require canonical `#/plan/configure`, visible retained `#systems`, and Plan ownership; all five command paths subsequently passed in the focused shell suite. The complete 225-second behavior sweep was not repeated because the confirmed external missing media remains unchanged.
7. `node scripts/ui-shots.mjs --out .olympus/shell-evidence/legacy`: passed, eight legacy screenshots and contact sheet generated; desktop contact sheet and Home at 390/1440 inspected visually.
8. `scripts/validate-project-context.ps1 -ProjectPath D:/Analyst_Designer/Convenium.Design/convenium-design-studio`: passed. `/api/health`: HTTP 200, demo, 84 skills.

### Before/after measured values

| Metric | Before | After |
| --- | --- | --- |
| T1 text below 13px | 0 | 0 |
| T2 body px | 16 | 16 |
| T3 rem/text zoom % | 100 | 100 |
| T4 contrast failures | 0 | 0 |
| T5 undersized controls | 0 | 0 |
| T6 proportional families | 1 | 1 |
| T7 nonsemantic hues | 1 | 1 |
| T8 radii proxy | 1 | 1 |
| T9 legacy empty/action views | 8 | 8 |
| T10 decorative media | 0 | 0 |
| T11 destructive without undo | 0 | 0 |
| 390px document overflow | 216–226px on legacy supporting routes | 0 |
| Clipping | 0 | 0 |

The existing metrics instrument still measures the eight retained legacy roots. The additive shell suite exercises the nine canonical routes separately. The existing static CSS audit only reads styles.css, so its count of 314 legacy spacing literals does not validate the additive stylesheet; new shell declarations use named tokens and no `!important`. No field performance claim is made.

## Concerns and continuation boundaries

- **Full check remains non-green due to existing missing fixture media.** Independently requesting `/api/systems/olympus-web-system/outputs/savra-threshold-ritual/preview` returns HTTP 400 with ENOENT for `D:\Analyst_Designer\Convenium.Design\test_projects\Savra_Restraunt\.olympus\evidence\qa\desktop-1440x900.png`; `Test-Path` confirms absence. This path is seeded by existing `systems.mjs` and is outside the Task 3 UI ownership. No server behavior, seed record, protected project, or media was changed to hide the failure. The behavior report has no console exceptions; B8 consists only of repetitions of this endpoint. A later owner can expose preview availability and a fallback without rewriting source records.
- Canonical `state.mjs` currently has no browser API bridge. The shell projects existing workspace/config/runs records and intentionally leaves unavailable stages and next steps as unknown or goal-confirmation guidance. Future stage-aware feature modules should supply recorded values through the snapshot adapter.
- Plan, Results, Settings, and subordinate project evidence views have honest entry/empty states; their full behaviors are Tasks 4–10. Existing configuration, run history, Oracle, and run controls are linked and retained.
- The existing System graph is retained inside a dark technical canvas. A synchronized new graph/list system is later scope; Task 3 does not assert graph/list parity implementation.
- The Oracle access dock is persistent; the new full contextual composer and removable tokens belong to Task 4.
- Gate C/user review is not claimed. This is a bounded implementation handoff for review.

## Repair round 1 — reviewer findings

Two reviewer defects were reproduced before editing with `scripts/ui-shell-repairs.mjs`: activating the skip link changed the hash to `#/main-content` and selected the unavailable view; creating a project left the previous project's URL, route trail, and Oracle context in place and consequently reopened the old project on reload. The new test reported seven failed assertions covering those two defects.

- `public/modules/shell.js` now handles the real skip anchor as a focus action: prevent its fragment navigation, close an open drawer, and focus the main landmark while retaining the current application route.
- `public/app.js` now navigates to the created project's encoded canonical Work route after the workspace refresh completes, synchronizing view, route trail, Oracle context, and reload behavior before focusing the prompt. Both the global Projects creation action and retained Work creation control use this handler.
- Added `scripts/ui-shell-repairs.mjs` to `check:shell`. It verifies keyboard Enter on the skip link, unchanged Home route/view, main landmark focus, exactly one project created, canonical project URL, matching Work title/trail/Oracle context, prompt focus, reload persistence, and clean runtime console. It uses and cleans an isolated temporary data store.

Full `npm.cmd run check:shell` result after repair: 5 unit tests, 109 original browser assertions, and 11 repair assertions passed (120 browser assertions total). `node --check public/app.js` and focused `git diff --check` also passed. No styles, server, data, media, or unrelated files changed in this repair round. The existing missing external preview concern is unchanged.
