# Convenium.Design Studio Continuous Improvement Plan

Status: Superseded by `LOADOUT-PLAN.md` for phase ordering, the direction rule, and gates. Retained for the anti-AI rules, the standing loop shape, and the termination condition below.

## Target outcome

Convenium.Design Studio should feel like a deliberate professional desktop tool rather than an AI-generated dark dashboard. Workflow, information hierarchy, and interaction quality should provide the identity. Decorative media is allowed only when it has a measurable product purpose.

## Standing loop

Inspect -> Diagnose -> Propose -> Approve -> Implement -> Verify -> Critique -> Repeat

Completing one implementation slice does not complete the program. Every verified slice produces the next prioritized diagnosis.

## Phase 1: baseline

- Capture Work, Systems, Library, Playground, Oracle, and Runs at laptop and desktop sizes.
- Inventory typography, color, spacing, panels, icons, imagery, motion, content, and interaction patterns.
- Separate functional defects from aesthetic defects.
- Identify patterns that make the product appear generic or AI-generated.
- Select professional product references and score the current baseline.

No gate. The diagnosis and the T1-T11 thresholds are fixed in `LOADOUT-PLAN.md`.

## Phase 2: the visual system

VOID as of 2026-09-03 — superseded by `LOADOUT-PLAN.md`. There is no candidate list and no selection ceremony. The director resolves ONE direction at intake and commits to it; a full redesign is mandated. Define shell, navigation, typography, color, density, components, workflow visualization, motion, media policy, risks, and representative screens for the chosen direction. No decorative generated media is allowed during selection.

No gate. The resolved direction is recorded in `PROGRESS-AND-DECISIONS.md` and implementation proceeds.

## Phase 3: foundation

- Replace ad-hoc styling with semantic tokens.
- Establish consistent typography and spacing scales.
- Standardize buttons, inputs, menus, inspectors, tabs, and feedback.
- Reduce unnecessary containers, borders, micro-labels, and vague copy.
- Define hover, focus, active, disabled, loading, empty, error, and success states.
- Establish reduced-motion behavior.

## Phase 4: workflow sequence

Improve one workflow at a time: Work; Systems and node editor; Library and Agent Profiles; Playground; Oracle; Runs and history.

For every workflow, observe the task, diagnose the highest-impact friction, implement one coherent slice, test the complete task, compare before and after, record defects, and feed findings into the next iteration.

## Phase 5: continuous critique

After every implementation slice, test 1280x800, 1440x900, and 1920x1080; verify keyboard, focus, contrast, readability, runtime, console health, and concept fidelity; run an independent AI-generated-appearance critique; update scores for hierarchy, coherence, originality, usability, and restraint; and select the next backlog item.

A slice passes only when no critical or high defects remain, the primary task is clearer, complexity has not increased without value, the result matches the locked direction, and evidence is recorded.

## Anti-AI rules

- No decorative gradients or glow without state or spatial meaning.
- No generated imagery used as background ornament.
- No excessive cards or nested panels.
- No tiny uppercase text for ordinary information.
- No vague product copy or inconsistent icon styles.
- No animation without feedback or orientation value.
- No feature added only to make the interface appear advanced.
- No design drift after the direction is locked.

## The termination condition — binding, and not extendable

`LOADOUT-PLAN.md` section 06 defines eleven falsifiable thresholds, T1-T11, and section 07
defines exactly one condition under which the improvement loop stops:

> **All eleven thresholds hold across all eight views for two consecutive slices.**

This is written here so it cannot be quietly extended. The rules around it:

1. **The measurement is `scripts/ui-metrics.mjs`, and only that.** A markup-pattern detector
   is not evidence — one reported this interface clean while 165 text nodes failed contrast
   and 289 controls were under the stated minimum. `npm run check` runs the script and fails
   the build on any regression.
2. **"Two consecutive slices" means two slices that each changed something and each
   measured clean.** Re-running the script twice on an unchanged tree is one slice, not two.
