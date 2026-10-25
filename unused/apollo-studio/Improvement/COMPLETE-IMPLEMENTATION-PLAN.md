# Convenium.Design Studio — Complete One-Pass Improvement Plan

## Delivery intent

Deliver the complete redesign and functional desktop slice in one implementation task. This is not a cosmetic pass: it replaces the generic control-plane experience with a dark, cinematic, editorial creative operating system while preserving local-first behavior, existing API compatibility, demo/live honesty, and user control.

The implementation task owns product code, tests, migration work, assets approved below, and verification. It must not silently change systems, skills, agents, notes, permissions, attachments, or generated-media placements.

## Locked product decisions

- **Visual direction:** dark cinematic editorial operating system; tactile material depth, purposeful contrast, expressive typography, quiet control density, no generic dashboard-card wall.
- **Primary system:** Olympus Web System is the visible active system with Convenium.Design, Athena, Calliope, Hephaestus, and Hermes. The empty untitled system is preserved but archived/hidden—not deleted.
- **Agent identity:** supplied god-character media is authorized for agent-profile use, subject to recorded provenance. Each agent gets a rich profile and editable operating configuration.
- **Future extensibility:** the first release starts with the one system and five-agent cast, but supports later agent, skill, and system additions.
- **Assistant:** project chat is available throughout Work, Systems, Library, Playground, Architecture, and Settings. Oracle is a distinct contextual assistant for explanations, drafts, proposals, approvals, progress, and recovery.
- **Approval:** all changes to systems, agents, skills, notes, permissions, attachments, and generated assets require a visible change proposal and explicit confirmation before persistence.
- **Media:** provide in-app still-image generation through OpenAI’s image-generation capability; optional Sora video generation is a controlled, later-capable media surface. Generated media remains a draft until approved and placed.
- **Target:** Windows-first Tauri desktop app with a browser-compatible renderer for verification. No cloud accounts, collaboration, publishing, payments, multiplayer, or game engine.

## Experience architecture

```text
Native Windows frame
└── Convenium.Design Studio shell
    ├── Project sidebar
    │   ├── Search / command palette
    │   ├── Project groups
    │   └── Nested chats per project
    ├── Global top navigation
    │   ├── Work
    │   ├── Architecture
    │   ├── Systems
    │   ├── Library
    │   ├── Playground
    │   └── Settings
    ├── Restored project-tab strip
    ├── Main context-aware workspace
    ├── Persistent active-project chat rail / narrow drawer
    └── Persistent Oracle proposal dock / narrow drawer
```

### Work

- Primary job: complete project work through a real project-aware chat.
- Real project creation, rename, archive, search, nested chat creation, rename, tabs, restore-after-restart, message persistence, model selection, send, stream, stop, retry, and error recovery.
- File and folder attach uses native picker, explicit authorization scope, inspect/remove/recover behavior, and visible linked-context badges. The renderer never receives unrestricted filesystem access.
- Default empty state: create/open a project or use a local sample task. Advanced model/tool settings stay secondary.

### Architecture

Replace the static architecture diagram with an editable **System Architecture Workbench**:

1. **System canvas:** shows the selected system’s phases, dependencies, agents, skills, approvals, status, and current run state. Use accessible SVG/CSS structure; no required WebGL.
2. **System notes:** editable purpose, operating rules, constraints, decisions, and runbook notes with version history. Saving creates a proposal/diff and requires confirmation.
3. **Structured inspector:** edit phases, agent assignments, skill assignments, activation rules, budgets, priorities, approval gates, and dependencies. Every edit validates compatibility and preview effects before approval.
4. **System catalog:** Olympus is active. Example systems are previewable templates with purpose, participants, and compatibility; duplicate/import creates a proposal rather than replacing Olympus.
5. **Assistant:** Oracle can explain the canvas, draft a system or note change, show a structured diff, and apply only a confirmed proposal.

### Systems

- Show the system overview first: purpose, phases, agents, compatibility, health, next safe action, outputs, and notes.
- “Continue workflow” is explicit. Creation, duplication, import, editing, and execution are separated from browsing.
- Support one active system initially, but preserve an extensible catalog model.

### Library

Library overview has category-first navigation—not one generic Knowledge page:

