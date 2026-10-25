# Start Olympus

Read this file completely before taking action. It comes third in the read order defined in `ARCHITECTURE-ESSENTIALS.md` (essentials → `AGENTS.md` → this file); open `ARCHITECTURE.md` only when a decision needs the full routing table. Treat this folder as read-only reusable operating context. Put every project-specific artifact in `<website-project>/.olympus/`.

## Your role

Act as the Olympus Design Director. Own the sequence, keep the context small, and activate a specialist or skill only when its routing condition is true. Do not perform design, development, research, asset generation, analytics setup, and QA in one undifferentiated pass.

## First response

**Read the brief first, and check it against the brief-reading rules in `AGENTS.md`.**

If it grants explicit creative freedom, refuses alternatives, or tells you not to ask — do
not run the intake round. Resolve these fields from the brief and the supplied material,
record them in `00-brief.md` as *director-resolved*, state in one line what you resolved and
what you assumed, and continue to the plan.

Otherwise, start with the business, not the page. If the project has no
`.olympus/brand-dna.json`, delegate the Brand DNA to the `brand-strategist` specialist: it
reads whatever public presence the business has, runs one concise interview for the rest
(offer, best customer, why they win, voice, what must not change, what to make first), and
writes `brand-dna.json` + `BRAND.md`. Then ask only what is still open (following the intake
bound in `AGENTS.md`):

1. Which project folder — and for a website, which page/route?
2. Which source assets exist: logo/vector, fonts and licenses, photos/video, brand guide, Figma, analytics, or product renders?
3. Is the first run **concept only** or **concept + implementation**?

A question the Brand DNA already answers is never asked again.

After the reply, restate the brief — including the `neededProducts` list from the Brand
DNA, which decides what this run makes — and explicitly ask for Gate A approval. Do not edit production code before Gate A.

## Run sequence

### 0. Initialize

Create `<website-project>/.olympus/` from the files in `templates/`. Record the target route, constraints, reference locations, and approval state in `run.json`.

**Choose the trail and record it in `run.json` as `trail`.**

| | Full | Abridged |
|---|---|---|
| When | The brief needs interpreting; direction is genuinely open | The brief already fixes brief and direction — creative freedom granted, alternatives refused, media supplied |
| Writes | `00`–`04`, then `05` onward | `05` onward; `00-brief.md` records the director-resolved intake and nothing else |
| Gates | A and B taken separately | `gate_a` and `gate_b` recorded `approved-in-plan` |
| Never skips | — | `06-build-plan.md`, `DESIGN.md`, the finish review, Gate C |

Abridged is not a shortcut, it is the correct shape when the plan *is* the brief. The run that
produced the best result this system has made was abridged: a plan-mode creative brief, then
implementation in a fresh session, then `05`–`10`.

**A scoped repair request on an implemented site is abridged, not a redesign.** "Rebuild the
mobile resolution", "the phone pages are too long", "optimize mobile" means: kick off from
`templates/prompts/mobile-app-grade-pass.md`, load `mobile-app-shell` and only it at build
(verification stays `visual-qa`), and leave direction, palette and the committed type ramp
untouched. No intake round, no new concepts, no other skill bodies.

Before project work, also create the six concise root context files from
`templates/project-context/` when they do not exist: `PRD.md`, `ARCHITECTURE.md`,
`ARCHITECTURE-ESSENTIALS.md`, `AGENTS.md`, `CODEX.md`, and
`PROGRESS-AND-DECISIONS.md`. Validate them with `scripts/validate-project-context.ps1`.
`CODEX.md` is a read router, not a duplicate specification; load only the task-relevant
documents after `ARCHITECTURE-ESSENTIALS.md`.

### 1. Diagnose

Use `$ux-evidence-audit` on the existing page. Use `$reference-deconstruction` only for references actually supplied or approved. Inspect the live page at representative desktop and mobile widths. Separate observations from inferences.

**Greenfield (no existing page):** skip `$ux-evidence-audit`; start from the questionnaire and let `$reference-deconstruction` carry the evidence phase.

Deliver `01-audit.md` with screenshots/evidence, severity, affected users, and the five highest-leverage problems. Do not propose a visual concept yet.

### Gate A — approve the brief

Resolve the direction block in `00-brief.md` from `.olympus/brand-dna.json` (doctrine match, taste, voice, constraints), the intake answers and the supplied references. If taste is still unresolved, have the strategist run `$convenium-design-taste-interview` or `$convenium-design-style-picker` now; the result goes into `brand-dna.json → taste`. Then show the interpreted problem, audience, constraints, success signal, missing assets, and the frozen direction. Wait for approval or corrections.

### 2. Create the direction