3. **A threshold may not be redefined to make it pass.** Definitions changed during the
   program on three occasions and each is recorded in `PROGRESS-AND-DECISIONS.md` with the
   reason and the check on that reason: T5 (a target is the activation area, not the widget),
   T6 (monospace is a data type, not a second visual world), and T9 (measured on markup
   present, not on markup currently rendered). Any further change to a definition must be
   journalled the same way, must make the threshold *stricter or more faithful*, and must not
   be the change that causes the threshold to pass.
4. **Passing eleven thresholds is not a claim that the interface is good.** Each T is
   legibility, predictability or not-having-to-look-twice made countable. They are the floor.
   Beauty is deliberately not a threshold, because chasing taste first is what produced a
   gold serif headline sitting on top of 9px labels.
5. **When the condition is met, the loop stops.** It does not roll into a new backlog by
   default. A further slice needs a stated defect or a stated goal, not momentum.

An unattended session that reaches its context limit before the condition is met stops by
journalling its state, never by declaring the program complete.

### Condition met — 2026-09-03

All eleven thresholds hold across all eight views (and across 390/820/1280/1440/1920) for
three consecutive slices that each changed something and each measured clean:
`1c5ae62` (second independent critique acted on + harness hardened), `ba694e4` (project-tab
casing), `bb27b74` (spacing-token adoption, 492→314 literals). `npm run check` exits 0 on
each. The harness is materially stricter than at T0: T4 now includes WCAG 1.4.11 boundary
contrast, the viewport matrix includes a 390px narrow column, and the motion budget covers
`animation` shorthand and `@keyframes` translation.

Per rule 5 the loop **stops here**. It does not roll into a backlog. Three items are recorded
as carried-forward in `PROGRESS-AND-DECISIONS.md`, each needing a stated decision rather than
loop momentum: two agent portraits held back by a `saturate()` filter (an asset-production
decision), 314 off-scale spacing literals under the ratchet (a spacing-rhythm decision), and
the uppercase-tracked label register (DESIGN.md-sanctioned; a register decision). The last
external read scored the interface 62/100 — above the 52 it started this program at, and the
gap to "good" is taste-level, which section 06 deliberately keeps out of the stop condition.

## Stop conditions (pausing, not terminating)

Pause only when a decision changes product direction, cost, privacy, or architecture; a required asset or permission is unavailable; the loop bounds in `AGENTS.md` are reached (QA repair or anti-loop); or the user explicitly pauses the loop. Do not stop because one page or iteration is complete.

## The loop reopened, 2026-09-03 — and the condition is now two families

Rule 5 says a further slice needs a stated defect or a stated goal, not momentum. The stated
goal was: **the interface reads as AI slop, and the controls do not do what they say.** Both
halves were verified before any work began.

The eleven thresholds could not see either. They measure what the interface LOOKS like, and
all eleven passed while seven independent column systems shipped, while the Design DNA panel
rendered an avoid-list headed "Never, in any run" that no run enforced, while "Do it for me"
prefilled a textarea, and while "Keep this setup" kept nothing.

**Two families now, and the loop stops only when both hold.**

| | Measures | Instrument |
|---|---|---|
| T1–T11 | what it looks like | `scripts/ui-metrics.mjs` |
| B1–B8 | whether it does what it says | `scripts/ui-behaviour.mjs` |
| contact sheet | what it looks like *together* | `scripts/ui-shots.mjs` |

B1 every control wired · B2 every click observable · B3 every command's written promise holds
· B4 every loadout decision reaches the request · B5 no orphan stores · B6 no unbacked runtime
claim · B7 runs survive a reload · B8 clean console and network.

**The stop condition, amended and not extendable:**

> All eleven T thresholds **and** all eight B thresholds hold across every view for two
> consecutive slices that each changed something and each measured clean — **and** the
> direction was resolved at a gate by a critic who did not author it, against a named
> reference set.

The last clause is new and it is the one that matters. v2.0 met a numeric condition and
produced a 62/100 interface because it had deleted Gate B. **A measurement can tell you the
floor is met. Only a gate can tell you the direction is right**, and `metrics/comps/CRITIQUE.md`
is where that judgement is recorded.

Rules 1–5 above apply unchanged to B1–B8. Four B definitions were changed during this
programme; each was made stricter or more faithful, each is journalled in
`PROGRESS-AND-DECISIONS.md` with its reason, and none was the change that caused a threshold
to pass.
