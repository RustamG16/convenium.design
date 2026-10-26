# V2 — Gate B: the direction, decided on a recorded score

The P0–P5 program ran with *"no human gates … One direction. No alternatives. Do not run a
selection ceremony"* (`LOADOUT-PLAN.md:7-19`). Gate B — direction judged against evidence by
someone who did not author it — is precisely the gate that stops an unjudged direction from
becoming build truth, and it was the one removed. This is that gate, restored.

Three structurally different comps of the same screen (Loadouts, 1440×900, real data from
`systems.mjs`), scored by the read-only `independent-critic` agent, blind to which one the
implementer preferred and blind to the rationale behind any of them.

## The candidates

| | Thesis | Structure |
|---|---|---|
| **A · Rail** | One skeleton; only the content region changes. | 260px rail + content column + 300px inspector |
| **B · Consequence** | The main view shows what the configuration *does*, not the configuration. | Top nav + consequence canvas + 360px properties panel |
| **C · Console** | The process is permanently on screen; everything else is subordinate. | Four horizontal bands: chrome / transport / list+detail / status |

All three shipped an identical token block, so the scoring is on structure and typography, not
colour.

## Scores — weights declared by the critic before scoring

Coherence 25 · Hierarchy 20 · Originality 20 · Fitness 20 · Restraint 15

| Axis | A · Rail | B · Consequence | C · Console |
|---|---:|---:|---:|
| Hierarchy | 74 | 52 | **80** |
| Coherence | **88** | 44 | 82 |
| Originality | 46 | **78** | 72 |
| Restraint | 68 | 48 | **70** |
| Fitness | 62 | 58 | **86** |
| **Total** | **69** | **56** | **79** |
| Rank | 2 | 3 | **1** |

## The finding that matters most

**A won four of the five principles and still lost the total.**

| Principle | Winner |
|---|---|
| P1 the ground recedes | A |
| P2 one skeleton | A |
| P3 one row / panel / parameter grid | A |
| P4 one temperature | A |
| P5 shows the run that ran | **C, uncontested — A and B score zero** |

The critic's reading, adopted here: P1–P4 are hygiene that all three candidates nearly shared
(identical tokens, identical ladder), while P5 is the only principle that changes what the
product *is* — and only one candidate attempted it. **Scored flat, the principle matrix would
have selected the most generic candidate on the sheet.** That is a defect in the matrix as
much as a fact about A, and it is recorded here rather than quietly fixed: `REFERENCES.md`
weights every principle equally, and it should not.

## Defects the gate caught that no threshold could

- **B clipped skill ids mid-word.** `text-overflow` does not apply to a flex container
  (`comp-b-consequence.html:61`), so `olympus-design-direc` and `taste-first-experier` hard-cut
  with no ellipsis, in a product whose subject is skill identifiers. Worse than what ships today.
- **A's screen made a claim its own layout falsified.** Its subhead said *"the third column is
  what changes if you switch it"*; the third column described the currently selected value, not
  the delta.
- **C rendered the locked five-stage route as six cells** — the budget block sat inside
  `.track` with the same borders as the five nodes, misstating the product's central invariant.
- **C's one parameter grid broke in the one place it was halved** — `colspan="2"` voided the
  control column, so a 420px select sat under 224px selects.
- **All three regressed the 36px hit-target commitment** (30px primary action in C, 26px rows
  in B) against the production sheet, which holds it.
- `--line` (#24272d on --surface = **1.25:1**) is fine as a section rule and must never be a
  control boundary.

## Decision

**C is the direction, with three transplants the critic required, not as C shipped.**

1. **From A — the parameter grid** (`display:contents`, one grid that survives being halved).
   Called non-negotiable. C2 additionally fixes the column weighting: the control is a fixed
   320px measure and the *consequence* takes the slack, because the prose is what wants width.
2. **From B — the changed-from-default block.** C says what a value *is*; only B says what the
   change *did*. Rendered only when the count is non-zero, which also avoids B's empty default.
3. **From A — per-destination keyboard shortcuts on nav** (the Raycast rule in
   `REFERENCES.md`).

Plus the five C defects above, fixed. The result is `comp-c2-loadouts.html`.

## Gate conditions the critic set before build

1. **The transport's no-run / stale-run contract must be proven** — it is C's entire margin of
   victory and C only ever showed it mid-run. If it persists when stale it spends ~16% of every
   viewport on eight views showing nothing.
2. **One non-Loadouts view must be drawn in the same skeleton** — P2's real test is the other
   seven views, and no comp carried one.

Both are answered in `comp-c2-work.html`: the transport **never shows stale run state**. With
no run it collapses to its header line, ~34px instead of ~148px, naming the locked route inline
— the invariant stays visible, the staleness does not.

## Confidence and what is still unjudged

High on structure, hierarchy and constraint compliance — measured from source and from rendered
frames at 1440×900. **Low on responsive behaviour, interaction, focus order and zero-data
states**: the comps carry one viewport and one data state each. Those are V4's problem and are
covered by the existing harness, which measures five viewports.

## Artifacts

`comp-a-rail.html/.png` · `comp-b-consequence.html/.png` · `comp-c-console.html/.png` ·
`comp-c2-loadouts.html/.png` · `comp-c2-work.html/.png`

**If the selected direction is wrong, the way back is V1**: promote A (69, and the winner on
four of five principles) and rebuild C2's transport as an A-shell component. Nothing outside
`metrics/comps/` has been changed by this phase.