- **Agents:** cinematic agent gallery and profile detail. Each profile shows portrait, role, mission, status, equipped skills, compatible systems, provenance, and recent activity.
- **Agent editor:** guided path for identity, role, behavior, capabilities, skills, review; advanced tab for raw instructions/tool policy/budget/priority. Visual changes never alter operational data implicitly.
- **Skills:** searchable artifact details: purpose, inputs, outputs, dependencies, version, availability, equipped agents, compatibility, and source. Create/import/equip actions require proposal review.
- **Capabilities:** connected tools and permissions with trust boundary, status, and last verification time; secrets are never displayed.
- **Reference knowledge:** source, project scope, tags, indexing status, inaccessible-source recovery, and attach-to-project action.
- **Media studio:** assets, generated drafts, provenance, approval state, and placement. No invented downloads/ratings/purchases.

### Playground

- Guided comparison: project → task → select two or three systems → scope review → run → compare → retain result.
- Explain the workflow before advanced settings. Comparison outputs show provenance, configuration, cost/latency where available, cancellation, and adoption into the project.

### Oracle and project chat

- Active project chat persists visually in every product area: docked side rail on desktop; independently opened bottom/right drawer on narrow windows.
- Oracle remains separate from chat. It knows current project, chat, selected system/agent/skill, active notes, and attachments.
- Oracle actions: **Show me how** and **Do it for me**. The second option creates a reviewable proposal—never a direct mutation.
- Proposal UI: requested changes, affected records, validation, permission requirement, apply/cancel, execution progress, result, rollback or recovery guidance, and audit record.

## Visual system and 2026 direction

### Design principles

- Use editorial contrast and a deliberate material system instead of generic rounded dark cards.
- Use system typography with a high-character display face only where licensed/approved; compact, legible operational text elsewhere.
- Build hierarchy through composition, weight, space, texture, and lighting—not oversized headings.
- Use a limited midnight/charcoal base, moonstone neutrals, controlled solar-gold selection state, cyan for active intelligence, and a single approval/warning hue.
- Give functional controls tactile response: clear focus, pointer-down feedback, exact transition properties, and 36 px desktop / 44 px narrow targets.
- Use translucency only for chrome, drawers, and temporary surfaces. Add restrained grain/material texture behind—not beneath—important text.
- Keep ordinary UI movement short and interruption-safe; animate transform/opacity, never `transition: all`. Respect reduced motion, reduced transparency, and high contrast.
- Do not imitate macOS chrome on Windows. Do not use looping decorative animation, motion on routine keyboard actions, decorative 3D on Work, or fake activity.

### Logo and brand system

- Create a distinctive Convenium.Design mark built from an abstract orbit/sun/arch construction, plus wordmark, small icon, monochrome mark, and application icon.
- Produce a compact brand token sheet: color, material, spacing, radius, elevation, typography roles, icon rules, focus treatment, and motion durations.
- Use the mark consistently in shell, onboarding, empty states, and media studio without turning operational pages into marketing pages.

### Agent media and generated visuals

- Record existing god portraits: source, agent, dimensions, rights, transformations, intended placements, fallback, and loading weight.
- Build agent profile cards that use approved portraits with an accessible text identity fallback. Portraits never block profile configuration.
- Image generation flow: prompt → style/size/reference inputs → create draft → moderation/error state → inspect → choose placement → proposed record changes → explicit approval → local asset registration.
- Store generated output locally, retain prompt/provenance/creation metadata, support draft deletion and replacement, and never overwrite a canonical portrait without confirmation.
- Sora/video is optional and lazy: only generated after user selection, with duration/cost notice, static poster fallback, pause when hidden, and no autoplay on core work surfaces.

## Functional and data architecture

### Runtime and boundaries

- Tauri 2 shell; React 19 + strict TypeScript renderer; Vite; React Aria Components; custom CSS modules/tokens; Zustand for ephemeral shell state; TanStack Query for command-backed cache.
- `src/app` shell/routing/providers; `src/features` Work, Architecture, Systems, Library, Playground, Oracle, Settings; `src/components` accessible primitives; `src/domain` pure types/rules/state machines; `src/bridge` typed desktop/demo/web adapters; `src-tauri` commands, scoped filesystem, secure credentials, database, migrations, logging, packaging.
- Preserve existing `.mjs` modules and `/api/*` behavior until parity tests pass. Existing data, knowledge, media, outputs, and unrelated work are not disposable.

### AppBridge

Implement typed operations for:

- projects; chats/messages; workspace tabs; attachment selection/authorization/link/unlink/inspect;
- systems and system notes; agents; skills; library search/import/equip; media/generation drafts;
- Playground compare/cancel/adopt; Oracle explain/draft/apply-confirmed-proposal/cancel;
- settings/diagnostics; migration inspect/preview/execute/status.

### Persistence and migration

