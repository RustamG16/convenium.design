# Convenium.Design Studio — Loadout Plan

Measured UI/UX audit + the locked-pipeline / open-loadout architecture + the improvement loop.
Authored 2026-09-03, amended 2026-09-03 for unattended execution. Supersedes
`CONTINUOUS-IMPROVEMENT-PLAN.md` for phase ordering, for the direction rule, and for gates.

## Execution contract (amended)

- **This plan runs unattended.** There are no human gates. Every exit gate below is a
  measurement the implementing session verifies itself and records.
- **Full redesign is mandated, not optional.** The old look is evidence and anti-reference,
  not a thing to preserve. Product truth, content, function and the Olympus pipeline are
  preserved; the visual world is replaced.
- **One direction. No alternatives.** Do not generate two or three concepts. Do not run a
  selection ceremony. The director resolves one coherent world at intake and commits to it.
  The `CONTINUOUS-IMPROVEMENT-PLAN.md` Phase-2 line listing "Editorial Utility, Technical
  Instrument, Native Studio" as candidates is void.
- **Target is the best achievable UX/UI**, judged by the T1-T11 thresholds in section 06 plus
  the director's own craft standard. Thresholds are the floor, not the ambition.

## 00 Method

Ran `server.mjs` on :4173 against committed `data/systems.json` and the 84-skill registry,
walked all 8 views headless at 1440x900, and read **computed** styles: every rendered text
node's font-size, its foreground vs resolved opaque background, and every control's hit box.

`node .agents/skills/impeccable/scripts/detect.mjs --json public/index.html` returns `[]`.

**Process finding:** the detector reports clean while 165 text nodes fail contrast and 289
controls are under the stated minimum. The detector reads markup patterns; every real defect
lives in computed values. The improvement loop is blind — that is why five slices have not
converged. Instrumenting it is P0.

## 01 The finding that reorders everything

`DESIGN.md` — read by every agent run before frontend work — ratifies:

| Role | Specified | Verdict |
|---|---|---|
| label | 9px | unusable |
| mono | 10px | unusable |
| body | 12px | below floor |
| title | 14px | below floor |
| headline | 17px | acceptable |
| display | clamp(30px,4vw,58px) | 6.4x the body |

The microscopic type is **not drift — it is the spec, correctly implemented.** Any session
that reads DESIGN.md and does its job faithfully rebuilds 9px labels. No CSS work should begin
until DESIGN.md is amended and re-ratified.

