# Convenium.Design Studio end-to-end evidence audit

Date: 2026-09-15

Mode: planning only; no production repair in this session

Target: `http://127.0.0.1:4174`, current worktree, supplied continuous-journey media, restored `test_projects/Savra_v2`

## Current experience in one sentence

Convenium.Design Studio currently presents a tested global shell around several incompatible legacy feature interiors, so users can reach routes but cannot reliably understand or complete the intended Oracle → project → plan → configure → test → execute → evidence journey.

## Evidence inventory

| Evidence | State | Use |
| --- | --- | --- |
| Live Home route at current browser size | Observed | Route trail, unknown stage, single generic project summary, fixed Oracle launcher |
| `.olympus/shell-evidence/home-{390,820,1280,1440,1920}.png` | Observed | Responsive shell states |
| `.olympus/shell-evidence/legacy/contact-sheet.png` | Observed | Work, Architecture, Systems, Playground, Agents, Knowledge, Oracle and Runs interiors |
| `New_upgradePlan/media/apollo-continuous-journey-v2/00`–`10` and `ROUTING.md` | Observed | Canonical route, hierarchy and node-view reference |
| `public/index.html`, `public/app.js`, `public/styles.css`, `public/shell.css` | Observed | DOM ownership, routing, responsive and positioning rules |
| `agents.mjs`, `systems.mjs`, `data/systems.json` | Observed | Current five-agent runtime and displayed system data |
| Restored `test_projects/Savra_v2` repository | Observed | Final Savra plan, design tokens, assets, implementation and QA evidence |
| Original Savra v2 session transcript/load order | Unknown | Exact hidden prompts, model settings and chronological skill activation cannot be recovered from the repository |
| Product analytics / task completion recordings | Unknown | No behavioral baseline beyond browser harnesses and local fixtures |

## Five highest-leverage findings

### 1. The product is two UI architectures occupying the same pages

**Severity:** Critical

**Confidence:** High

**Observed evidence:** `shell.css` adds a fixed global rail, context strips and bottom Oracle launcher while `styles.css` retains legacy top bars, three-column Work, sticky/fixed inspectors, sticky composers, fixed Oracle dock and multiple later overrides of the same selectors. Work alone has repeated definitions for `.workspace-frame`, `.work-composer`, `.work-messages`, `.project-sidebar`, and responsive breakpoints at 1080, 760 and later container rules. The legacy contact sheet visibly changes density and composition by route instead of following the supplied continuous grammar.

**Affected outcome:** Layout correctness is accidental. A page can pass viewport overflow assertions while fixed and sticky surfaces cover each other or remove important navigation. Every later feature repair becomes fragile because it must negotiate both systems.

**Required response:** Before polishing, freeze one layout ownership model. The canonical shell owns global navigation/status/Oracle. Each route gets one interior layout contract; obsolete selector families are removed after parity tests, not layered over again.

### 2. The primary user journey is represented by routes, not implemented as a continuous task

**Severity:** Critical

**Confidence:** High

**Observed evidence:** The supplied reference defines Home → Intake → Design DNA/Brief → Master Plan → Configure → Playground → Work → Results/QA. Current Home shows an untitled project with unknown stage. Several canonical routes render honest entry or empty states while their actual behaviors remain in legacy roots. The contextual Oracle increment produces intake data in a pure module but is not yet the rendered, persisted questionnaire. Plan, Results and subordinate project evidence are documented as future tasks.

**Affected outcome:** A user cannot start with a goal and finish with a verified artifact without understanding internal route boundaries or encountering placeholders. Navigation availability is mistaken for product completion.

**Required response:** The implementation plan must be organized around one executable fixture journey and require end-to-end evidence before any route is called complete.

### 3. Projects and chats do not have a coherent responsive information architecture

**Severity:** High

**Confidence:** High

**Observed evidence:** On desktop, projects are buttons whose secondary line concatenates every chat name, while the selected project's chats are repeated as horizontally scrolling tabs. Chat identity is not encoded in the canonical URL; the route stops at project Work. Below 760px the entire project sidebar is hidden, with no project/chat drawer or replacement selector. At narrower widths the Work composer becomes sticky while the global Oracle launcher is also fixed at the bottom; the inspector changes from grid column to fixed panel at 1080px. These independent positioning rules create the overlap class the user reported.

**Affected outcome:** Users cannot see their project/chat hierarchy consistently, cannot deep-link or reload a selected chat reliably, and may lose access to project switching on mobile. Conversation content, composer, inspector and Oracle compete for the same lower viewport.

