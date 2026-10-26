# Convenium.Design Studio Desktop Redesign — Master Implementation Plan

**Plan artifact:** `D:\Analyst_Designer\Convenium.Design\convenium-design-studio\.olympus\10-desktop-app-master-plan.md`

The implementation chat must save this approved plan at that location before changing product code. It must then execute the phases in order, preserving existing uncommitted work and honoring Gates B and C.

## 1. Product direction and approved decisions

### Product promise

Convenium.Design is a premium, local-first creative operating system where users manage AI-assisted projects, chats, agents, skills, systems, and reusable artifacts without losing manual control.

The operational experience is a calm Codex-style desktop workspace. The mythological/game layer adds identity and atmosphere but never replaces familiar project, chat, file, search, or settings patterns.

### Audience

- Primary: creators, consultants, founders, and small teams doing recurring AI-assisted project work.
- Immediate validation audience: the WKO start-up advisor.
- Secondary: advanced users designing reusable agent systems and workflows.

### Locked decisions

- Gate A is approved as of 2026-08-31.
- Target project: `D:\Analyst_Designer\Convenium.Design\convenium-design-studio`.
- Distribution: Windows-first Tauri desktop application, architected for later macOS support.
- AI: live OpenAI Responses API using a user-provided key, with an honest deterministic demo fallback.
- UI: React, TypeScript, React Aria Components, custom CSS design tokens.
- Local data: SQLite; files remain external references unless the user explicitly imports them.
- Visuals: React Three Fiber and Three.js only on selected character, system, and marketplace surfaces.
- Top navigation: Work, Systems, Library, Playground.
- Marketplace lives under Library rather than adding another permanent top-level item.
- Oracle remains globally available and cannot mutate data without explicit approval.
- Existing media may be reused only after provenance and usage rights are recorded.
- No Godot, Unity, payments, publishing backend, multiplayer, or full game engine.

## 2. Mandatory six-file project system

Before product implementation, create these six non-empty files in `convenium-design-studio` from the canonical templates in `D:\Analyst_Designer\Convenium.Design\templates\project-context`:

1. `PRD.md`
   - Product thesis, audiences, WKO outcome, observable success criteria.
   - Local/private data boundary.
   - Prototype scope and explicit exclusions.
   - Gate A approval and remaining Gate B/C requirements.

2. `ARCHITECTURE.md`
   - Tauri/React/TypeScript runtime.
   - frontend, shared-domain, Rust-command, database, media, and legacy boundaries;
   - SQLite schema and migration rules;
   - `AppBridge` interfaces;
   - AI, approval, filesystem, packaging, and verification architecture.

3. `ARCHITECTURE-ESSENTIALS.md`
   - Keep short and operational.
   - State protected data boundaries, dependency policy, approved stack, accessibility and performance gates, secrets policy, and exact commands.
   - Require reading before any change.

4. `AGENTS.md`
   - Project-specific contributor instructions subordinate to the Convenium.Design root instructions.
   - Require progressive disclosure and bounded ownership.
   - Protect existing business logic, media, local data, and unrelated uncommitted work.
   - Require Apple Design, UI/UX, and Emil Design reviews for frontend changes.
   - Prohibit silent Oracle mutations and invented evidence.

5. `CODEX.md`
   - Router only, maximum 120 lines.
   - Always route first to `ARCHITECTURE-ESSENTIALS.md`.
   - Route product questions to `PRD.md`, technical work to `ARCHITECTURE.md`, boundaries to `AGENTS.md`, and history to `PROGRESS-AND-DECISIONS.md`.
   - Include the verified build/test commands without duplicating specifications.

6. `PROGRESS-AND-DECISIONS.md`
   - Append-only dated log.
   - Record Gate A, Gate B, Gate C, migrations, selected concept, dependency additions, verification results, and corrected decisions.
   - Never rewrite historical entries; supersede them with later entries.

Run:

```powershell
D:\Analyst_Designer\Convenium.Design\scripts\validate-project-context.ps1 `
  -ProjectPath D:\Analyst_Designer\Convenium.Design\convenium-design-studio
