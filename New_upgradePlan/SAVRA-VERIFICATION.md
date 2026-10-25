# Savra setup verification — 2026-09-07

Scope: source/document comparison, not a fresh runtime or visual acceptance test.

Repository: private `RustamG16/Savra_v2`, authenticated GitHub CLI access succeeded after public web access returned 404. Inspected main at `c1e7f9755f205666617821b24b919d0f4fd94b12`. The local `test_projects/Savra_v2` directory is empty; `Savra_Claude` is absent from the current test_projects inventory.

## Findings

| Claim | Evidence inspected | Result |
|---|---|---|
| One creative direction with explicit media mapping | `.olympus/06-build-plan.md` | Confirmed; seven different scene roles, mobile changes, motion choreography |
| 25vw desktop hero | `DESIGN.md`, `src/styles.css` | Confirmed: `clamp(8.5rem, 25vw, 29rem)`; mobile CSS intentionally differs |
| 93/100 finish result | `.olympus/run.json`, `.olympus/07-qa.md` | Recorded; not independently re-scored in this task |
| Client acceptance complete | `.olympus/run.json` | False: Gate C remains pending |
| Separate finish-review artifact | Recursive repository tree | No `.olympus/10-finish-review.md` in inspected tree; QA contains an independent-review narrative |
| Current schema exactly matches Savra | Convenium.Design `templates/run.json` versus Savra run | No: snake_case versus camelCase and different field sets/status strings |
| Reduced motion fully handled | `DESIGN.md`, `src/App.tsx` | No: documentation discloses it; source still requests smooth menu scrolling and plays video without that preference guard |
| Performance targets measured | `.olympus/07-qa.md` | No: LCP/INP targets explicitly unmeasured; image derivatives deferred |
| Original host loadout and order exactly reproduced | Delivered repository files | Not established; final files do not prove what the creating session loaded or when |

The Savra build plan itself gives qualitative type roles; the exact numeric scale is in DESIGN.md and CSS. Their agreement proves delivery consistency, not that DESIGN.md was authored before implementation. Do not infer chronology from a final snapshot.

The run/QA records are dated August 27; the upgrade-plan comparison is dated September 4. Those may describe a later analysis of earlier work, but the dates do not prove a controlled experiment. The reported Claude 67/100 and all 23 defects remain historical claims because that counterpart was unavailable here.

## What Convenium.Design currently carries forward

`AGENTS.md`, `START-HERE.md`, Architecture Essentials and templates include one direction, a creative build plan, numeric design commitment, fresh-session implementation and two-pass QA. `library/tools/verify.py` returned CLEAN / 84 skills / 84 records today. It checks registry/body basics; it does not establish host capability parity, original-session equivalence or output quality. `project.py` filters by host/status, so delivery exceptions remain important. `slots.json` maps display owners to runtime owners.

## Required improvements

1. Record an immutable run receipt before the next run: Convenium.Design version, model/host settings when exposed, skill/tool versions, source media hashes, design hashes and explicit approval evidence.
2. Compare installed supporting scripts/reference files, not only names and host declarations. Probe plugin-supplied alternatives.
3. Store reviewer identity/role, rubric version, findings and evidence in a distinct artifact. Do not upgrade a recorded 93 into an independently established score.
4. Test reduced-motion media playback and programmatic scroll behavior in the browser. Carry forward Savra's strong composition, not its disclosed debt.
5. Introduce an explicit run-schema migration and separate client approval from technical completion.

Source links (authenticated access required): [design](https://github.com/RustamG16/Savra_v2/blob/c1e7f9755f205666617821b24b919d0f4fd94b12/DESIGN.md), [plan](https://github.com/RustamG16/Savra_v2/blob/c1e7f9755f205666617821b24b919d0f4fd94b12/.olympus/06-build-plan.md), [QA](https://github.com/RustamG16/Savra_v2/blob/c1e7f9755f205666617821b24b919d0f4fd94b12/.olympus/07-qa.md), [run](https://github.com/RustamG16/Savra_v2/blob/c1e7f9755f205666617821b24b919d0f4fd94b12/.olympus/run.json), [implementation](https://github.com/RustamG16/Savra_v2/blob/c1e7f9755f205666617821b24b919d0f4fd94b12/src/App.tsx).