DESIGN.md also specifies a cool cyan/violet palette (#4cc9ff action, #a982ff gate, #07090e ink).
No gold, cream or serif anywhere in it. Work ships a warm gold/cream serif world; Architecture
ships neon cyan/violet. Both live. Neither documented.

## 02 Measured density (1440x900)

| View | Text nodes | <13px | Share | Contrast fails | Targets <32px | Dominant |
|---|---:|---:|---:|---:|---:|---|
| Knowledge/Library | 338 | 329 | 97% | 107 | 22 | 9px x190 |
| Playground | 225 | 218 | 97% | 6 | 171 | 10px x171 |
| Architecture | 352 | 328 | 93% | 20 | 84 | 9px x113 |
| Agent Profiles | 67 | 56 | 84% | 12 | 5 | 8px x34 |
| Work | 51 | 40 | 78% | 13 | 5 | 10px x17 |
| Oracle | 39 | 30 | 77% | 3 | 2 | 11px x14 |
| Systems | 30 | 18 | 60% | 3 | 0 | 9px x6 |
| Runs | 15 | 8 | 53% | 1 | 0 | 10px x4 |
| **Total** | **1117** | **1027** | **92%** | **165** | **289** | |

PRODUCT.md commits to 36px desktop targets; missed in 289 places. All 165 contrast failures
sit between 3.28:1 and 4.49:1. Every font-size is `px`, zero `rem` — WCAG 1.4.4 fails product-wide.

## 03 No design system underneath

`styles.css`, 771 lines, 18 custom properties (all colors):

| Dimension | Tokens | Raw values | State |
|---|---:|---|---|
| Color | 18 | 48 hex + 112 rgba literals | partial |
| Type scale | 0 | 27 unique px sizes, 0 rem | absent |
| Spacing | 0 | ad hoc | absent |
| Radius | 0 | 25 unique values | absent |
| Motion | 0 | 10 transition declarations | absent |
| Elevation/z-index | 0 | 14 spellings | absent |

7 `!important`. **You already wrote the fix:** `library/doctrines/convenium-design-instrument/design.md`
specifies sizes 11/12/13/14/16/20/28, spacing 2/4/6/8/12/16/24/32, rows 28-32px, one grotesque
with tabular numerals, semantic-only color, motion <150ms feedback-only — and calls itself
"the structural base ConveniumDesign_claude's own dashboard is built on." It isn't. Convenium.Design Studio
violates its own Instrument doctrine on every clause. P2 is adoption, not invention.

## 04 Ranked defects

- **CRITICAL — active system is empty, app degrades silently.** `Untitled system`, 0 agents,
  set active. Architecture renders 5 "No agent" lanes, header reads "0 active agents", no
  empty state and no recovery path. Needs a guard against saving an empty active system.
- **CRITICAL — "Customize skills" is 84 checkboxes in a `<details>`,** twice on screen, 10px,
  raw slugs. 58 of 84 are `unrouted` and can never affect the run. Replaced by section 05.
- **HIGH — two visual worlds.** Warm editorial (Work) vs cool instrument (Architecture).
  CIP Gate B said lock one; two are live.
- **HIGH — generated imagery as background ornament in 3 views.** Violates the plan's own
  anti-AI rules. Ornament is what an interface reaches for when its type is too weak to carry
  authority; fix the substrate and the appetite disappears.
- **HIGH — same fact stated 3x per screen.** "Olympus" as toolbar pill + orientation cell +
  inspector row within 900px. Privacy 2x, runtime 3x.
- **HIGH — Work composer clips at the viewport edge** at the stated target size, with a second
  misaligned surface behind it.
- **MEDIUM — unlabelled checkbox beside every agent approval toggle.** Token budget is a raw
  number with no unit or cost translation.
- **MEDIUM — Library shows slugs, not skills.** Alphabetical machine ids, "0 sources" on all,
  none marked in-use, absolute filesystem path in the chrome, two competing taxonomies
  (`group` vs `category`) with neither explained.
- **MEDIUM — Design DNA exists in the library and nowhere in the product.** Complete
  taste-profile system present: `schemas/taste-profile.schema.json`, 4 doctrines with
  profile.json + design.md, `convenium-design-style-picker` (fast) and `convenium-design-taste-interview` (deep).
  `library/design-dna/` holds one `.gitkeep`. Nothing in the UI can create, show or attach one.

## 05 Architecture: lock the pipeline, open the loadout

**LOCKED — Olympus pipeline.** Not editable, not duplicable, no "New system" button.
5 agents (Convenium.Design/Athena/Calliope/Hephaestus/Hermes), phase ownership, Gates A/B/C,
orchestrator-owns-the-answer, intake→audit→direction→build→verify.

**OPEN — the loadout.** Named, saved, duplicated, compared:
skill slots · Design DNA · brief · tools & MCP · budget & approval.

### Skill slots (derived from the existing registry, not hand-authored)

| Slot | Owner | Question | Candidates (default first) |
|---|---|---|---|
| Craft | Hephaestus | What does finished feel like? | apple-design · emil-design-eng · awwwards-web-design · impeccable · ui-ux |
| Direction | Calliope | How is the concept formed? | concept-studio · taste-first-experience-design · award-rubric |
| Evidence | Athena | What grounds the decision? | ux-evidence-audit · reference-deconstruction · customer-research · design-analytics |
| Structure | Athena | How is the product organised? | site-architecture · pick-ui-library |
| Motion | Hephaestus | How does it move? | gsap-core + conditional (scrolltrigger/timeline/react/frameworks/plugins) |
| Media | Hermes | Where do assets come from? | asset-director · higgsfield-generate · garden-gpt-image-2 · image |
| Copy | Calliope | Who writes the words? | copywriting · copy-editing |
| Verify | Hermes | What counts as done? | visual-qa · award-rubric · gsap-performance |

Eight questions with 3-5 real answers each, replacing 84 checkboxes. Every slot has a default,
so a loadout is valid untouched. The Craft slot alone justifies the model — swapping
apple-design / emil-design-eng / awwwards-web-design produces three genuinely different
outputs from one brief, and that is the product demo. The 58 unrouted entries stop being
choices and become a browsable capability library. Keep an **Advanced** disclosure exposing
the flat list so nothing possible today becomes impossible.

### Design DNA

Three ways to fill the field, ascending cost: pick one of 4 shipped doctrines
(convenium-design-atelier / convenium-design-kinetic / convenium-design-instrument / convenium-design-cyberpunk-athens);
run `convenium-design-style-picker` to pre-fill and adjust; run `convenium-design-taste-interview` for bespoke.
All write a schema-valid profile into `library/design-dna/`. Show the profile's `avoidList`
as prominently as its preferences — the schema says avoidList unions and is never overridden,
making it the most load-bearing and currently least visible field.

### Interface changes

| Today | Becomes | Why |
|---|---|---|
| Systems (create/duplicate/delete rosters) | **Loadouts** — read-only pipeline above editable loadout | Removes the class of bug that put an empty untitled system in charge |
| Agent Profiles as separate page | Agents inline in the pipeline, expanding to slots/budget/approval | An agent has no meaning outside the pipeline |
| Playground "Setups" + 84 checkboxes | Loadout A/B/C, diffed by slot, showing only differences | A comparison is only readable if you can see what changed |
| Library — 84 slugs, 0 sources | Candidates grouped by slot, marked in use / available / unrouted | Answers the question the page is opened to answer |
| Architecture — free node editing | Read-only pipeline map reflecting the loadout | Node editing authored a second system the loadout replaces |

## 06 "Apple-level" made falsifiable

Loop stops when all 11 hold simultaneously across all views.

| # | Threshold | Now | Target |
|---|---|---:|---:|
| T1 | Rendered text below 13px | 92% | 0 |
| T2 | Body text size | 12px spec | >=15px |
| T3 | Type in rem; UI holds at 200% zoom | 0% | 100% |
| T4 | Contrast failures (AA) | 165 | 0 |
| T5 | Controls <36px desktop / <44px narrow | 289 | 0 |
| T6 | Distinct visual systems shipping | 2 | 1 |
| T7 | Non-semantic accent hues | 3 | <=1 |
| T8 | Unique radii / spacing tokens | 25 / 0 | <=4 / 8 |
| T9 | Views with working empty state + one primary action | 2 of 8 | 8 of 8 |
| T10 | Decorative media with no informational role | 5 assets | 0 |
| T11 | Destructive actions without undo | 3 | 0 |

Nine are machine-checkable — that is what makes the loop terminable. T6 and T9 need a human
call and belong at a gate. Beauty is deliberately not a threshold: each T above is legibility,
predictability, or not-having-to-look-twice made countable. Chase taste first and you get what
Convenium.Design Studio has now — a gold serif headline on top of 9px labels.

## 07 The loop

P0-P2 are strictly sequential. P4 repeats per surface. P5 never ends.

**P0 — Branch, then instrument the loop (~1 slice).** First create `redesign/loadout-program`
in *both* repos — the root `Convenium.Design` repo (on `unification`, and it tracks 196 files under
`convenium-design-studio/`) and the nested `convenium-design-studio` repo (on `main`) — and take a checkpoint
commit on each, so both original branches are left untouched as the rollback point. Then write
`scripts/ui-metrics.mjs`: boot the server, walk 8 views at 1280/1440/1920, emit T1-T11 as JSON
plus a diff against the previous run. Commit the baseline. Wire into `npm run check`.
Touch no CSS. Never push.
*Exit:* both repos are on `redesign/loadout-program` with a checkpoint commit and clean
trees; the script reproduces section 02 within ±2, runs <60s, and fails the build on regression.

**P1 — Replace the spec (~1 slice).** Rewrite DESIGN.md as the specification of one new
visual world, resolved by the director at intake without generating alternatives. Mandatory
content: a type scale in rem with a 13px label floor, 15-16px body and a display that stops at
32px; complete token families for color, spacing, radius, motion and elevation; at most one
non-semantic accent hue with all other colour semantic; a stated position on density, rules,
numerals and motion duration. Record the resolved world and what it replaces, with the date, in
PROGRESS-AND-DECISIONS.md. Update the AGENTS.md frontend-quality clause to cite the metrics
script as the evidence standard.
*Exit (self-verified):* amended DESIGN.md contains every token family P2 consumes, declares one
accent, and specifies no size below 13px. No CSS written in this phase.

**P2 — Rebuild the substrate (2-3 slices).** Author the full token set; 48 hex + 112 rgba
literals to zero. Convert all type to rem. Raise every hit target to 36/44px (forces real
layout change in Playground's 171 and Architecture's 84 — that is the point). Collapse 25 radii
to <=4, 10 transitions to 3 motion tokens <150ms, 14 z-index spellings to a named layer scale.
Stop referencing the 5 decorative WebPs in CSS/markup - do NOT delete files under
  `public/media/`, which is protected. Keep agent portraits and give them a reserved aspect box.
Delete the 7 `!important`s by fixing their specificity causes.
*Expect it to look worse mid-phase.* Density triples; layouts that only fit at 9px break.
Do not patch with smaller type.
*Exit:* T1, T3, T4, T5, T7, T8, T10 pass. No new console errors. No overflow at 1280/1440/1920.

**P3 — Ship the loadout model (3-4 slices).**
- Data: derive the slot map from the registry; add `slot` to each routed skill; add a
  `loadouts` store beside the frozen Olympus pipeline; migrate the 4 presets to 4 seed
  loadouts; make the empty-active-system state unreachable.
- Loadouts view: read-only pipeline above the editable loadout; 8 slot rows, each with its
  default and a one-line "what changes if you switch this."
- Design DNA panel: doctrine picker, profile summary, prominent avoid-list, the two interview
  skills as entry points. Writes to `library/design-dna/`.
- Brief, Tools & MCP, Budget as three further loadout sections. Tools keeps the existing honest
  availability reporting — that part is already right.
- Playground: compare loadouts, diffed by slot, differences only.
- Library: regroup by slot; mark in use / available / unrouted; drop the filesystem path.
*Exit:* a Craft-slot swap changes the plan `agents.mjs` produces; two loadouts run in Playground
and the diff is legible without expanding anything; nothing in the pipeline is UI-editable.

**P4 — Surface passes, one at a time (1 slice each).** Order: Work → Loadouts → Library →
Playground → Pipeline map → Runs. Per pass: observe the real task end to end, name the single
highest-friction moment, remove redundancy before adding anything (Work's three "Olympus"
statements go to one), write the empty and error states, re-measure.
*Exit:* T9 passes for that surface, the primary task takes fewer steps or glances, element
count did not rise.

**P5 — Standing critique (continuous).** After every slice: metrics script, keyboard-only pass
of the primary flow, reduced-motion check, console health, independent critique with the
reviewing agent blind to the implementing agent's rationale.
*Stop condition:* all 11 thresholds hold across all views for two consecutive slices. Write
this into CONTINUOUS-IMPROVEMENT-PLAN.md so a future session cannot quietly extend it.
An unattended session that reaches its context limit before this stops by journaling, not by
declaring the program complete.

## 08 Risks and cuts

- **P2 is where programs die.** Raising 289 targets and tripling text breaks layouts that only
  fit because everything was tiny. Budget 3 slices; treat "worse than before" at slice 2 as
  expected, not as evidence the direction is wrong.
- **The slot map is a product decision disguised as a data migration.** If a slot's candidate
  list can't be written without an "other" bucket, that slot is wrong — merge or drop it.
- **Node editing has users, possibly one.** Keep the graph interactive for inspection and
  layout, not for authoring nodes no run will execute.
- **Cut Oracle-as-a-view.** The page and the contextual dock do overlapping work; the dock is
  the better idea and the page costs a top-level slot.
- **Cut the Runs / Browser-experiments split** until real MCP traffic justifies two histories.
- **Do not add mobile.** Scope stays laptop/desktop; 44px narrow stays only because PRODUCT.md
  already says so.

**Shortest useful next step:** P0 + P1 is roughly one working session — two markdown edits and
one script. They unblock everything and are the only part that cannot be parallelised or
deferred.

---
Measured against the live app on 2026-09-03 at 1440x900, running committed `data/systems.json`
and the 84-entry registry. Agent portraits were absent from the measurement environment; the
resulting alt-text overlap in Agent Profiles is a genuine missing-image robustness defect and
is recorded as one. Counts are DOM nodes in the active view, not estimates.