```

No concepts or implementation may proceed until validation passes.

## 3. Current-state audit

### Existing capabilities to preserve

- Node-based local application and demo/live OpenAI modes.
- Systems CRUD and deterministic orchestration planning.
- Convenium.Design, Athena, Calliope, Hephaestus, and Hermes agent definitions.
- Filesystem-backed skills and reference knowledge.
- Oracle planning and chat behavior.
- Playground comparison logic.
- MCP integration, event records, approval concepts, and credential rejection.
- Existing `/api/*` behavior during migration.
- Existing responsive no-overflow behavior.
- Existing media under `public\media`.
- Honest distinction between demo and live behavior.

### Primary usability defects

- Architecture internals are presented as a primary product surface.
- Projects and chats are not the persistent navigational foundation.
- Oracle is an isolated page rather than continuous contextual assistance.
- Systems and Knowledge mix browsing, creation, editing, and execution.
- Playground exposes configuration before explaining the comparison workflow.
- Important surfaces use oversized headings and long forms instead of progressive disclosure.
- Game-like identity and supplied media are largely disconnected from operational tasks.
- Narrow layouts technically fit but retain desktop information density.

### Deferred capabilities

- Real marketplace publishing, payments, reviews, or social proof.
- Cloud synchronization, accounts, multiplayer, and remote collaboration.
- Background autonomous mutations.
- Full node-editor-first workflow design.
- Always-running 3D environments.
- Auto-update and production code signing.
- Cloud vector databases.
- Consumer account credential reuse.

## 4. Information architecture and interaction model

```text
Native Windows frame
└── Convenium.Design application shell
    ├── Left sidebar
    │   ├── Project search
    │   ├── Recent projects
    │   ├── Project groups
    │   └── Chats inside active project
    ├── Top navigation
    │   ├── Work
    │   ├── Systems
    │   ├── Library
    │   └── Playground
    ├── Compact project tab bar
    ├── Central workspace
    ├── Context inspector when required
    └── Persistent Oracle dock/drawer
```

### Global shell rules

- Project and active chat remain visible across product areas.
- Each project supports multiple tabs, restored locally after restart.
- Search is available through the sidebar and `Ctrl+K`.
- `Enter` sends a chat message; `Shift+Enter` inserts a line break; `Esc` stops generation or closes the top temporary surface.
- Secondary actions use contextual menus or inspectors.
- Narrow windows convert the project sidebar and Oracle dock into independent drawers.
- Minimum desktop window: 720×600. Also test a 390-pixel browser representation for future responsive compatibility.
- The default Work surface must not load WebGL.

### Page specifications

- **Work:** Goal is completing project work. Primary action is sending a project-aware message. Show chat, tabs, model, attachments, visible context, send/stop state, and recent artifacts. Hide advanced model and tool controls. Empty state offers create/open project and a sample task. Oracle explains context and can prepare actions. Narrow mode prioritizes chat and composer.
- **Systems:** Goal is finding or continuing a reusable workflow. Primary action is opening a system overview. Show purpose, participants, phases, compatibility, status, and next action. Editing and duplication live in menus or an inspector. Empty state explains systems and offers create or import. Search by name, use case, agent, skill, and status. Oracle may draft but not save without confirmation.
- **Library overview:** Goal is choosing the correct resource category. Primary action is entering Agents, Skills, Capabilities, Reference Knowledge, Catalogs, or Marketplace. Show counts, recent items, saved views, and import status. Creation is category-specific.
- **Agents:** Goal is finding or configuring a working agent. Primary action is opening an agent profile. Show character identity, role, status, capabilities, equipped skills, systems, and provenance. Advanced instructions, model overrides, and tools are collapsed. Empty state offers a guided first agent. Narrow mode uses list → detail navigation.
- **Agent editor:** Use a beginner path—identity, role, behavior, capabilities, skills, review—and an advanced tab for raw instructions and tool policy. Visual customization never alters operational configuration implicitly.
- **Skills:** Goal is finding and equipping a reusable capability. Primary action is opening an artifact detail. Show purpose, inputs, outputs, compatibility, version, source, dependencies, availability, and equipped agents/systems. Creation/import and raw instructions are progressive actions.
- **Capabilities/MCP:** Goal is understanding and managing connected tools. Primary action is connecting or inspecting one capability. Show trust boundary, available tools, permissions, status, and last verified time. Secrets are never displayed. Oracle can explain setup but cannot grant permission.
- **Reference Knowledge:** Goal is locating or attaching trusted context. Primary action is adding a source to the active project. Show source, scope, updated date, tags, and indexing state. Editing and re-indexing are secondary. Missing or inaccessible sources produce explicit recovery actions.
- **Playground:** Goal is comparing systems for one task. Primary action progresses through project → task → two or three systems → run → comparison → keep result. The first view contains a short “How it works” explanation. Advanced experiment settings stay collapsed.
- **Marketplace:** Goal is previewing and locally adding reusable agents, skills, or systems. Show provenance, version, compatibility, dependencies, preview, and “Add to library.” Use local manifests only; do not display invented downloads, ratings, reviews, or purchases.
- **Oracle:** Goal is contextual guidance and controlled assistance. Primary choices are “Show me how” and “Do it for me.” Show active context, proposal changes, permission requirements, confirmation, execution progress, and recovery. On narrow layouts it becomes a bottom or right drawer.
- **Settings:** Goal is controlling application behavior. Show appearance, AI provider, storage location, privacy, accessibility, demo mode, integrations, and diagnostics. Technical host/MCP details live under Advanced.

## 5. Design direction and mandatory skills

### Three concepts before Gate B

Produce exactly three frozen concept documents or high-fidelity frame sets:

1. **Convenium.Design Workbench — recommended:** calm Codex-style work surface with cinematic character and artifact details revealed contextually.
2. **Olympus Observatory:** spatial system overview with stronger world-building and contextual operational panels.
3. **Artifact Archive:** editorial library-led environment centered on collectible agents, skills, and systems.

Each concept must define desktop, narrow, empty, loading, error, Oracle, and reduced-motion states. Gate B requires the user to select one concept before product code is redesigned.

### Apple Design application

- Use familiar hierarchy, system typography, purposeful translucency, depth, and direct manipulation.
- Do not imitate macOS window chrome on Windows.
- Motion must be interruptible and preserve spatial continuity.
- Use opacity and transforms for transitions.
- Provide reduced-motion and reduced-transparency modes.
- Maintain user agency through visible cancel, undo, review, and manual paths.

### Emil Design application

- Animate only state change, orientation, selection, progress, or meaningful character presence.
- Keep ordinary interface transitions at or below roughly 300 ms.
- Avoid animation on frequent keyboard actions.
- Give buttons immediate pressed feedback.
- Origin-anchor menus, popovers, and drawers.
- Use exact transition properties rather than `transition: all`.
- Suspend decorative motion when hidden or inactive.

### UI/UX quality gate

- Use React Aria Components as unstyled accessible interaction primitives, keeping the visual language custom rather than adopting a generic component theme. [React Aria documentation](https://react-spectrum.adobe.com/react-aria/getting-started.html)
- One primary action per default surface.
- Separate browse, create, configure, and execute modes.
- Provide visible labels, focus states, error recovery, keyboard navigation, high contrast, and understandable empty states.
- Standard pointer targets are at least 36×36 pixels; touch/narrow targets are at least 44×44.
- Functional UI must remain readable without atmospheric media or 3D.

### Media policy

Before generation, create an asset manifest covering:

- existing god portraits;
- existing environmental stills and videos;
- product icon and wordmark;
- required agent states;
- system and skill thumbnails;
- static fallbacks for every 3D or video surface;
- source, rights, transformation, dimensions, weight, and usage.

Ask the user to confirm canonical portraits, WKO branding constraints, and rights to supplied media. Generate only approved missing assets.

## 6. Technical architecture

### Runtime

- Tauri 2 Windows desktop shell with native window decoration for the first prototype.
- React 19 and strict TypeScript renderer built with Vite.
- React Aria Components for accessible primitives.
- CSS custom properties and CSS Modules for tokens and component styles.
- Zustand for ephemeral shell state.
- TanStack Query for command-backed cached data and invalidation.
- SQLite through the official Tauri SQL plugin.
- Stronghold for the OpenAI API key.
- Tauri filesystem, dialog, window-state, logging, and single-instance plugins as needed. These are available in Tauri’s official plugin model. [Tauri plugin documentation](https://v2.tauri.app/plugin/) [Stronghold reference](https://v2.tauri.app/reference/javascript/stronghold/)
- React Three Fiber as a lazy-loaded renderer for bounded Three.js scenes. [React Three Fiber documentation](https://r3f.docs.pmnd.rs/tutorials/how-it-works)

### Source boundaries

- `src/app`: shell, routing, commands, providers.
- `src/features`: Work, Systems, Library, Playground, Oracle, Settings.
- `src/components`: shared accessible UI and design primitives.
- `src/domain`: framework-independent types, validation, orchestration rules, and migrated deterministic logic.
- `src/bridge`: typed `AppBridge`, Tauri implementation, demo implementation, and temporary web adapter.
- `src-tauri`: Rust commands, SQLite migrations, filesystem scope, secure credentials, AI transport, logging, packaging.
- `public/media`: source media during migration; production assets move through the manifest.
- Existing `.mjs` modules remain intact until their replacement passes parity tests.

### Bridge interfaces

Expose typed operations rather than direct filesystem or SQL access:

- projects: list, create, update, archive, search;
- chats/messages: list, create, rename, send, stream, stop;
- tabs: open, close, reorder, restore;
- attachments: select, authorize, link, unlink, inspect;
- library: search, get, create, update, import, equip;
- systems: list, get, save, duplicate, plan, run, continue;
- Playground: compare, cancel, accept result;
- Oracle: respond, explain, draft proposal, apply approved proposal, cancel;
- settings: get, update, export diagnostics;
- migration: inspect, preview, execute, rollback status.

### State types

Define shared TypeScript types for:

- `Project`, `Chat`, `Message`, `WorkspaceTab`, `AttachmentRef`;
- `AgentDefinition`, `AgentConfiguration`;
- `SkillDefinition`, `SkillVersion`, `EquippedSkill`;
- `SystemDefinition`, `SystemVersion`, `WorkflowPhase`;
- `Run`, `RunEvent`, `Artifact`;
- `MarketplaceItem`, `LibraryInstallation`;
- `OracleContext`, `ChangeProposal`, `ApprovalRecord`;
- `AppSettings`, `MigrationRecord`.

Run states: `queued`, `running`, `awaiting_approval`, `completed`, `failed`, `cancelled`.

Proposal states: `draft`, `awaiting_approval`, `approved`, `applying`, `applied`, `cancelled`, `failed`.

### SQLite model

Use UUID primary keys and UTC timestamps. Normalize searchable relationships while reserving JSON only for extensible metadata.

Required tables:

- projects, chats, messages, workspace_tabs;
- attachments and project_attachments;
- agents, agent_versions, agent_skills;
- skills, skill_versions;
- systems, system_versions, system_agents, system_skills, workflow_phases;
- runs, run_events, artifacts;
- marketplace_items, library_installations;
- oracle_sessions, change_proposals, approval_records;
- app_settings and migration_records.

Create versioned forward-only migrations. Back up the database before migration. Never silently delete user records.

### Legacy migration

- Import `data/systems.json`, agent settings, `knowledge/index.json`, skill directories, reference notes, and JSONL events.
- Calculate source hashes and record every import in `migration_records`.
- Preview counts and conflicts before execution.
- Preserve originals until Gate C.
- Duplicate identifiers are resolved deterministically and recorded.
- Re-running an import must be idempotent.

### AI and security

- Call the Responses API from the Rust layer, never directly from the renderer.
- Default API requests to `store: false`; keep the application transcript locally.
- Use strongly typed tool schemas and an explicit allowlist.
- Separate read-only tools from mutation tools.
- A mutation tool cannot execute without a persisted approved proposal matching its arguments.
- Stream output and tool states to the renderer.
- Support cancellation, timeout, rate-limit, offline, authentication, and malformed-response states.
- Never log API keys, full private file contents, or secret-bearing request headers.
- The Responses API supports typed tools and explicit tool-selection/approval events. [OpenAI Responses API reference](https://platform.openai.com/docs/api-reference/responses-streaming/response/web_search_call?lang=curl)
- Demo mode implements the same bridge contract using deterministic fixtures and is visibly labeled.

### WebGL limits

- No WebGL on Work, Settings, or default Library lists.
- At most one active canvas per view.
- Lazy-load the Three.js bundle.
- Cap device pixel ratio at 1.5.
- Pause rendering when obscured or inactive.
- Provide static image and reduced-motion fallbacks.
- WebGL failure must never block functional controls.

## 7. Core flows

### Project and chat

Create/open project → select/create chat → attach authorized context → choose model → send → stream/stop → save local transcript and artifacts → reopen from restored tab.

### Agent creation

Choose guided or advanced → define identity and role → define behavior → select capabilities → equip compatible skills → select visual identity → review effective configuration → save after confirmation.

### Skill equipping

Open skill → inspect compatibility and dependencies → choose agent or system → preview configuration change → approve → persist relationship → show provenance and rollback action.

### System creation and continuation

Create manually or ask Oracle to draft → define purpose → add phases → assign agents and skills → configure approvals → validate → review → save. Opening a saved system always shows an overview first; only “Continue workflow” enters execution.

### Playground comparison

Select project → enter one task → choose two or three saved systems → verify estimated scope → run side by side → receive plain-language comparison with provenance → keep one result or system → optionally attach it to the project.

### Oracle mutation

Ask Oracle → choose “Show me how” or “Do it for me” → Oracle gathers missing parameters → produces a structured diff → user edits, approves, or cancels → approved command runs → result and rollback guidance appear in both Oracle and the activity record.

## 8. Delivery roadmap

### Phase 0 — Context, evidence, and design foundation

- Save this master plan.
- Create and validate the six root files.
- Record Gate A and current uncommitted state.
- Refresh `.olympus` audit artifacts for the expanded desktop brief.
- Inventory routes, APIs, data, media, and migration sources.
- Produce exactly three concepts.
- Obtain Gate B.
- Create the approved asset manifest and design tokens.

**Exit:** six-file validation passes, concept is approved, implementation boundaries are documented.

### Phase 1 — Clickable high-fidelity prototype

- Build the selected shell, Work, Systems overview, Library overview, Playground onboarding, Oracle, and narrow states using controlled fixture data.
- Verify keyboard flow, empty/loading/error states, motion, reduced motion, and hierarchy.
- Use the prototype for the WKO narrative before adding backend complexity.

**Exit:** the complete primary journey is demonstrable without explanatory narration.

### Phase 2 — Smallest functional desktop slice

Implement:

- Tauri shell and Windows packaging;
- SQLite migrations;
- create/open project;
- multiple project chats and tabs;
- file/folder authorization;
- composer with model selector and send/stop;
- live Responses API with secure key storage;
- deterministic demo fallback;
- persistent Oracle;
- one approval-gated mutation, such as drafting and saving a system;
- legacy read/import preview.

Exclude full marketplace, full 3D, advanced agent editor, cloud sync, publishing, and payment.

**Exit:** packaged Windows app completes the end-to-end Work journey after restart without relying on the development server.

### Phase 3 — Agents, skills, and knowledge libraries

- Implement searchable category-specific libraries.
- Add guided/advanced agent editor.
- Add skill artifact detail and equipping.
- Add capabilities/MCP and reference knowledge management.
- Complete legacy library migration.

**Exit:** agent and skill changes are persistent, explainable, reversible, and visible in affected systems.

### Phase 4 — Systems and Playground

- Implement system overview, editorial workflow editor, validation, duplication, and continuation.
- Implement actual side-by-side comparison, cancellation, comparison explanation, and result adoption.
- Preserve deterministic orchestration logic and approval gates.

**Exit:** a user can build, run, compare, and retain reusable systems without entering raw configuration.

### Phase 5 — Marketplace and visual world

- Add local marketplace manifests and installation.
- Add approved character scenes, artifact visuals, and system-world moments.
- Add generated assets only from the approved manifest.
- Optimize, lazy-load, and provide static fallbacks.

**Exit:** the atmosphere strengthens recognition and navigation without degrading Work performance or accessibility.

### Gate C — Final acceptance

After QA, present desktop and narrow evidence, packaged-build evidence, remaining risks, migration results, and WKO demo instructions. The work is not final until the user approves Gate C.

## 9. Verification and acceptance

### Automated checks

- Six-file validator.
- TypeScript strict check and ESLint.
- Unit tests for domain rules, compatibility, import idempotency, approval matching, state machines, and demo/live provider parity.
- Integration tests for SQLite migrations, rollback behavior, secure settings, attachment scopes, streaming, cancellation, and failure mapping.
- Playwright tests against the browser-compatible renderer.
- Tauri packaged smoke test on Windows.
- Accessibility checks using axe plus manual keyboard verification.

### Required scenarios

- First launch with no data.
- Legacy data import preview, success, conflict, interruption, and rerun.
- Missing, invalid, and removed API key.
- Demo fallback with visible labeling.
- Offline and rate-limited AI requests.
- Stop during streaming.
- Oracle proposal edit, approval, rejection, stale approval, failed application, and manual fallback.
- Missing or moved attachment.
- Database locked or migration failure.
- Empty libraries and systems.
- WebGL unavailable.
- Reduced motion and reduced transparency.
- 1440×900, 1280×720, 1024×768, 800×600, and narrow 390-pixel layouts.
- Complete keyboard-only primary journey.
- No console errors or unhandled promise rejections.

### Performance gates

- Work shell becomes interactive within 2.5 seconds on the WKO reference Windows machine after warm install.
- No Three.js code in the initial Work bundle.
- Initial renderer JavaScript target: no more than 500 KB gzip, excluding lazy feature chunks.
- Route changes must not trigger full application reloads.
- Hidden 3D surfaces consume no animation frames.
- Large lists use virtualization or pagination after measured need.
- Existing media is resized and encoded per placement rather than shipped indiscriminately.

### Vertical-slice acceptance

- Install and launch the Windows app.
- Create a project and two chats.
- Open multiple project tabs and restore them after restart.
- Attach a file or folder with explicit permission.
- Run a live or labeled demo response and stop it mid-stream.
- Open Oracle from Work and another product area with correct context.
- Ask Oracle to draft a system, review its structured changes, cancel once, then approve and save.
- Reopen the saved system through its overview and “Continue workflow.”
- No secrets appear in source, logs, database exports, or screenshots.
- All important work remains possible without Oracle or 3D.
