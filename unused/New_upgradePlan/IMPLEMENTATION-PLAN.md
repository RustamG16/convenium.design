# Convenium.Design Oracle-First Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Convenium.Design Studio into a coherent local prototype of the Oracle-first adjustable design agency defined in `PRODUCT-ARCHITECTURE.md`.

**Architecture:** Preserve the existing vanilla Node/HTML/CSS/JavaScript application and its canonical library/project files. Add a versioned product state contract, focused service modules, and task-oriented views. The UI projects canonical state; all mutations pass through a single state writer and proposal/approval boundary.

**Tech Stack:** Node.js 20+, vanilla ES modules, semantic HTML, CSS, SVG connectors, existing Lucide and GSAP bundles, JSON/JSONL persistence, current CDP/browser harness.

**Spec:** `New_upgradePlan/PRODUCT-ARCHITECTURE.md`

**UI contract:** `New_upgradePlan/CONTINUOUS-UI-CONTRACT.md`

## Global constraints

- Do not modify reusable Convenium.Design agents, skills, registry, templates, or doctrines to make the prototype pass.
- Preserve unrelated dirty files and current app behavior until its replacement is verified.
- No React migration, CrewAI, WebGL, cloud runtime, billing, marketplace, or new external dependency.
- Oracle is the default entry; advanced skill and node controls remain progressive disclosure.
- Every mutation is proposed, validated, persisted through one writer, and recoverable where practical.
- Unknown, demo, draft, stale, failed, blocked, approved, and live are distinct states.
- Use real registry/project artifacts where available and explicitly labeled deterministic fixtures elsewhere.
- Keep the contextual Oracle composer present on every primary view.
- Treat `New_upgradePlan/media/apollo-continuous-journey-v2/` as the canonical visual sequence. Earlier generated examples are superseded where they conflict.
- Use one fixed 210px desktop rail, one navigation order, one route/status strip, one semantic color system, and one Oracle dock across all screens.
- Respect the Olympus gates and QA loop bounds.

## File responsibility map

Before implementation, the executing session must inspect the current source and lock exact paths in `.olympus/06-build-plan.md`. The intended boundaries are:

- `public/index.html`: semantic application shell and view roots only.
- `public/app.js`: bootstrap and compatibility wiring; move new behavior into focused modules rather than growing this file further.
- `public/modules/router.js`: navigation, view lifecycle, focus restoration.
- `public/modules/store.js`: client state and derived selectors.
- `public/modules/oracle.js`: contextual composer, intake, choice cards, proposals.
- `public/modules/projects.js`: project workspace and context-file projections.
- `public/modules/plan.js`: master-plan presentation and configuration drafts.
- `public/modules/playground.js`: Setup A/B test and comparison state.
- `public/modules/results.js`: artifacts, versions, QA, review and provenance.
- `public/modules/knowledge.js`: search, collections, connections/list mode.
- `public/modules/system-graph.js`: run trace, accessible graph/list synchronization.
- `public/modules/notifications.js`: reminders and actionable notifications.
- `public/styles.css`: tokens and legacy compatibility only; add view styles as focused imported stylesheets if supported by the current build.
- `state.mjs`: single validated state writer and append-only events.
- `oracle.mjs`: deterministic intake/plan proposal service and optional live adapter.
- `projects.mjs`: explicitly registered project roots and artifact projection.
- `scripts/ui-*.mjs`: behavior, metrics and screenshot coverage.

## Delivery slices

### Task 1: Freeze the build contract

- [ ] Inspect current source, APIs, dirty files, tests, and `.olympus` cache.
- [ ] Write `convenium-design-studio/.olympus/00-brief.md` as director-resolved from the approved discussion.
- [ ] Write the creative `06-build-plan.md`: hierarchy, exact tokens, screen grammar, media/data map, motion choreography, mobile transformations, states and acceptance criteria.
- [ ] Reconcile `PRODUCT.md`, `DESIGN.md`, and `design.json` before layout code; remove every placeholder.
- [ ] Update `run.json` with abridged trail, approved-in-plan Gates A/B, design-system values, phase counts and prototype scope.
- [ ] Run the six-file context validator and record the result.

### Task 2: Add the canonical prototype state contract

- [ ] Write failing tests for schema version, state transitions, approval hashes, unknown status, append-only events and idempotent attempts.
- [ ] Implement one state writer and migration from current demo shapes.
- [ ] Add fixtures for project, intake, plan, setup comparison, run, artifact, review, notification and capability status.
- [ ] Prove that changing an approved artifact invalidates the appropriate downstream approval.
- [ ] Prove that replaying an attempt does not duplicate events or outputs.

### Task 3: Build the new shell and navigation

