# Independent recovery finish review

Reviewer: independent-critic / recovery_finish_review. Initial review, 2026-09-16.

**Verdict: FAIL — 62/100.** The local fixture journey and readable shell work, but important parts of the approved configuration, project evidence, run inspection, and asynchronous ownership contracts remain incomplete.

Reviewed dirty worktree against baseline b30325959350e3fbd6b6c40fa5032aaa7846db25. Read-only; no implementation, protected records, provider calls or source assets changed.

| Requirement group | Score | Rationale |
|---|---:|---|
| Six roles, manifest, provenance | 16/20 | Explicit roles and uncertainty; runtime and display not fully connected. |
| Gates, artifacts and fixture honesty | 17/20 | Hash-bound proposals, invalidation, version-bound reviews; scope disclosed. |
| Configure and cross-surface continuity | 6/15 | Selected-role configuration inspector absent. |
| Project evidence and run inspection | 5/15 | Historical archive replaces selected project execution/evidence. |
| Async ownership and recovery | 4/15 | Reproduced cross-chat contamination, stale rendering, enabled offline mutations. |
| Visual composition and accessibility | 14/15 | Shared shell and graph/list fallback; author responsive and keyboard evidence credited. |

## Findings

1. **High: delayed work crosses route/chat ownership.** public/app.js:233,2168 and public/modules/journey.js:82. Hold the 180ms reply, switch A to B, release: B receives A's reply. Hold Playground loadouts, navigate Home, release: Setup A/B appears in Home. Capture ownership before async work and discard obsolete rendering. Repeat both reproductions.
2. **High: Configure lacks role inspector and draft connection.** workflow-view.js:17,145. Primary surface has six disclosures but no inputs/selects or role inspectors. Current model/environment/budget/permissions/skills/enabled state must be explained and editable where supported. Demonstrate role change reaching comparison and reviewed plan; reset/cancel; narrow layout.
3. **High: System ignores selected run.** router.js:35, workflow-view.js:39,145. system/missing-run renders ordinary historical workflow instead of recovery. Resolve project/run ownership and actual artifacts, gates, phase state and blockers. Test distinct runs and invalid/cross-project links.
4. **Medium: project Knowledge replaced by archive-only evidence.** workflow-view.js:104,155. Active project brief, Design DNA, authorized sources, skills and output relationships absent. Preserve Savra source archive separately; synchronize project dataset/filter/list/graph.
5. **Medium: offline recovery only a banner.** shell.js:66,131 and journey.js:41. Create project/comparison stay enabled offline; route signature suppresses reconnect refresh. Preserve inputs, disable server actions with reasons, reload/revalidate state after reconnect; test changed server state while disconnected.

## Evidence and limitations

Reviewer read design, complete plan, reference contract, author QA, manifest and implementation/tests. Inspected author and canonical contact sheets plus Configure/System references. Independently ran Chromium/CDP scratch probes for Configure, invalid System run, stale Playground response, offline controls and delayed Work reply. Author full suite, widths, keyboard, T1-T11/B1-B8 credited as supplied evidence, not rerun by reviewer. No live provider, production-site quality, packaged-app or complete assistive-technology claim. Prior settings test write of budget4321 remains a disclosed preservation limitation.

Disposition: first bounded author-fix pass. Green instrumentation establishes tested fixture path, not complete plan parity. Repair cycles completed: 0.

## Repair cycle 1 independent re-review — 2026-09-16

**FAIL — 87/100.** Independent critic verified all five original repairs through scratch-data browser suites and source inspection. Scores: roles/provenance 18/20; gates/artifacts 19/20; Configure 13/15; project evidence 13/15; async/recovery 11/15; visual/accessibility 13/15.

Remaining high finding: hold a comparison response, change Setup B, release the old response. The old comparison restored its passing report and enabled Apply despite the new selection. Author also reported focused Work composer/Oracle overlap at 1280px in the broad check. Final permitted repair pass must invalidate old comparison generations and keep the entire focused composer in the workspace viewport, then verify both and rerun release checks.

Reviewer independently passed ui-async-ownership, ui-role-draft, ui-project-evidence, ui-reconnect, ui-surface-layout, and the full five-width ui-savra-oracle fixture. Review supports a local deterministic prototype, not production generation or live provider execution. No protected data was changed by the reviewer.

## Final independent re-review — repair cycle2

**PASS WITH NOTES — 92/100.** No unresolved high-severity product defect reproduced in the final bounded pass. Scores: roles/provenance18/20; gates/artifacts19/20; Configure/continuity14/15; project evidence13/15; async/recovery14/15; visual/accessibility14/15.

Independently verified closure: both comparison selectors, route/project changes and reconnect invalidate pending results; fresh comparisons succeed. Five-width focused composer overlap checks unchanged and passing. Shared Agents inspector and project ID in Oracle requests confirmed. System role/responsive/inspector/graph-list checks pass. Final contact sheet inspected. Original five findings remain closed based on prior independent review and final focused checks.

### Remaining notes (all disclosed)

1. **Medium: test timing fragility.** ui-comparison-ownership.mjs twice clicked before initial mount after its fixed1800ms wait; ui-context-parity.mjs similarly failed inspector readiness. Unchanged comparison assertions passed with in-memory readiness polling; an independent readiness-based probe confirmed Agents/Oracle behavior. Reviewer edited no files. These affected tests are not reliably repeatable on this host. Author broad suites passed separately; this note qualifies repeatability, not the reproduced product result.
2. **Documentation reconciliation.** Pending handoff statements needed replacement with final results, keeping author-reported broad evidence distinct from independently repeated checks. Addressed in the final handoff documentation update; earlier sections remain historical records.
3. **Local setting side effect.** Earlier failing isolation test wrote Design Engineer budget4321 to real untracked knowledge/agents.json. Previous value unknown; no guessed restoration.
4. **Scope.** Local deterministic fixture produces a brief specimen and contract checks. It does not establish production website quality, live provider execution, packaged-app behavior or deployment readiness. Per-role provider selection and global Settings editing unavailable; historical session settings unknown.

Disposition: bounded repair loop complete, two author-fix cycles used. Handoff supported with these notes. Fixture acceptance is not user acceptance of Convenium.Design or historical Savra. Review was read-only with scratch data and no provider calls or protected-data mutations.
