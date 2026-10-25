# Savra v2 Workflow Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Convenium.Design Studio expose and execute a source-backed Savra v2 system whose six-role workflow, skill routing, gates, artifacts, and review loop reproduce the documented process that produced Savra v2.

**Architecture:** Add an immutable workflow manifest derived from the restored Savra v2 repository and the current Olympus routing contract. The runtime planner consumes role IDs and phase routes from that manifest instead of the current five mythological agents. The UI projects the same manifest and the real Savra artifacts, clearly distinguishing verified repository evidence from reconstructed runtime choices that the historical repository did not record.

**Tech Stack:** Node 20+ ESM, dependency-free browser JavaScript, existing local JSON APIs, current canonical state writer, CDP browser harness, existing T1–T11 and B1–B8 instruments.

**Spec:** `.olympus/01-audit.md`, `D:/Analyst_Designer/Convenium.Design/test_projects/Savra_v2/.olympus/06-build-plan.md`, `D:/Analyst_Designer/Convenium.Design/test_projects/Savra_v2/DESIGN.md`, `D:/Analyst_Designer/Convenium.Design/test_projects/Savra_v2/.olympus/07-qa.md`, and `D:/Analyst_Designer/Convenium.Design/New_upgradePlan/PRODUCT-ARCHITECTURE.md`

## Global Constraints

- Planning is complete before production changes begin; execute this file in a fresh chat.
- Preserve the six roles: Design Director, Visual Analyst, Asset Producer, Design Engineer, Independent Critic, Analytics Specialist.
- The director owns interpretation, routing, gates, and integration; specialists cannot delegate.
- Author and critic run sequentially; the critic never edits implementation.
- One direction by default; design tokens are committed before layout; implementation starts from the build plan.
- QA is exactly two layers: author QA, then independent scored review; repair loops stop after two cycles.
- Do not claim the original Savra session's exact model, hidden prompt, load order, or runtime settings; the repository does not record them.
- Label every workflow field as `verified`, `reconstructed`, or `unknown` with a source path.
- Do not apply Savra's palette or monumental typography to Convenium.Design's global shell. Show Savra typography and media inside the Savra system/project evidence surfaces.
- Do not modify reusable Convenium.Design skills, templates, doctrine sources, the Savra repository, or protected user data.
- No React migration, CrewAI, WebGL, cloud billing, marketplace, external generation, deployment, commit, or push.

---

### Task 1: Freeze the Savra workflow receipt

