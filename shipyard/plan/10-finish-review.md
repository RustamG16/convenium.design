# 10 — Finish review (independent critic, award-rubric)

> Review 1 of at most 2. Written by the independent-critic subagent (opus, read-only, built nothing)
> on 2026-11-08 against HEAD cbeb6a8, and saved by the director verbatim. The author fix cycle and
> the re-review follow at the end of this file.

HEAD cbeb6a8. Read-only. I re-ran these myself: `npm run typecheck` clean, `npm test` 252/252,
`verify.py` CLEAN. I looked at every screen cited below in the PNGs myself.

## 1. Verdict: **ship with fixes**

There is no blocker. The 3D requirement is met in substance. Five majors are open, and two of
07-qa's claims are not supported by its own captures.

## 2. Scorecard

Weighted score: **71/100**. Design 28/40, usability 20/30, creativity 15/20, content 8/10.
Delivery risk: **medium**.

| Dimension | Score | Evidence | Main gap |
|---|---|---|---|
| Hierarchy and composition | 7 | `qa/bridge-custom-1440.png` (identity first, rack beside it) | Bridge has a dead middle column, and the crew rail is below the fold at 1440 |
| Type, colour, material | 8 | `qa/preflight-clean-1440.png`, `qa/logbook-1440.png` | The 3D figures are murky on the noir stage (`qa/bridge-captain-1440.png`) next to the lit DOM portrait |
| Responsive intent | 6 | `qa/board-360.png`, `qa/board-390.png` | The boarding primary is clipped or off-screen on phones |
| Simplicity (one primary, one next goal, ≤ 2 levels) | 6 | `simplicity.spec.ts` exists. The template Bridge has 1 filled and 6 outlined buttons in the first viewport | Clean Pre-flight's only primary is disabled. The next goal reads "Next: PF-03". Armory's commit is below the fold |
| 3D against the ArkhEthos requirement | 6 | Real GLB turntable with bone-attached artifacts, a walkable corridor (`finish/board-after-1440.png`), a 3D hangar ring, and a DOM fallback (`qa/webgl-none-bridge-1440.png`) | `qa/board-1440.png` and `qa/board-1024.png` are pure black with no loading state. The hangar framing breaks when the hangar holds more than one ship. The orbit items look like decoration |
| Gamification quality and ethics | 8 | Eight commissions tied to outcomes, with "None of them unlocks anything" (`qa/logbook-1440.png`). The Codex line is labelled Simulated (`BridgePage.tsx:123`) | Some counts carry no truth label (see m1) |
| Accessibility | 7 | `results.json` has 0 axe violations at all four widths. A focus walk ran. Keyboard e2e exists | The phone primary is hidden inside a scroll panel. "Next: PF-03" is opaque to screen readers |
| Fidelity to DESIGN.md numbers | 7 | `tokens.css` 56/44/36, tier rims (`armory.css:38-40`), `motion.test.ts` reads DESIGN.md | The orbit and rim behaviour breaks the motion contract (M3). The identity role is 26px; the token is 22 |
| Content and CTA coherence | 8 | Plain copy, and the blocker is named in place (`qa/preflight-blocked-1440.png`) | "A blocker holds the ring at 99" sits beside a ring that shows 93 |

## 3. Findings

**Major**

- **M1. Clean Pre-flight has no usable primary.** Copy kickoff prompt is disabled until a folder
  path is entered (`ExportPanel.tsx:135`). The field shows only a placeholder, and the next goal,
  "Export", is an outline button (`qa/preflight-clean-1440.png`). A first-time user lands on a grey
  button with no stated reason. *Fix:* when `needPath`, make the path field the focused next goal
  and add one line under the button: "Enter the folder path to enable".
- **M2. The boarding primary is hidden on phones.** At 360 the panel cuts off after Ledger Nin and
  "Walk in" is not visible (`qa/board-360.png`). At 390 it is clipped (`qa/board-390.png`). The
  panel scrolls internally (`ship.css:779`). It also reserves 72px for a tab bar that is not shown.
  *Fix:* make `.ship-wp-actions` `position: sticky; bottom: 0` inside the card, and drop the
  tab-bar offset on this route.
