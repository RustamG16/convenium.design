# Chat-First Usability Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Convenium.Design Studio's legacy destination-first shell with the approved chat-first workspace while preserving APIs, IDs, data, and deterministic behavior.

**Architecture:** Extend the existing Node ESM workspace service and canonical state without introducing React or a second state source. Replace route ownership and shell composition in the vanilla browser app, then layer chat cards, a single composer, project preview, and a manifest-backed Constructor over the existing workflow APIs.

**Tech Stack:** Node 20+ ESM, dependency-free browser renderer, existing Lucide bundle, locally served Barlow, existing test/browser harnesses, Drawflow only for the controlled Constructor canvas if the current dependency policy permits it.

**Spec:** `docs/superpowers/specs/2026-09-16-chat-first-usability-design.md`

## Global Constraints

- No live AI execution, provider calls, deployment, publishing, external generation, or commits.
- Preserve existing APIs, IDs, business logic, records, media, Savra_v2, and unrelated uncommitted work.
- Folders are sidebar organization only and one level deep.
- Constructor renders canonical workflow state; it cannot approve gates or become an execution-state source.
- All destructive item actions expose undo; server actions are visibly disabled offline and recover on reconnect.
- Use Barlow for UI, Lucide for icons, CSS Grid for workspace layout, and no technical background grid.

### Task 1: Ground the route and control contracts

**Files:** `public/modules/router.js`, `scripts/router.test.mjs`, `.olympus/chat-first-route-control-contract.md`, `.olympus/chat-first-verification-matrix.md`

- [ ] Write failing route tests for every canonical route, legacy redirects, invalid IDs, and project/chat ownership.
- [ ] Run the focused router test and confirm failure is caused by missing chat-first route resolution.
- [ ] Implement canonical route parsing and legacy redirect metadata while retaining compatibility fields consumed by existing views.
- [ ] Run router tests and syntax checks.

### Task 2: Add standalone chats and folders safely

**Files:** `workspace.mjs`, `server.mjs`, `scripts/workspace.test.mjs`, new migration tests

- [ ] Write failing tests for nullable project chats, create/update/move/archive/restore, folder membership, and backup-on-migration.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Extend the workspace schema and public response; serialize writes, preserve IDs, and fail visibly on unreadable files.
- [ ] Run unit/API tests, including legacy response compatibility.

### Task 3: Implement the shared chat-first shell

**Files:** `public/index.html`, `public/app.js`, `public/shell.css`, `public/modules/shell.js`, new shell contract tests

- [ ] Write failing control-contract tests for sidebar groups, item menus, drawer behavior, single composer, and preview ownership.
- [ ] Verify RED with the browser harness.
- [ ] Implement the 256px sidebar, project/chat/folder tree, utility links, mobile drawer, and one composer with accessible labels/focus return.
- [ ] Run focused browser checks at 390/820/1280/1440/1920.

### Task 4: Move workflow stages into chat

**Files:** `public/modules/journey.js`, `public/modules/workspace.js`, `public/modules/workflow-receipt.js`, app wiring, journey tests

- [ ] Write failing tests for clarification, brief, approach, progress, result, approval semantics, draft preservation, and async ownership.
- [ ] Verify RED.
- [ ] Implement compact conversation cards and plain-language actions backed by existing hash-bound/canonical operations; keep raw details disclosed.
- [ ] Verify keyboard journey, delayed responses, offline recovery, and no stale cross-chat rendering.

### Task 5: Add the guided Constructor

**Files:** `public/modules/workflow-view.js`, `public/modules/role-configuration.js`, Constructor styles/tests, package manifest only if Drawflow is approved by existing policy

- [ ] Write failing tests for five stages, synchronized list/canvas, inspector ownership, draft Apply impact, invalidated approvals, and Advanced compare.
- [ ] Verify RED.
- [ ] Render Understand/Plan/Create/Review/Deliver from the existing manifest; lock sequencing and author/critic separation; keep optional roles and knowledge selection.
- [ ] Verify keyboard list synchronization, narrow layout, reduced motion, and canonical state ownership.

### Task 6: Simplify Knowledge, Agents, and Settings

**Files:** `public/modules/project-evidence.js`, `public/modules/role-configuration.js`, shell/app modules, supporting tests

- [ ] Write failing tests for searchable sources, ownership/availability, project associations, six role entries, and accurate unavailable settings.
- [ ] Verify RED.
- [ ] Implement one-role-at-a-time inspection, readable-vs-filename metadata, and secondary advanced controls while retaining historical Savra in its labelled collection.
- [ ] Run supporting-screen checks and accessibility checks.

### Task 7: Full verification and handoff evidence

**Files:** `.olympus/chat-first-progress.md`, `PROGRESS-AND-DECISIONS.md`, `.olympus/run.json`, `.olympus/07-qa.md`, `.olympus/10-finish-review.md`, `.olympus/08-metrics.md`, `.olympus/09-handoff.md`

- [ ] Run context validation and `npm.cmd run check`.
- [ ] Run author visual QA across routes, widths, interactions, reduced motion/transparency, keyboard, reload/history, and console/runtime health.
- [ ] Run the independent read-only finish review once, repair only within the two-cycle bound, then record remaining limitations honestly.
