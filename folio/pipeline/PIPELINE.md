# Pipeline — from pasted text to published site

Implemented as one Inngest function (`workers/build`) with idempotent steps keyed by
`buildId`. Every step writes to `builds.log` and the final `run.json`.

| # | Step | Input | Output | Fails when | On failure |
|---|---|---|---|---|---|
| 1 | validate | pasted text or file | `profile` (schema-valid), `errors[]` | JSON missing, schema errors, fewer than one proof array populated | Stop; show field-level errors with "ask your LLM to fix" copy |
| 2 | classify | profile | `role`, `confidence`, `secondaryRole`, `cardMode` | never (falls back to `role.primary`) | — |
| 3 | dna | profile, role, sliders | `dna` (schema), `contrast` | contrast cannot be fixed within 10 nudges | Stop; engineering bug, alert |
| 4 | compose | profile, role, dna, edits | `sectionPlan` with copy and source paths | required section has no data and card mode is impossible (no name) | Stop with message |
| 5 | media | sectionPlan, user media, plan tier | resolved media slots | provider error | Fall back to typographic slot; continue |
| 6 | render | sectionPlan, dna, media, templates version | static bundle in R2 | Astro build error | Stop; engineering bug, alert |
| 7 | qa | bundle | `qaReport` | any gate fails | Mark `qa_failed`; site keeps previous build; report visible to user |
| 8 | preview | bundle | preview URL | hosting error | Retry 3×, then alert |

Publish is separate: `site/publish.requested` sets `sites.currentBuildId` and purges cache.

## The QA gate (step 7), all required

- Renders at 390 × 844 and 1440 × 900; full scroll; no horizontal overflow at either width.
- Zero console errors; zero failed requests to first-party assets.
- Every text/background pair found in the DOM measures ≥ 4.5:1 (≥ 3:1 for ≥ 24px text).
- `prefers-reduced-motion: reduce` render has every section visible without scrolling
  interaction (no element stuck at opacity 0).
- Lighthouse mobile: performance ≥ 90, accessibility ≥ 95, best practices ≥ 90, SEO ≥ 90.
- Landmarks: one `main`, one `h1`, heading order without skips, skip link present.
- OG image present and 1200 × 630; title and description set; canonical set.
- All internal anchors resolve; all external links have `rel="noopener"`.
- Bundle size: HTML < 150 KB, total JS < 120 KB gzipped, fonts subsetted.

## Copy step rules (inside compose)

- One structured LLM call per build with the profile fields as data. Output: headline (if the
  user's headline is missing or > 90 chars), ≤ 2-sentence intros per section, alt text for
  described media, a 155-char meta description. Each output item carries `source` paths.
- Validation: lengths, no new proper nouns that do not appear in the profile (checked by
  simple token diff), language matches `meta.language`.
- Cache by hash(profile fields + prompt version). Re-import with unchanged fields costs zero
  tokens.

## Evidence trail

`run.json` per build mirrors Convenium.Design's: steps with timings, model and token usage,
DNA notes, QA report, templates version, bundle key. Kept with the build row forever.