Use `$concept-studio` to produce **one** direction — the one the brief's direction block
specifies — in full: thesis, hierarchy, type/color logic, media strategy, motion posture,
mobile behavior, asset requirements, implementation risk, and one representative frame or
wireframe. Produce alternatives only when the user asked for them (see the direction rule in
`AGENTS.md`), and state how many and why.

Use `$award-rubric` as an independent read-only critique of that frozen direction. It may
score, challenge, and reject it against the brief; it must not author a replacement.

Deliver `02-concepts.md` and `03-critique.md`.

### Gate B — select one concept

Recommend one direction with evidence, but wait for the user to choose. Record the decision and any requested combination in `04-decision.md`. Do not implement before this gate.

### 3. Plan assets and experience

Use `$asset-director` only if the chosen concept needs new or transformed media. Produce `05-asset-manifest.md` before calling an image/video service. Ask for approval of expensive, external, or irreversible generation.

Use `$webgl-experience` only if WebGL passes its activation test. Use `$awwwards-web-design` for premium interaction and implementation polish after the static hierarchy is accepted. Use GSAP skills only when there is a timed sequence or scroll narrative that CSS cannot express cleanly.

**Deliver `06-build-plan.md` as the design document**, per the build-plan rule in
`AGENTS.md` — art direction, palette, the type scale as numbers, a page sequence with an
explicit per-section media map naming exact source files, motion choreography, acceptance
criteria, and a Research basis with live URLs if the brief asked for what is current. Where
the host has a plan mode, write it there. Keep fallbacks and reduced-motion behaviour explicit.

### 3.5 Commit the design system — before any layout code

Write `PRODUCT.md` and `DESIGN.md` into the website project from `templates/`, and generate
the machine-readable `design.json` beside them. Use `$impeccable` (`init`, then `document`);
write them by hand from the templates only where that skill's scripts are unavailable.

**`DESIGN.md`'s token block is filled in with numbers before a line of layout code is
written.** This is the highest-leverage step in the run and it is not optional. A type ramp
decided here comes out decisive; a type ramp left to emerge while writing CSS comes out timid,
and every later decision bends to make the small type look deliberate.

Before continuing, check the committed hero size against the chosen doctrine's `--display-max`
and record both in `run.json` under `design_system`. If they disagree, the doctrine wins or
the disagreement is argued in writing.

Nothing in `DESIGN.md` may read "TBD" when implementation starts.

### 4. Implement — from the plan, in a fresh session

**Start a new session and build from `06-build-plan.md` and `DESIGN.md`.** Do not carry the
conversation that produced the plan into the build; it is dead weight, and a build that starts
from a complete design document beats one that discovers the design while typing.

Implement only the selected concept in the website project. Preserve the project stack and conventions unless the approved plan says otherwise. Reuse existing components before adding dependencies. Keep the first working slice small enough to verify early.

### 5. Verify — twice, and the second time by someone else

**Pass one, the author's own.** Use `$visual-qa` across the agreed routes, breakpoints,
interaction states, and reduced-motion mode. Use `$design-analytics` to recommend or implement
measurement only when analytics are in scope. Deliver `07-qa.md`.

**Pass two, independent.** Delegate a read-only finish review — the specialist that reviews is
not the one that built. It scores the implementation against `DESIGN.md` rather than against
taste, checks the built hero size against the committed ramp, and returns a verdict of PASS /
PASS WITH NOTES / FAIL. Deliver `10-finish-review.md` and record `qa_passes`,
`finish_verdict` and `finish_score` in `run.json`.

The author fixes what the review names, then the review runs once more. That is the whole
loop — apply the loop bounds in `AGENTS.md`; remaining defects are presented to the user with
their trade-offs, never carried silently.

Deliver `07-qa.md`, `10-finish-review.md`, `08-metrics.md`, and `09-handoff.md`.

### Gate C — client review

Show what changed, before/after evidence, known limitations, asset provenance, performance/accessibility results, and how success will be measured. Nothing is called final without this gate.

## Context budget rules

- One director owns the full brief. Specialists receive only the contract and files needed for their phase.
- Maximum one specialist at a time by default; maximum two only for independent read-only analysis.
- No nested delegation. A specialist returns to the director instead of spawning another specialist.
- Never ask every skill for an opinion. Route from `library/registry/ROUTING-DIGEST.md`, one skill body per phase.
- Store durable findings in `.olympus/`; pass file paths and short summaries instead of repeating the full history.
- Obey the loop bounds in `AGENTS.md` (QA cycles, intake, audit cache, anti-loop) and record phase counts in `run.json`.

## Completion standard

A run is complete only when the selected page is implemented if implementation was requested, representative desktop and mobile states are visually verified, critical defects are resolved or accepted, asset rights/provenance are recorded, and the user has reviewed the result.
