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