- **M3. The orbit artifacts read as clutter, not gear.** Three gold "Saturn" discs float above the
  head and compete with the face (`qa/bridge-captain-1440.png`, `-390`, `custom-1440`). Two code
  choices contradict DESIGN.md's rule that only the active artifact orbits, with a rim, while the
  others rest:
  - every orbit-slot item turns (`WornArtifacts.tsx:214`);
  - every floating item gets a halo (`ArtifactMesh.tsx:88`).

  Floating scale is 1.7 (`ArtifactMesh.tsx:17`). *Fix:* turn the ring and draw the halo only for
  `active`, and cut floating scale to about 1.1.
- **M4. The hangar framing assumes a single ship.** `FIT_WIDTH 4.5` ignores `RING_RADIUS 3.4`
  (`FleetRing.tsx:21-26`). In `qa/hangar-1440.png` (more than one ship):
  - a neighbouring hull is clipped at the right edge;
  - a far hull renders as a blurred green column;
  - the front hull spills over its ring.

  Anyone who commissions a second ship gets this. *Fix:* fit width = `2·RING_RADIUS + HULL_LENGTH`
  when n > 1, or hide hulls that are not in focus behind the camera.
- **M5. The Armory commit is off-screen.** With a ship, the inspector stacks under the 420 loadout.
  Its compare strip and "Equip to member" start at y≈867 of 900 (`qa/armory-custom-1440.png`).
  That breaks "equip from where you browse". *Fix:* when a card is picked, order the inspector
  above the loadout in the 420 column.

**Minor**

- **m1. Truth labels are missing on three numbers**, against 06 §7.6 ("every number"):
  - Logbook ship row: "0 exports · 0 results · 0 runs";
  - Hangar card: "7 crew · 13 stages · 3 gates";
  - Voyage head: "13 stages · 3 gates".

  *Fix:* one Verified tag per line.
- **m2. The next goal reads as a code.** It says "Next: PF-03" (`ShipNav.tsx:101`,
  `qa/state-retired-artifact-1440.png`). *Fix:* use the fix target's label, for example "Fix
  Captain Oddvar Quill".
- **m3. The Bridge's empty middle column.** Under "Crew ecosystem" the middle column is empty,
  while the crew rail, Recruit and Codex sit under the turntable below the fold
  (`qa/bridge-captain-1440.png`). *Fix:* at ≥ 1200, place `CrewRail` + Recruit + Codex in
  `ship-profile-main` under the identity card.
- **m4. The 24px pill ring looks complete when it is not.** At 93% it reads as full because the
  round caps close the gap (`qa/preflight-blocked-1440.png`). *Fix:* use `strokeLinecap="butt"` in
  `ReadyRing`.
- **m5. Pre-flight copy contradicts itself.**
  - "A blocker holds the ring at 99" sits beside 93. *Fix:* show the line only when the uncapped
    value would be 100.
  - "13 of 14" sits beside "ALL 15". *Fix:* label the chip "15 (1 n.a.)".
- **m6. The Retired state counts the dead item.** It reads "9 of 9 sockets worn" while one of the
  nine is retired. *Fix:* "8 of 9 worn · 1 retired".
- **m7. The custom Bridge gives a destructive action too much weight.** "Dismiss" is a full-width
  outline in the identity column. *Fix:* make it a `.btn-text`.

**Claims in 07-qa that the evidence does not support**

- §1 Boarding walk "pass": 2 of the 4 board captures show a black scene.
- §1 Hangar "ring centred and whole": the capture shows clipped neighbouring hulls (M4).
- §10 "Armory, no-ship capture offers Clone": `qa/armory-noship-*.png` shows the custom ship
  "Clean fork" with a loadout. The seed failed. Only `finish/armory-after-1440.png` shows the
  no-ship state.
- §1 Pre-flight blocked "pass after cycle 1": the screenshot predates the fix. Only the e2e
  assertion covers it, and I could not see that state.

## 4. What is genuinely good

- The truth model is real and calm. There is one legend line in the Logbook, and the commissions
  say they unlock nothing.
- The Pre-flight blocker is named in three places, each with a fix route
  (`qa/preflight-blocked-1440.png`).
- The DOM fallback is a first-class lit portrait, not an apology (`qa/webgl-none-bridge-1440.png`).
- The boarding corridor in `finish/board-after-1440.png` matches ArkhEthos.
- The initial shell dropped from 310.6 to 209.7 KB after the three-free `familyIds.ts` split.
- Motion numbers are tested against DESIGN.md as text.

## 5. Not verifiable by me

- **Frame rate, 60 desktop / 30 phone.** It needs a foreground GPU browser, and I have no browser.
- **Whether the black boarding captures are a headless timing artefact or a real cold-load blank.**
  It needs a live cold load.