**Files:**
- Create: `data/workflows/savra-v2.json`
- Create: `scripts/savra-workflow.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `SavraWorkflowManifest` with `id`, `version`, `sources`, `roles`, `phases`, `gates`, `artifacts`, `evidenceStatus`, and `limitations`.
- Consumes: restored Savra v2 files and the Olympus role contract; performs no application mutation.

- [ ] **Step 1: Write a failing manifest-contract test**

  Assert the manifest has exactly six stable role IDs, every role has a source-backed responsibility and allowed skills, every phase names its owner and input/output artifacts, the independent critic is read-only, and every fact has `verified`, `reconstructed`, or `unknown` provenance.

- [ ] **Step 2: Run the focused test and verify RED**

  Run `node --test scripts/savra-workflow.test.mjs`. Expected failure: the manifest does not exist.

- [ ] **Step 3: Add the immutable manifest**

  Use these role IDs and responsibilities:

  - `design-director`: `olympus-design-director`; intake resolution, one direction, routing, Gates A/B/C, integration.
  - `visual-analyst`: `reference-deconstruction` for supplied Savra media; `ux-evidence-audit` only when an existing page exists; no authorship.
  - `asset-producer`: `asset-director`; execute only the approved asset manifest; no direction changes.
  - `design-engineer`: `impeccable`, `awwwards-web-design`, `gsap-core`, `gsap-react`, `gsap-scrolltrigger`, `gsap-performance`; implement the approved build plan only.
  - `independent-critic`: `award-rubric` for direction and `visual-qa` for the finish review; read-only and never the builder.
  - `analytics-specialist`: `design-analytics`; dormant unless a measurable goal and analytics scope exist.

  Encode the Savra sequence: resolved intake → supplied-media reference deconstruction → one direction → independent direction critique → asset manifest → numeric design system → fresh-session build → author QA → independent finish review → bounded repair → Gate C.

- [ ] **Step 4: Verify GREEN and wire the focused test into `check:shell`**

  Run `node --test scripts/savra-workflow.test.mjs`. Expected: all manifest invariants pass.

- [ ] **Step 5: Record the receipt limitation**

  State explicitly in the manifest that the final repository verifies artifacts and results, but not the original session's exact model, hidden prompts, chronological skill load order, or host settings.

### Task 2: Replace the five-agent runtime model with six workflow roles

**Files:**
- Modify: `agents.mjs`
- Modify: `systems.mjs`
- Modify: `data/systems.json`
- Create: `scripts/savra-routing.test.mjs`

**Interfaces:**
- Consumes: `SavraWorkflowManifest` from Task 1.
- Produces: `buildPlan(prompt, budget, { systemId: 'savra-v2-system' })` returning ordered, non-nested role steps with phase reasons, source-backed skills, approvals, and artifact dependencies.

- [ ] **Step 1: Write failing routing tests**

  Cover all six roles, correct phase ownership, no mythological aliases, asset producer activation only when media work exists, analytics remaining dormant without scope, critic following rather than overlapping the engineer, and Gate B blocking implementation.

- [ ] **Step 2: Verify RED**

  Run `node --test scripts/savra-routing.test.mjs`. Expected: current five-agent Olympus fixture fails role count, names, and sequence.

- [ ] **Step 3: Implement manifest-driven routing**

  Replace hard-coded `Convenium.Design`, `Athena`, `Calliope`, `Hephaestus`, and `Hermes` production definitions with the six explicit role names. Keep compatibility aliases only in migration code; never display them as current Savra roles.

- [ ] **Step 4: Enforce sequencing and gates**

  Ensure the planner cannot schedule the critic as builder, cannot start implementation before a current plan/design approval, cannot let specialists delegate, and cannot run more than two independent read-only workers.

- [ ] **Step 5: Verify GREEN**

  Run `node --test scripts/savra-workflow.test.mjs scripts/savra-routing.test.mjs scripts/state.test.mjs`. Expected: the new routing contract and the existing hash-bound state contract both pass.

### Task 3: Bind the Savra system to real project artifacts

**Files:**
- Create: `public/modules/workflow-receipt.js`
- Modify: `systems.mjs`
- Modify: `server.mjs`
- Create: `scripts/savra-artifacts.test.mjs`

**Interfaces:**
- Produces: `GET /api/systems/savra-v2-system/receipt` with safe relative artifact metadata, hashes, availability, provenance, and limitations.
- Consumes: files under `test_projects/Savra_v2`; never writes there.

- [ ] **Step 1: Write failing artifact-boundary tests**

  Assert that the endpoint reads `PRODUCT.md`, `DESIGN.md`, the asset manifest, build plan, run record, and QA record; rejects traversal; reports missing files honestly; and never substitutes the obsolete `Savra_Restraunt` preview path.

- [ ] **Step 2: Verify RED**

  Run `node --test scripts/savra-artifacts.test.mjs`. Expected: receipt endpoint is absent.

- [ ] **Step 3: Implement read-only artifact receipts**

  Resolve the project root once, allowlist exact artifact paths, compute hashes without copying content into mutable system state, and return `available: false` plus a reason for missing evidence.

- [ ] **Step 4: Verify GREEN**

  Run the focused artifact tests and request the endpoint against a scratch server. Expected: HTTP 200 with verified paths and no missing legacy preview error.

### Task 4: Freeze reference fidelity and simplify the product surface

**Files:**
- Create: `.olympus/savra-v2-reference-contract.md`
- Create: `scripts/ui-control-contract.test.mjs`
- Modify: `scripts/labels.json`

**Interfaces:**
- Consumes: all images in `New_upgradePlan/media`, with `apollo-continuous-journey-v2/00` through `10` and `ROUTING.md` as the canonical sequence.
- Produces: a screen-by-screen contract naming retained controls, removed controls, primary action, explanation copy, empty/loading/error behavior, and exact reference image.

- [ ] **Step 1: Deconstruct every supplied screenshot before UI work**

  Record the transferable layout logic from each numbered image: fixed rail, stage strip, single primary action, workflow rows, right inspector, persistent Oracle composer, optional dark node canvas, semantic state colors, and progressive disclosure. Map each reference to its route and reject any feature without a user job.

- [ ] **Step 2: Write failing control-truth tests**

  Assert every visible interactive control has a label-contract entry, an observable response, and nearby purpose/help text when its consequence is not obvious. Assert each primary screen has exactly one primary action and no duplicated advanced control outside Configure or System.

- [ ] **Step 3: Verify RED against the current UI**

  Run `node --test scripts/ui-control-contract.test.mjs` and the B1–B8 behavior sweep. Record the inert, duplicated, unexplained, and unnecessary controls without changing thresholds.

- [ ] **Step 4: Write the simplification contract**

  For Home, Intake, Brief, Plan, Configure, Playground, Work, Results, Knowledge, System, Agents, and Settings, specify: what the user is trying to do; what they must understand first; one primary action; maximum two secondary actions before disclosure; what moves under “Advanced”; and exact plain-language guidance. Do not add a control merely because it exists in a screenshot.

- [ ] **Step 5: Obtain human approval of the frozen contract before implementation**

  The fresh implementation chat must present the route/control matrix and node-view contract for approval. No production code begins until the user confirms that the plan matches the supplied examples.

### Task 5: Rebuild Projects, chats, and Work as one responsive task surface

**Files:**
- Modify: `public/modules/router.js`
- Modify: `public/modules/store.js`
- Create: `public/modules/workspace.js`
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/shell.css`
- Test: `scripts/workspace.test.mjs`
- Test: `scripts/ui-workspace.mjs`