- SQLite with UUID keys, UTC timestamps, forward-only migrations, database backup before migration, no silent record deletion.
- Tables: projects, chats, messages, workspace_tabs, attachments, project_attachments, agents, agent_versions, agent_skills, skills, skill_versions, systems, system_versions, system_notes, system_agents, system_skills, workflow_phases, runs, run_events, artifacts, generated_media, media_placements, oracle_sessions, change_proposals, approval_records, app_settings, migration_records.
- Import legacy systems, agents, skills, knowledge/index, notes, events, and media references with hashes, preview counts/conflicts, deterministic duplicate resolution, idempotent reruns, and preserved originals.
- Existing untitled system is tagged archived/inactive via a reversible migration; Olympus becomes active only after preview and explicit confirmation.

### AI, image, and security

- All OpenAI calls run through Rust/server boundary; renderer never gets API keys. Use secure local key storage.
- Default text requests use local transcript storage and `store: false`; demo mode is deterministic and visibly labelled.
- Typed allowlisted tools distinguish read-only from mutation operations. A mutation can execute only when its persisted approved proposal exactly matches its arguments.
- Image and video generation requests are treated as media jobs with prompt, reference, cost/status, draft, approval, and failure states. Never log API keys, private file contents, or sensitive request headers.
- Handle authentication, offline, rate limit, timeout, malformed response, cancellation, missing attachment, and database-lock states visibly and recoverably.

## Required skills and implementation routing

Use these skills during the one-pass implementation, in this order where applicable:

1. `olympus-design-director` — maintain single integrated brief, decisions, and evidence.
2. `ui-ux`, `apple-design`, `emil-design-eng`, `impeccable`, `awwwards-web-design` — design-system rebuild, interaction craft, and quality review.
3. `reference-deconstruction` — only for supplied/approved references; transform principles rather than copy expression.
4. `asset-director` — provenance manifest for supplied god media, logo, generated assets, video, and static fallbacks.
5. `imagegen` / approved OpenAI image workflow — only after the manifest defines needed assets and prompts; no untracked media generation.
6. `gsap-core`, `gsap-performance`, and only needed companion GSAP skills — purposeful timed sequences; no decorative scroll spectacle.
7. `webgl-experience` — only if a system visualization passes an explicit value/performance/accessibility test; static SVG/CSS fallback required.
8. `visual-qa` — browser evidence across desktop, narrow, interaction, reduced-motion, and runtime states.
9. `design-analytics` — define consent-safe local event contract only if measurement is in scope.

## Complete acceptance criteria

### Primary scenarios

- First launch creates/open projects and nested chats; tabs restore after restart.
- Create a chat and see it immediately in its parent project group.
- Attach a file/folder after explicit permission; inspect, unlink, and recover a moved source.
- Run labeled demo or live response, stream it, stop it, retry it, and retain local transcript/artifacts.
- Open project chat and Oracle from Work, Architecture, Systems, Library, Playground, and Settings with correct context.
- Use Architecture to inspect Olympus, edit notes or a phase/agent/skill configuration, inspect a proposed diff, cancel once, then approve once; reopen the preserved version history.
- Open each agent profile, adjust settings through guided/advanced editor, preview impact, cancel/approve, and see the configuration in Olympus.
- Generate an image draft, inspect provenance/placement, cancel one, approve one, and see its static fallback.
- Preview an example system and duplicate/import it without replacing Olympus.
- Compare systems in Playground, cancel a run, retain a result, and attach it to the active project.

### Quality gates

- No console errors or unhandled promise rejections.
- Keyboard-only completion of the primary Work, Architecture edit/review, Library agent edit/review, and Playground flows.
- Initial Work bundle excludes Three.js. WebGL/media failure cannot block controls.
- Verified at 1440×900, 1280×720, 1024×768, 800×600, and 390 px representation with no document overflow.
- Reduced-motion, reduced-transparency, high-contrast, loading, empty, error, long-name, missing-media, and offline states are verified.
- TypeScript strict check, lint, unit tests for domain rules/approval matching/state machines/import idempotency, integration tests for SQLite/migrations/permissions/streaming/failure mapping, Playwright/axe checks, and Windows packaged smoke test pass.
- All generated and supplied media has provenance, rights/approval state, local storage location, dimensions/weight, placement, and fallback recorded.

## Implementation handoff constraints

- Implement this whole plan in the next task/window as one coherent delivery.
- Do not substitute a generic UI kit or introduce unapproved visual assets.
- Do not remove legacy records or overwrite existing portraits/media.
- Do not claim live API, packaged desktop, asset rights, analytics, browser QA, or approval behavior without passing the corresponding checks.
- Final delivery must include a before/after visual review, desktop/narrow evidence, confirmation-flow evidence, migration result, known limitations, and WKO demo instructions.