- **The ≤ 5 MB before the first interactive frame.** It was derived from file sizes, not network
  order.
- **Orbit motion, drag, equip arc and the hull sweep.** Stills cannot show motion.
- **The Playwright 98/0/12 result.** I was told not to run the suites.

---

## Author fix cycle (cycle 2 of 2)

The director fixed M1–M5 and m1–m7, recaptured the screens and corrected 07-qa in commit
`dc1cbbb`. Details are in `07-qa.md` § 13; the gates are in § 12.

---

> Re-review written by the same independent critic against `dc1cbbb` and saved by the director
> verbatim. Both fix cycles are used, so findings n1–n5 are open items for the owner at Gate C, not
> fixed here.

# 10 — Finish review, re-review (review 2 of 2)

I checked commit dc1cbbb myself: the source diffs, every recaptured PNG I cite below, and `results.json`. I re-ran three gates: `npm run typecheck` is clean, `npm test` is 252/252, and `verify.py` is CLEAN. `results.json` has 13 screens at each of the four widths, with 0 axe serious or critical and 0 overflow at every width. I did not run Playwright.

## (a) Verdict: **ship**

All five majors are fixed and the evidence supports each fix. Three of the seven minors are fully fixed. Of the other four, two are fixed in code but have no recaptured screen (m2, m6), and two are fixed with a small residue (m1, m5). The new defects are all minor and do not block shipping.

## (b) Score: **79/100** (was 71)

Design 31/40, usability 24/30, creativity 15/20, content 9/10. Delivery risk: **medium**, only because the frame rate is still unmeasured.

| Dimension | Score | Evidence | Remaining gap |
|---|---|---|---|
| Hierarchy and composition | 8 (+1) | `bridge-custom-1440.png`: the crew list now fills the middle column | Turntable feet are still below the fold at 1440 |
| Type, colour, material | 8 | `board-1440.png`: the corridor is lit and readable | The 3D captain is still murky on the noir stage |
| Responsive intent | 8 (+2) | `board-360.png` / `-390`: Walk in is pinned at the card's foot | The 7th crew chip at 360 scrolls under the pinned bar |
| Simplicity | 8 (+2) | `preflight-clean-1440.png`, `preflight-blocked-1440.png`, `armory-custom-1440.png`: one primary each, all in the first viewport | Some fix labels still show ids (n4) |
| 3D against ArkhEthos | 7 (+1) | Full corridor at 1024 and 1440. Hangar hulls are whole (`hangar-1440.png`). Orbiters rest (`WornArtifacts.tsx`) | The hangar hulls are now small (n1). ship-e reads as a creature, not a hull (n2) |
| Gamification and ethics | 8 | Truth labels added on the Hangar card, the Voyage head and the Logbook row (`hangar-1440.png`, `logbook-1440.png`, `VoyagePage.tsx:160`) | none new |
| Accessibility | 8 (+1) | `results.json`: axe 0 and overflow 0 at four widths. Skip to bridge now has a dark backing | The veil is `aria-hidden`, so a screen-reader user gets no loading cue |
| Fidelity to DESIGN.md | 8 (+1) | Only the active artifact orbits and carries the rim (`ArtifactMesh.tsx:88`, `WornArtifacts.tsx`). Floating scale is 1.1 | The identity role is still 26px; the token is 22 |
| Content and CTA coherence | 9 (+1) | "All 15 (1 n.a.)". The cap line is gone beside 93 | — |

## (c) Original findings