**Interfaces:**
- Consumes: existing `/api/workspace`, project, chat, message, and attachment APIs without changing stored records.
- Produces: URL-addressable `#/projects/{projectId}/work/{chatId}` routes and one `WorkspaceModel` shared by project switcher, chat list, conversation, inspector, and Oracle context.

- [ ] **Step 1: Write failing pure route/projection tests**

  Cover project and chat IDs, unknown/malformed chat recovery, reload persistence, Back/Forward restoration, empty project, empty chat, and prevention of a chat from another project being displayed under the active project.

- [ ] **Step 2: Write failing browser layout tests**

  At 390, 820, 1280, 1440 and 1920 pixels assert: visible active project and chat; project switcher; chat list; one conversation; one Work composer; no overlap with Oracle or inspector; no horizontal overflow; drawer focus trap and restoration; composer remains reachable at 200% text.

- [ ] **Step 3: Verify RED against the current implementation**

  Expected failures: chat absent from URL, mobile project sidebar removed without replacement, and multiple independently positioned bottom/panel surfaces.

- [ ] **Step 4: Implement the single workspace model**

  Add `selectWorkspaceState(snapshot, route)` returning `{ project, projects, chat, chats, messages, attachments, status, recovery }`. Remove independent project/chat derivation from `renderWork`; all consumers use this projection.

- [ ] **Step 5: Implement the responsive hierarchy**

  Desktop: project switcher and selected project's chat list in one left column; conversation in the center; contextual inspector on demand. Narrow: a labelled “Projects and chats” drawer preserves both levels. Never concatenate chat names into a project's subtitle. Encode selection in the route.

- [ ] **Step 6: Eliminate overlap by assigning surface ownership**

  Work owns the message composer. The global Oracle launcher collapses to a non-overlapping trigger while Work input is focused; opening Oracle closes the project/chat drawer and inspector. Only one overlay surface may be modal/open on narrow screens. Remove obsolete fixed/sticky Work rules after browser parity passes.

- [ ] **Step 7: Verify GREEN**

  Run `node --test scripts/workspace.test.mjs`, `node scripts/ui-workspace.mjs`, the shell suite, and the B1–B8 sweep. Expected: route persistence, zero overlap, keyboard access, and every visible workspace control producing its written response.

