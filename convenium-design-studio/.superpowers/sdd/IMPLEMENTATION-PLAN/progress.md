# SDD ledger — plan: D:\Analyst_Designer\Convenium.Design\New_upgradePlan\IMPLEMENTATION-PLAN.md

## Pre-flight

| Task / interface | Produces | Consumes | Finding / ruling |
| --- | --- | --- | --- |
| 1 → 2–11 | Design contract, run record | New state and UI | Task 1 docs are the binding design baseline. |
| 2 → 3–10 | State writer / fixtures | UI service modules | Preserve existing APIs; add parity before replacing. |
| 3 → 10 | Shell + routes | Feature views | Global shell owns navigation and Oracle placement. |
| 4 → 5–10 | Oracle / proposals | Project and configuration state | Every consequence stays proposal-mediated. |
| 5 → 6–7 | Approved plan/hash | Playground and Results | Plan hash invalidation is enforced through Task 2 state. |
| 6 → 7 | Test setup comparison | Results evidence | Draft outputs are explicitly labelled and isolated. |
| 8 → 9 | Knowledge/agent data | System explanation | Graph always has synchronized list. |
| 10 → 11 | Settings / notifications | End-to-end flow | Environment labels remain honest. |

Ruling: The approved Oracle-first plan supersedes older Convenium.Design Studio desktop route vocabulary and desktop-only scope where they conflict. Cost if wrong: legacy paths may require compatibility redirects, so they remain until covered by Task 3.

Ruling: Work proceeds in the existing `redesign/loadout-program` worktree because it contains extensive user-owned uncommitted changes; creating an isolated worktree would omit that required source state. Cost if wrong: commit history is not isolated; no commits will be made or pushed without user authorization.

## Task 1: complete

Implemented documentation contract and machine-readable design system. Independent review passed after one repair round: spec compliance PASS, task quality PASS (95/100). No production code changed.

## Task 2: complete

Implemented additive versioned state contract with fixture migration, hash-bound A/B/C approvals, append-only journal replay, serialized writes, and 17 focused tests. Independent review passed after two repair rounds; sparse arrays, malformed reviews, and failed-evidence Gate C invalidation are covered.

## Task 3: complete

Implemented the canonical Oracle Continuum shell and navigation. The two review findings are repaired: skip-link activation preserves the application route, and project creation now synchronizes the canonical URL, trail, Oracle context, focus, and reload state. The focused shell suite passes 120 browser assertions.

## Task 4: in progress

Implemented the first persistent-Oracle increment test-first: deterministic project classification; a one-question-at-a-time intake that rejects repeated or out-of-order answers; consequence explanations; reviewable brief and Design DNA output without implementation state; contextual project/page/selection tokens with removable optional context; and honest text/voice capability state. The shared dock now renders its text composer and follows canonical route changes while remaining open. Five pure contract tests and seven browser assertions pass. Canonical proposal persistence and the complete interactive questionnaire remain unfinished.