| # | Status | Evidence |
|---|---|---|
| M1 | **fixed** | `preflight-clean-1440.png`: **Enter the folder path** is the only filled button. Copy is quiet, with "Enter the folder path above to enable." The code is at `PreflightPage.tsx:215` and `ExportPanel.tsx:135`. `simplicity.spec.ts` asserts both states. |
| M2 | **fixed** | `board-360.png` and `board-390.png` show Walk in at the card foot. The sticky `.ship-wp-actions` rule is in place, and the 72px tab-bar offset is replaced by the safe area (`ship.css`). |
| M3 | **fixed**, with a residue | Only the active artifact orbits; the others rest at fixed phases. The halo is drawn only when `active`. Scale is 1.1. In `bridge-captain-1440.png` the items are smaller and clear of the face, but at this camera angle they stack into one gold cluster (n3). |
| M4 | **fixed** | `fitWidth(n)` and the `SkeletonUtils.clone` are in `FleetRing.tsx`. In `hangar-1440.png` all hulls are whole, nothing is clipped, and there is no green column. |
| M5 | **fixed** | `armory-custom-1440.png`: the compare strip and **Equip to Captain Oddvar Quill** sit at y≈655, above the loadout. |
| m1 | **fixed** | `hangar-1440.png`, `logbook-1440.png`, and the code in `VoyagePage.tsx`. |
| m2 | **partly** | The label now comes from `fix.label` (`ShipNav.tsx:101`). But `fix.ts:22` ("Fix stage <id>") and `fix.ts:28` ("Open X's <skill-id>") can still show ids. No failing-check Bridge screen was recaptured. |
| m3 | **fixed** | `bridge-captain-1440.png` and `bridge-custom-1440.png`: the crew rail sits under the identity card. |
| m4 | **fixed** | `preflight-blocked-1440.png`: the 13-of-14 pill now shows a visible gap. |
| m5 | **fixed** | `preflight-blocked-1440.png`: no "holds the ring at 99" line, and the chip reads "All 15 (1 n.a.)". |
| m6 | **fixed in code** | `LoadoutRack.tsx` makes the change and `bridge.spec.ts` asserts "8 of 9 sockets worn · 1 retired". `state-retired-artifact-*.png` was not recaptured. |
| m7 | **fixed** | `bridge-custom-1440.png`: Dismiss is a text link at its own width, and the confirm button is quiet. |

All four of the 07-qa claims I disputed are now corrected:

- **No-ship Armory:** `armory-noship-1440.png` was taken in an empty context and shows Clone SS Full Run.
- **Boarding:** the captures show the corridor, not black.
- **Hangar:** the 07-qa row is corrected in place.
- **Pre-flight blocked:** it is recaptured after the fix.

## (d) New defects from the fixes (all minor)