### Task 6: Rebuild System and Agents views around workflow truth

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/shell.css`
- Create: `scripts/ui-savra-system.mjs`

**Interfaces:**
- Consumes: runtime plan and artifact receipt from Tasks 2–3.
- Produces: accessible workflow rows, role detail, skill/source/provenance panels, gate states, and Savra artifact previews.

- [ ] **Step 1: Write failing browser assertions**

  Assert exactly six workflow rows in phase order; visible full role names; visible skills and activation reasons; author/critic separation; verified/reconstructed/unknown badges; Savra design typography samples from `DESIGN.md`; and no global shell typography mutation.

- [ ] **Step 2: Verify RED**

  Run `node scripts/ui-savra-system.mjs`. Expected: current five mythological agents and generic system panel fail.

- [ ] **Step 3: Render the workflow as a sequence, not a decorative graph**

  Lead with the project goal, current gate, next mandatory action, and six ordered role rows. Each row expands to show responsibility, exact skills, activation condition, consumed artifacts, produced artifacts, approval requirement, and provenance.

  The Agents route uses the “Configure your agent team” table from reference `05-configure-workflow.png`: six role rows, enabled state, model/environment, budget, approval requirement, skills, and an inspector explaining the selected role. It must not invent character names or portraits.

- [ ] **Step 4: Render Savra's visual evidence honestly**

  Show Cormorant Garamond, Barlow Condensed, and IBM Plex Mono samples, the recorded palette, media map, design scale, and available evidence inside the Savra detail view. Keep the Oracle Continuum shell tokens unchanged.

- [ ] **Step 5: Verify responsive and keyboard behavior**

  Run the browser test at 390, 820, 1280, 1440, and 1920 pixels; verify disclosure keyboard operation, focus restoration, 200% text, no overflow, and a synchronized list for any graph.

- [ ] **Step 6: Implement the supplied node-control composition**

  Follow `10-system-node-control.png`: dark technical canvas inside the unchanged paper shell; ordered intake/evidence/direction/plan/design/build/QA/review nodes; colored edges tied only to real artifact dependencies; run controls and status legend; selected-node inspector on the right. Follow `09-knowledge-connections.png` for project/evidence relationships. The graph is inspectable and controllable, but never required for the ordinary workflow.

  Provide zoom, pan, fit, reset, keyboard traversal, selected-node focus, and an always-synchronized list/table fallback. At widths below 820px, open in List mode and expose “Show graph” as an optional advanced action.

### Task 7: Make Oracle and Playground use the same workflow contract

**Files:**
- Modify: `public/modules/oracle.js`
- Modify: `public/app.js`
- Modify: `server.mjs`
- Create: `scripts/savra-oracle.test.mjs`
- Create: `scripts/ui-savra-oracle.mjs`

**Interfaces:**
- Consumes: `SavraWorkflowManifest` and `buildPlan`.
- Produces: Oracle proposals and Playground comparisons whose displayed agents, skills, order, gates, and receipts match the System view exactly.

- [ ] **Step 1: Write failing consistency tests**

  Assert the same prompt produces the same six-role route in Oracle plan, System detail, and Playground; no surface maintains a second agent list.

- [ ] **Step 2: Verify RED**

  Run the focused pure and browser tests. Expected: current surfaces disagree.

- [ ] **Step 3: Route all three surfaces through one manifest projection**

  Delete duplicated display mappings. Preserve proposal mediation: Oracle may prepare changes but cannot alter the workflow, approve a gate, or execute without a reviewed, hash-bound proposal.

- [ ] **Step 4: Verify GREEN**

  Run pure tests, browser tests, cancellation, stale proposal, and reload persistence checks.

### Task 8: Continuous quality loop and handoff evidence

**Files:**
- Modify: `scripts/ui-metrics.mjs`
- Modify: `scripts/ui-behaviour.mjs`
- Modify: `PROGRESS-AND-DECISIONS.md`
- Create: `.superpowers/sdd/IMPLEMENTATION-PLAN/savra-v2-parity-report.md`

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: repeatable release evidence and an explicit PASS / PASS WITH NOTES / FAIL verdict; no subjective readiness claim.

- [ ] **Step 1: Add parity measurements before styling repair**

  Measure role count/order, cross-surface route equality, artifact availability, provenance labels, gate enforcement, typography sample families, reference-layout invariants, control explanation coverage, one-primary-action compliance, node/list synchronization, narrow layout, console health, reduced motion, and missing-media fallback.

- [ ] **Step 2: Run the full pre-repair suite and record every failure**

  Run `npm.cmd run check`. Preserve raw results; do not weaken a threshold to obtain green.

- [ ] **Step 3: Perform author QA**

  Verify all canonical routes, desktop/mobile, keyboard, focus, 200% text, reduced motion, runtime/console, API health, and T1–T11/B1–B8. Record evidence and remaining defects.

- [ ] **Step 4: Request an independent read-only finish review**

  The reviewer scores against this plan, the Savra workflow manifest, and `DESIGN.md`; it does not redesign or edit. Apply at most two author-fix/reviewer-review cycles.

- [ ] **Step 5: Produce the execution report**

  Report verified parity, reconstructed fields, unknown historical settings, test counts, before/after metrics, remaining notes, and the exact Gate C state. Do not use “ready” unless the independent verdict and all release checks support it.

## Self-review result

- Spec coverage: runtime roles, skill routing, artifacts, reference screenshots, usability simplification, node control, UI, Oracle, Playground, gates, QA, and continuous verification are each assigned to a testable task.
- Historical limitation: the plan reconstructs only what is supported by Savra v2 artifacts and current Olympus contracts; it does not invent the original session transcript.
- Scope separation: Task 1–3 establish runtime truth; Task 4 freezes reference and usability requirements; Task 5 repairs the project/chat foundation; Task 6–7 project workflow truth into the remaining UI; Task 8 controls finish quality.
- Placeholder scan: no `TBD`, deferred implementation instruction, or unspecified error-handling step remains.