- [ ] Write failing behavior tests for Home, Projects, Plan, Playground, Results, Knowledge, System, Agents and Settings routes.
- [ ] Implement the common shell, active-project header, actionable status area and responsive navigation.
- [ ] Implement the exact global route order and ownership from `CONTINUOUS-UI-CONTRACT.md`; nested project views must not appear as competing global products.
- [ ] Add the persistent route trail `Projects / {project} / {view}` and expose the current stage and next mandatory action.
- [ ] Add page ownership, deep links, keyboard shortcuts, visible focus and focus restoration.
- [ ] Preserve legacy routes or provide tested redirects.
- [ ] Add empty, loading, offline and unavailable shell states.

### Task 4: Build persistent contextual Oracle

- [ ] Write tests for context tokens, removal, page/selection changes, voice/text mode, choice cards, proposals and cancellation.
- [ ] Implement the bottom-center composer shared by every primary view.
- [ ] Implement deterministic project classification and the first project questionnaire.
- [ ] Ensure Oracle asks one question at a time, never repeats answered fields, and explains the purpose of consequential questions.
- [ ] Generate a reviewable brief and Design DNA snapshot without starting implementation.
- [ ] Route consequential actions through the existing proposal dialog/state writer.

### Task 5: Build Projects and the master Plan

- [ ] Write tests for project creation, Overview, Brief, References, Plan, Work, Outputs and Activity.
- [ ] Project the six root context files and Olympus artifacts without inventing state.
- [ ] Render the master plan in plain language before advanced configuration.
- [ ] Expose agent tasks, skills, tools, dependencies, gates, budgets and fallbacks with activation reasons.
- [ ] Implement configuration drafts, validation, reset and approval bound to the plan hash.

### Task 6: Build Playground

- [ ] Write tests proving Setup A/B changes cannot mutate the approved production plan.
- [ ] Implement goal, setup, impact preview, bounded test result and comparison regions.
- [ ] Show which agents/skills/tools change, why, estimated effects when known, and unknown when not measured.
- [ ] Implement run test, compare, reset draft and apply-to-plan proposal.
- [ ] Add failure, cancellation, timeout and incompatible-capability states.

### Task 7: Build Results and evidence

- [ ] Write tests for artifact version, source lineage, QA, independent review, limitations, approval and export status.
- [ ] Implement output preview, before/after, changes, producing roles, inputs and evidence.
- [ ] Separate execution completion, technical verification and client acceptance.
- [ ] Add desktop/mobile evidence and missing-media fallback.

### Task 8: Build Knowledge and Agents

- [ ] Write tests for bounded search, corpus/host/status filters, stale index, unavailable source and unsafe paths.
- [ ] Implement understandable collections as the Knowledge default.
- [ ] Add optional Connections mode with synchronized accessible list.
- [ ] Implement agent profiles with identity, responsibility, activation, tasks, skills, tools, evidence and limitations.
- [ ] Allow contextual specialist conversation while retaining Oracle/director authority.

### Task 9: Build System Node Control

- [ ] Write tests for graph/list parity, typed nodes/edges, evidence resolution, selection, filtering and draft-only changes.
- [ ] Implement run trace and architecture modes using semantic DOM plus SVG connectors.
- [ ] Add plain-language “What you are seeing,” breadcrumb, legend, inspector, fit, reset and focus-path controls.
- [ ] Animate only evidenced selection, activation and event flow; stop offscreen and under reduced motion.
- [ ] Route every proposed agent/skill/tool change to Playground.

### Task 10: Add Settings, reminders and notifications

- [ ] Write tests for environment, model, integration, permission and notification states.
- [ ] Implement local/demo/live environment disclosure and model choice at the final implementation gate.
- [ ] Implement local reminders and actionable notifications for input, approval, completion and failure.
- [ ] Keep unchanged monitoring quiet and represent unavailable integrations honestly.

### Task 11: Verify the complete prototype

- [ ] Run syntax, behavior, metrics and screenshot suites.
- [ ] Verify representative fixtures at 390×844, 820px, 1280px, 1440×900 and 1920px.
- [ ] Verify keyboard-only use, focus restoration, 200% text, reduced motion, touch equivalents, context accuracy, graph/list parity and no horizontal overflow.
- [ ] Verify empty, loading, stale, failed, offline, blocked, draft, demo, unknown, approval and completion states.
- [ ] Capture every canonical route in one contact sheet and reject the build if the rail, route order, semantic colors, typography, or Oracle geometry changes between screens.
- [ ] Walk the full primary trip from Home through Gate C without direct URL entry and record every transition, back path, approval boundary, and recoverable cancellation.
- [ ] Record the author's evidence in `.olympus/07-qa.md`.
- [ ] Commission a separate read-only critic to score against `DESIGN.md`; write `.olympus/10-finish-review.md`.
- [ ] Apply no more than two author-fix/critic-review cycles, then present residual tradeoffs.
- [ ] Stop at Gate C with screenshots, checks, provenance, limitations and next-stage recommendation.

## Prototype exit criteria

The prototype is complete when a user can move from Oracle intake through a reviewable project brief, master plan, configuration test, approved implementation simulation, results evidence and system explanation without prompt expertise; all mutations and states are honest; and the independent finish review passes or leaves explicitly accepted notes.