- **n1. Hangar hulls are now small.** With more than one ship, `fitWidth` backs the camera off until the focused hull is about 40% of the stage, and roughly half the canvas is empty (`hangar-1440.png`). That partly brings back the director's earlier "small hull in a large canvas" defect. *Fix:* fit the focused hull plus its nearest neighbours, and let far hulls crop at the edge, softened.
- **n2. ship-e reads as a creature.** It renders as an upright green body with eyes at the left of the ring (`hangar-1440.png`, `hangar-1024.png`). Its scale and clip are now correct, but it does not read as a hull next to the four others. *Fix:* check its orientation against the source GLB. If it is upright by design, keep it out of the default ring.
- **n3. The orbit items stack.** At the turntable's camera angle, the active path (×1.2 radius, +0.06 m) overlaps the resting items, giving one gold clump (`bridge-captain-1440.png`, `-390`). *Fix:* raise `ACTIVE_ORBIT_LIFT` to about 0.15, or spread the resting phases across the front half.
- **n4. Some fix labels still show ids** (m2's residue): `fix.ts:22,28`. *Fix:* use the stage label and the artifact name.
- **n5. The loading veil has two edge cases.**
  - It lifts on `seen && !active`, otherwise only after 20 s. If drei's loader never reports activity on a fresh store, the stage stays veiled for 20 s. *Fix:* also lift it when the scene reports ready.
  - It is `aria-hidden`, so it gives screen readers no status. *Fix:* add a polite status line.

## (e) Still not verifiable by me

- **Frame rate** (60 desktop / 30 phone): there is no foreground GPU browser.
- **What a cold load looks like.** The harness waits for the veil to lift and then 4.5 s more, so no capture shows the veil itself. The "black until about 3 s, corridor by about 4.5 s" timing is the author's measurement, not mine.
- **Motion:** the active orbit at 0.25 rps, the resting items staying still, and the sticky bar while scrolling. Stills cannot show any of these.
- **The Playwright 98/0/12 and phone 1/1 results.** I was told not to run them.
- **m6 on screen:** there is no recaptured Retired state.


# 10 — Finish review v2 (independent critic, award-rubric)

**What the critic checked** (HEAD b39b42a, read-only):

- **Read:**
  - PRODUCT § v2, `12-build-plan-v2.md`, PROGRESS T15–T25, and 07-qa § v2 with `results.json`;
  - all 30 PNGs in `qa-screens/v2/`;
  - the code: `domain/{trial,regatta}.ts`, `dev/trial.ts`, `scene/Arena.tsx`,
    `features/regatta/RegattaPage.tsx`, `TuningCard.tsx`, `hangar/FleetRing.tsx`, `ShipNav.tsx` and
    `ethics.test.ts`.
- **Re-ran:** `npm run typecheck` (clean) and `npx vitest run` (307/307).
- **Drove the dev server** with one-off Playwright scripts:
  - dry regattas at 1440 and 1024, timing the reveal and measuring the winner line's position;
  - a Forge edit up to Preview only;
  - the Hangar, full page;
  - the nav at 390;
  - the 3D Bridge;
  - the phone results;
  - clone → tune → "Trial in the Regatta" → race, twice: an addendum-only variant, and the critic
    moved to haiku.
- **Did not:**
  - call apply, start or rebuild;
  - run the Playwright suites, `verify.py` or a production build.

(Transcribed by the director from the critic's report. The text is shortened only where it repeated
the tables.)

## 1. Verdict: **ship with fixes**

**What works.** v2 really is connected to the library:

- A library change reaches the open UI with no reload.
- A Forge edit previews as an exact one-line diff: `model: opus` → `model: sonnet`, with only a
  preview call.
- Variants and forks work, with undo.
- The ranking ethics are enforced in code.

**What is weak** is the centre of the request, "customise, then test and compare, as a game":

- Dry trials cannot see agent tuning. An addendum-only variant ties its parent exactly.
- Half the live "Verified" score is self-reported.
- The race animation inverts the result: the ship with the shorter voyage crosses first, even when it
  loses.

None of this blocks a dev-only tool whose deployed build is read-only. M2 and M4 must be fixed before
the first real live trial, because that trial seeds the only ranked leaderboard.

## 2. Score: **75 / 100** (was 79; target 85)

Design 29/40, usability 24/30, creativity 13/20, content 9/10.

| Row | Score | vs 79 | Evidence | Remaining gap |
|---|---|---|---|---|
| Hierarchy and composition | 7 | −1 | The Forge rack and bench read cleanly. Regatta setup has one primary, with its reason beside it | After a 7.6 s reveal the winner line is below the fold: y=935 at 1440×900 and y=776 at 1024×768. The single-ship Hangar crops its hero hull (m1) |
| Type, colour, material | 8 | 0 | The new surfaces keep the noir/cotton system. Truth chips appear everywhere | The arena reads as a debug view next to the lit Bridge |
| Responsive intent | 7 | −1 | 0 px overflow on all 28 screens. The phone course stacks scores over lanes | At 390 the nav hides Logbook and Forge off-canvas with no cue (m2). At 360 the arena crops the third hull |
| Simplicity | 8 | 0 | Forge is Preview → Apply. Results end with Tune · Edit · Run live for each ship | The Bridge's first viewport gains one more outlined button |
| 3D against ArkhEthos | 7 | 0 | The arena moves on reveal events. ship-e is gone | Hulls overlap lanes, and some sail stern-first (m4). Three gold discs sit above the captain's head. No v2 capture of the 3D Bridge |
| Gamification and ethics | 6 | −2 | Strong rules: Simulated never ranks, ties share a place, stale records never count, unranked rows are in name order | The race inverts the result (M3). Every post lights, not only the winner's. Dry scoring cannot see tuning (M1). Live "Verified" includes self-reported points (M2) |
| Accessibility | 8 | 0 | axe 0 on all 28. The arena is `aria-hidden` and the course carries the numbers. The log has `role="log"`. The veil is a polite status | No keyboard walk of the v2 screens. Focus goes to an off-screen region with `preventScroll` |
| Fidelity to DESIGN / plan 12 | 7 | −1 | Identity role at 22px. The fallbacks work | Plan 12 § 2 art direction is largely unbuilt. Each buoy takes 420 ms, against 0.6–1.2 s in the spec |
| Content and CTA coherence | 9 | 0 | The live dialog is honest about cost, account, scratch folder and caps | "all 1 gates held". The permission-prompts line is misleading in headless mode (m9). One fixture serves three briefs (M4) |

**Delivery risk: medium, edging high for live trials.**

- No real live trial has run.
- The Windows CLI lookup is likely to fail.
- Frame rate is unmeasured.
- The production check has not been re-run since T19.

**Confidence:** high on M1–M3 and M5; medium on M4's spawn bug (inferred from `where` behaviour).

## 3. v1 open items

| # | Status |
|---|---|
| n1 | Fixed in code for 2+ ships; not on screen. The single-ship Hangar crops (m1) |
| n2 | Closed by exclusion |
| n3 | Partly fixed: the items spread across a front arc, but three gold discs sit in a row above the head |
| n4 | Fixed in code; no failing-check capture |
| n5 | Fixed in code; not captured |

## 4. Findings

### Majors

**M1. Dry trials are blind to agent customisation.**

- An addendum-only variant ties its parent at 89.3 in every criterion.
- A critic moved from opus to haiku scores 89.0 against 89.3: the override reaches only economy.
- *Fix:*
  - when the entrants differ only in tuning, say so and drop "First, tied";
  - add a Tuning-card line saying tier and addendum are judged only live;
  - optionally, add a role-fit criterion.

**M2. Live "Verified" includes self-reported numbers.**

- Coverage (35) and gates (15) come from the run's own `run.json`, and the prompt names its keys.
- Any non-empty gate value counts.
- The whole result is Verified whenever a `run.json` exists, and only Verified results rank.
- *Fix:*
  - label the `run.json` criteria as reported by the run;
  - keep Verified for what the server measures;
  - rank on the measured part only.

**M3. The race tells the wrong story, and the winner gets no moment.**

- Each lane spreads its own buoys and advances one per beat, so the shorter voyage finishes first.
- Every lane's post lights up.
- *Fix:*
  - drive the hull's x from the score, with every lane revealed over the same duration;
  - light only the winner's post, with the word "Winner".

**M4. Live trials are unproven and cannot exercise a crew.**

- There is no subagent tool and no `--model`, so one session reads the plan's tiers as text.
- All three briefs use `landing-mini`.
- `claudeBin()` takes the first `where` line, which may be an extensionless shim, so the spawn may
  fail (inferred, not run).
- *Fix:*
  - prefer `.exe`, then `.cmd`;
  - say plainly that one session follows the plan;
  - one fixture per brief;
  - a real smoke trial once the owner approves.

**M5. The payoff lands off-screen.** Focus moves to the results with `preventScroll`, and the winner
line is below the fold.

- *Fix:* scroll the results into view on finish, or put the winner sentence in the race head.

### Minors

- **m1.** The single-ship Hangar crops its hero: the 4.6-unit focus ring is wider than `FIT_SINGLE`
  4.5.
- **m2.** At 390 the phone nav hides Logbook and Forge with no cue. *Fix:* an edge fade.
- **m3.** 07-qa's results claim is only partly supported:
  - `regatta-results-1024.png` shows a blank arena;
  - `regatta-results-360.png` is from before the fix;
  - the tuning screens were taken with `?2d`.
- **m4.** Hull length 1.7 crosses lanes. Some hulls sail stern-first. At the finish the gate
  octahedron hides under the hull. *Fix:* a length of about 1.15, and a bow table.
- **m5.** The reveal pace is off-spec. *Fix:* about 700 ms per beat.
- **m6.** Plan 12 § 2 art direction is not built. *Fix:* build it, or amend § 2.
- **m7.** "Trial in the Regatta" from a fork preselects only the fork. *Fix:* also preselect
  `origin.from`.
- **m8.** Promote carries only the tier. *Fix:* say "addenda stay on this ship".
- **m9.** Copy:
  - the "permission prompts" line is wrong in `-p` mode;
  - "all 1 gates held".
- **m10.** Live economy will nearly always score 0, because cache-read tokens are counted. *Fix:*
  count input plus output only.
- **m11.** The production check has not been re-run since T19, and the trial endpoint strings sit in
  the bundle. *Fix:* re-run the check and extend it to those strings.
- **m12.** 27 v1 PNGs are modified in the working tree but not committed.

## 5. What is genuinely good

- **The live library:** the stale banner works, the last good index is kept, and Rebuild never runs
  on save.
- **The Forge is safe and precise:**
  - edits only allow-listed paths;
  - refuses a file with uncommitted changes;
  - checks hash preconditions before writing;
  - rolls back to the exact bytes;
  - shows an exact diff.
- **The ranking ethics** are enforced in code.
- **The live runner's guardrails:**
  - a scratch folder outside the repo;
  - a typed phrase to start;
  - one run at a time;
  - turn and wall-clock caps;
  - no bypass flag;
  - a tree kill on cancel.
- **The results explain themselves,** with Tune and Edit links for each ship.
- **Checks:** axe 0 and overflow 0 on all 28 screens; typecheck and 307/307 green.

## 6. Not verifiable by the critic

- a real live trial;
- Rebuild and Forge Apply end to end;
- frame rate;
- the Hangar with two or more ships;
- the Playwright, phone and fake-CLI results;
- the production bundle.
