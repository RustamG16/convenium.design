# Design measurement plan

No analytics is in scope (none supplied; the page is private and hosted on GitHub Pages with
no tag). This plan states what *would* be measured so the hypothesis is testable later; nothing
below is instrumented.

## Hypothesis

Because we changed the entrance to the personal universe from nothing into a single cinematic
page built from the inhabitant's own facts and commissioned imagery, for the inhabitant and the
few people he shows it to, we expect scroll completion to the oath to be the norm and a visitor
to be able to name the six paths after one pass, within the first ten visits, without harming
reading comprehension of the facts (no invented claims to retract).

## Baseline

- Source/date range: none; greenfield page, first published 2026-10-21.
- Primary metric: share of sessions that reach `#oath` (scroll depth ≥ 95%).
- Guardrails: no horizontal overflow at any width; no console errors; reduced-motion sessions
  reach the same content; board interactions never exceed the illustrative 140 XP.
- Data limitations: a private page with a handful of visitors never reaches statistical
  significance; the readout below is qualitative.

## Event contract (not instrumented)

| Event | Trigger | Required properties | Purpose | Privacy/consent note |
|---|---|---|---|---|
| `section_view` | a section's `h2` crosses 50% of the viewport | `section_id`, `viewport_class` (desktop/mobile), `reduced_motion` | scroll completion, where readers stop | no identifiers; would need a consent-free, cookie-less counter |
| `path_active` | `paths-pin` crossfade changes the active path | `path_index` (1–6), `dwell_ms` | which path holds attention | as above |
| `quest_toggle` | a quest button toggles | `quest_index`, `lit` (bool), `total_xp` | whether the illustrative board is used at all | state is `localStorage` only; never sent anywhere today |
| `oath_reached` | `#oath` 50% in view | `time_from_load_ms` | the primary action | as above |

## Readout

- Comparison method: none possible (no baseline); descriptive counts per section after 30 days.
- Segment(s): desktop vs mobile; reduced-motion vs not.
- Minimum observation window: 30 days or 50 sessions, whichever is later.
- Decision rule: if fewer than half of sessions reach `#oath`, shorten the pinned path
  section (600vh → 450vh) before changing anything else; if the board is never touched,
  leave it, it is illustrative by design.
- Owner: the inhabitant.