**Required response:** Use a single project/chat model: project switcher → explicit chat list → URL-addressable chat → one work composer. On narrow screens, project/chat navigation becomes a drawer and only one bottom interactive surface may be open at a time.

### 4. Displayed agents and runtime workflow do not match the requested Savra/Olympus process

**Severity:** Critical

**Confidence:** High

**Observed evidence:** `agents.mjs` and `data/systems.json` define five mythological agents—Convenium.Design, Athena, Calliope, Hephaestus and Hermes. The approved product architecture specifies six functional roles: Design Director, Visual Analyst, Asset Producer, Design Engineer, Independent Critic and Analytics Specialist. Savra v2 verifies the final build plan, design system, implementation and QA outcome, while the current system combines authorship, asset work and review in ways that prevent clear independence.

**Affected outcome:** The Agents and System screens explain a workflow that is not the one the user asked to reproduce. Oracle, System and Playground can disagree about who does what and which skill changes the result.

**Required response:** Establish one immutable, provenance-labelled Savra workflow manifest consumed by runtime planning and every UI surface. Do not invent historical settings absent from the repository.

### 5. The interface does not preserve the supplied reference logic or explain advanced controls

**Severity:** High

**Confidence:** High

**Observed evidence:** The canonical screenshots show a condensed editorial operational UI, explicit step progression, one primary action, configuration rows with a right inspector, and a dark System node canvas with a synchronized explanation. The current Home is visually sparse and generic; Agents uses portrait cards; Architecture exposes a legacy graph; System/Knowledge do not reproduce the supplied node compositions. The shell uses `Arial Narrow` fallbacks while Savra evidence specifies Cormorant Garamond, Barlow Condensed and IBM Plex Mono for the project artifact. Many advanced controls expose internal terms without a nearby “why this matters” explanation.

**Affected outcome:** New users face unnecessary system complexity, while the distinctive visual and interaction evidence they approved is absent. Advanced control density displaces the core task.

**Required response:** Create a route/control matrix from screenshots `00`–`10`: one job, one primary action, at most two visible secondary actions, progressive disclosure for expert settings, and plain-language purpose/recovery copy. Savra typography belongs in Savra evidence previews; the global shell retains its own coherent system.

## What works and must be protected

- Canonical route ownership, legacy redirects, keyboard route shortcuts and focus restoration have focused automated coverage.
- The responsive shell removes document overflow at the measured widths and preserves reduced-motion behavior.
- The canonical state writer provides hash-bound proposals, approvals, stale-state rejection and append-only journal replay.
- Existing local data, APIs, media and project repositories are preserved rather than overwritten.
- The supplied reference set already defines a coherent journey and node-control composition; a new visual direction is unnecessary.

## Unanswered questions and limits

- The Savra v2 repository does not prove the original session's exact model, hidden prompt, host configuration or chronological skill load order. These must stay labelled unknown or reconstructed.
- No analytics establish which legacy advanced controls are used. Removal decisions should follow the approved route/control matrix and observable task value.
- The earlier seeded Savra preview points to a missing `Savra_Restraunt` screenshot. The restored Savra v2 repository is now the source; preview availability must be re-bound without mutating that repository.

## Design problem statement

Rebuild Convenium.Design Studio as one comprehensible task system—not a shell layered over a control panel—so a user can choose a project and chat, describe a goal, understand each question and decision, inspect the exact six-role Savra workflow, test configuration safely, execute only after approval, and review evidence without learning Convenium.Design's internal architecture. The supplied continuous-journey screenshots determine hierarchy and node-view logic; success is the complete working journey at desktop and mobile, not isolated route or visual-metric passes.

## User-rejected visual finish — corrective audit

Observed: no bundled fonts or @font-face; Arial Narrow is the first body/UI family. New rail contains no SVG icons; six-role inspector list contains only role name and status. System graph is hidden after six large role disclosures. Knowledge graph is hidden by default at every width. These are high-confidence visual implementation gaps against canonical05/09/10, despite prior functional PASS WITH NOTES. That verdict does not constitute visual acceptance.

Preserve working journal, routing, gates, data, six-role manifest, keyboard and offline behavior. Correct one direction, no alternatives or intake. New visual correction scope authorized by user's explicit rejection. Missing assets are locally served OFL fonts, not user product media; no generated imagery is needed.
