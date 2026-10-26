# Convenium.Design Studio — Oracle Continuum build plan

**This document is the build contract, not a task list.** It resolves one direction before implementation. The build must use this plan and the paired `DESIGN.md`/`design.json` in a fresh implementation session. Gates A and B are `approved-in-plan`; Gate C remains a real user review.

## Outcome

Convenium.Design Studio becomes a local, task-first design-agency operating system. A person starts with an ordinary-language goal, sees only the next meaningful decision, can inspect how Convenium.Design will work, safely compare a configuration, and review evidence without needing graph literacy. The primary action is always the single visible action that advances the current stage; the secondary action is to inspect or safely revise its supporting evidence.

**Direction policy:** one Oracle Continuum direction is binding. No alternative shell, graph-first home, or route-specific theme may be introduced.

## Creative system

- **Thesis:** a calm paper operations desk contains a precise technical substrate, making invisible agency work legible without turning the user into an operator of a diagram.
- **Art direction:** task-first clarity outside; luminous, evidential routing inside System and Connections. It is not a marketing landing page, a generic neon dashboard, or a gallery of disconnected screens.
- **Palette:** paper `#F7F7F2` is the workspace; ink `#050506` grounds shell and technical canvases; emerald `#57C98A` means active/verified/complete/approved; blue `#5FA8F5` means action/selection/data flow; amber `#E0A64B` means pending/review/approval; coral `#F0757F` means error/blocker/destructive action. These meanings never change by route.
- **Type:** system UI sans with tabular numerals; `Arial Narrow` is a conditional first heading fallback, then the shared sans stack. The type ramp is 12/14/16/20/24/28px. The 28px display maximum equals the Instrument doctrine's documented largest size; no heroic oversized type is permitted.
- **Material:** near-black rail; paper work plane with a 1px, low-contrast technical grid; flat rules and 8px panels; inner technical canvases use near-black without replacing the enclosing shell.
- **Composition:** fixed 210px rail, fixed route/status strip, and a max-width 1440px work grid. Each screen opens with stage, next action, and evidence context before dense detail. The persistent Oracle composer remains bottom-center above safe content padding.

## Screen grammar, data, and media map

The numbered reference images under `New_upgradePlan/media/apollo-continuous-journey-v2/` define purpose and hierarchy; they are not shipped as decoration. Real local project records render wherever they exist. All fixture content is labelled deterministic.

### 00. Journey map — orientation

- **Reference:** `00-user-journey-map.png`.
- **Data:** fixed stage definitions, gates, owner roles, and transitions from the product state contract.
- **Grammar:** a linear stage rail with readable labels and a list equivalent; no interactive graph required.
- **Mobile:** stages become an ordered current/next list.

### 01. Home / Oracle — attention and entry

- **Reference:** `01-home-oracle.png`.
- **Data:** active project, current stage, next action, pending decision, latest output, and recent activity from project/run fixtures or local records.
- **Media:** optional real project thumbnail; otherwise a labelled neutral artifact tile.
- **Grammar:** one dominant attention card, compact activity/evidence rows, and primary “Describe a goal” action. The Oracle dock is present but does not cover the card CTA.
- **Mobile:** top summary stays before activity; dock remains visible and composer controls wrap without horizontal overflow.

### 02. Oracle intake — guided discovery

- **Reference:** `02-oracle-intake.png`.
- **Data:** question schema, answered fields, choice cards, attachments by metadata only, conversation, and removable context tokens.
- **Grammar:** one question at a time; why consequential information is requested; progress and answer history are secondary. Voice is capability-gated and labels unavailable status.
- **Mobile:** one choice-card column; keyboard focus returns to the current prompt.

### 03. Design DNA / Brief — reviewable understanding

- **Reference:** `03-design-dna-brief.png`.
- **Data:** project outcome, audience, action, constraints, references, assets, Design DNA, unknowns, and brief hash.
- **Grammar:** readable narrative brief first, structured evidence second; “Approve brief” is the only filled action. Unknown evidence is shown as unknown, not passed.
- **Mobile:** show approval context before editable detail; details collapse after the essential summary without hiding keyboard access.

### 04. Master Plan — plain-language plan

- **Reference:** `04-master-plan.png`.
- **Data:** stages, roles, dependencies, gates, unresolved decisions, budget estimate/status, evidence requirements, plan hash, and fallbacks.
- **Grammar:** the human plan leads; each role/task has its reason and status. Advanced configuration is linked rather than competing with the plan. “Review plan” is primary.
- **Mobile:** ordered stage cards become a list with status and dependency text, not a shrunk diagram.

### 05. Configure workflow — explainable configuration

- **Reference:** `05-configure-workflow.png`.
- **Data:** recommended roles, skills, tools/plugins, models, permissions, constraints, capability probe results, and fallback reasons.
- **Grammar:** editable draft markers and effect summaries make every change inspectable. “Test configuration” is primary. Changes cannot mutate the approved plan directly.
- **Mobile:** configuration panels become disclosure sections; selection remains visible in the route strip and all terms have plain-language consequences.

### 06. Playground — isolated comparison

- **Reference:** `06-playground-compare.png`.
- **Data:** Setup A/B, capability deltas, test inputs, cost/time/evidence estimates or unknowns, bounded test results, failures, cancellations, and reset state.
- **Grammar:** comparison is a two-column cause/effect table; draft and test labels remain persistent. “Apply tested setup” proposes a change; it never applies silently.
- **Mobile:** Setup A then Setup B in a single comparison list with changed fields paired.

### 07. Execution / Work — bounded run state

- **Reference:** `07-execution-work.png`.
- **Data:** run identifier, task status, agent role, evidence, attempts, blockers, budget, model/environment selection, and a typed append-only event stream.
- **Grammar:** current task and blocker lead; completed output moves to Results. “Approve or pause” appears only when the state permits it. Demo/live/unverified/unknown remain distinct.
- **Mobile:** execution is a chronological list; technical graph remains off by default.

### 08. Results / QA — evidence and client review

- **Reference:** `08-results-review.png`.
- **Data:** artifact/version, inputs, source lineage, producing roles, plan/design hashes, desktop/mobile evidence, QA, independent review, limitations, export status, and Gate C.
- **Media:** real artifact preview first; a missing preview is a labelled fallback, never a stock image.
- **Grammar:** output preview and result status lead; provenance, changes, QA, and limits are directly reachable. “Approve or request changes” is primary at Gate C.
- **Mobile:** preview uses a constrained viewport with metadata below; before/after becomes an accessible sequential comparison.

### 09. Knowledge / Connections — evidence before graph

- **Reference:** `09-knowledge-connections.png`.
- **Data:** bounded search results, collections, sources, Design DNA, artifact links, freshness, corpus/host/status filters, and typed relationships.
- **Grammar:** search and collections are the default. Connections is optional and has a synchronized list with source evidence and relationship type.
- **Mobile:** list is the default; the graph is opt-in and horizontally pannable only after explicit activation.

### 10. System / Node Control — advanced diagnosis

- **Reference:** `10-system-node-control.png`.
- **Data:** run trace, typed nodes/edges, evidence links, selected object, permissions, budget, capability status, failures, and draft-only configuration proposals.
- **Grammar:** near-black inner canvas, legend, “What you are seeing,” breadcrumb, inspector, and synchronized list. Luminous paths only indicate a typed relation, selection, activation, or recorded event. “Inspect or control a run” remains plain-language.
- **Mobile:** default List mode; no autonomous animation or graph-first gesture.

### Agents — transparent specialist profiles

- **Reference basis:** route ownership and role contract in `PRODUCT-ARCHITECTURE.md`; no numbered image is supplied for this supporting route.
- **Data:** identity, responsibility, activation condition, current bounded tasks, skills, tools, evidence, history, limitations, availability, and contextual specialist conversation scoped to the active project.
- **States:** empty inventory, loading, unavailable capability, stale evidence, selected profile, active task, blocked task, deterministic fixture, and honest unknown status. Oracle/director authority remains visible even when a specialist conversation is open.
- **Grammar:** searchable role list and plain-language profile detail lead; evidence and limitations are never hidden below decorative identity treatment. The primary action is **“Open relevant evidence”**; **“Talk in project context”** is secondary and cannot bypass Oracle's plan authority.
- **Mobile:** profiles render as an ordered list; selecting one opens a full-width detail with a visible back control, retained project context, and no horizontal skill/tool table.

### Settings — explicit local controls

- **Reference basis:** route ownership and prototype boundary in `PRODUCT-ARCHITECTURE.md`; no numbered image is supplied for this supporting route.
- **Data:** selected implementation model, environment, integration and capability status, permissions, notification policy, storage/privacy settings, accessibility preferences, and defaults. Values not measured or unavailable retain those exact labels.
- **States:** local/demo/live/unverified/unavailable/unknown environment; clean and invalid draft; permission required; save pending/saved/failed; notifications muted; reminder scheduled; integration disconnected. No state is inferred as live from a configured key alone.
- **Grammar:** plain-language groups begin with Environment and model choice, then permissions, notifications, privacy/storage, and accessibility. The primary action is **“Review and apply settings draft”**; destructive reset actions expose confirmation and recovery.
- **Notifications/reminders:** quiet by default. Notify only for required input, approval, completion, failure, meaningful change, or a user-created reminder; unchanged monitoring emits no notification. A user can mute, undo, or change the policy without altering production state implicitly.
- **Mobile:** groups become accessible disclosures; current environment and unsaved-change status remain pinned under the route strip, and notification controls retain 44px targets.

### Shared shell

- **Routes:** Home, Projects, Plan, Playground, Results, Knowledge, System, Agents, Settings—exactly in that order.
- **Identity and status:** the Convenium.Design identity and environment status occupy fixed positions in the rail/route strip on every desktop route. Environment is labelled **local**, **demo**, **live**, **unverified**, **unavailable**, or **unknown** from the capability record; color supports but never replaces the text label. A configured credential does not mean live.
- **Data:** active project, route trail `Projects / {project} / {view}`, Oracle availability, current stage, next mandatory action, fixed Convenium.Design identity, and environment/capability status.
- **Media:** no decorative backgrounds. The faint grid is CSS material. Existing identities are content only when they explain an agent or artifact.
- **Mobile (<820px):** rail changes to a drawer triggered from the route strip. Convenium.Design identity and the textual environment badge move into the fixed strip beside the current route; route, stage, next action, environment, and Oracle remain visible before opening the drawer.

## Motion and interaction choreography

- **Implementation:** CSS transitions for ordinary state changes; existing vendored GSAP is permitted only for bounded run-trace and comparison choreography that CSS cannot express. No new dependency, WebGL, scroll narrative, or external generation.
- **Route/selection:** 120ms opacity + 2–4px transform; focus is immediate and never delayed.
- **Draft comparison:** changed rows receive a 160ms blue outline/number transition on setup selection; unchanged fields remain quiet.
- **Run trace:** only evidence-backed event edges illuminate in sequence, max 240ms per edge; offscreen traces stop and do not imply execution in demo state.
- **Oracle:** open/close and context-token removal use 160ms opacity/transform; submission moves to a labelled pending state, never a fake completion state.
- **Reduced motion:** all durations collapse to 1ms; graph edges, glow, transforms, and auto-panning stop; the final static state still communicates selection, status, and path.
- **Keyboard/touch:** no hover-only control; focus ring is a 2px blue outline; all destructive actions expose a reversible path where practical.

## Implementation notes and guardrails

- Stack remains Node 20+ ESM, vanilla HTML/CSS/JS, SVG connectors, local JSON/JSONL state, existing Lucide and GSAP bundles, and the existing browser harness.
- Production state is canonical; UI state is a projection. Every mutation becomes a validateable proposal and uses one state writer plus append-only events.
- New dependencies, React migration, CrewAI, WebGL, managed cloud, billing, marketplace, unapproved asset generation, and unattended publishing are excluded.
- **Performance targets, not measurements:** 60fps for bounded transform/opacity motion; no continuous graph work offscreen; 0 horizontal overflow at 390px; no large decorative assets; no claim of field LCP/INP without collected telemetry.

## Implementation file responsibility map

The following map is exact for the approved prototype. New behavior belongs in focused modules; `public/app.js` remains bootstrap/compatibility wiring rather than a second feature layer.

| Path | Responsibility |
|---|---|
| `public/index.html` | Semantic application shell and view roots only. |
| `public/app.js` | Bootstrap and legacy-compatible wiring only. |
| `public/modules/router.js` | Route ownership, view lifecycle, deep links, focus restoration, and legacy redirects. |
| `public/modules/store.js` | Client projection of canonical state and derived selectors. |
| `public/modules/oracle.js` | Contextual composer, intake, choice cards, and proposals. |
| `public/modules/projects.js` | Project workspace and six-context/Olympus artifact projections. |
| `public/modules/plan.js` | Master Plan, configuration drafts, approval-hash display, and fallbacks. |
| `public/modules/playground.js` | Setup A/B comparison, bounded test, reset, and apply-to-plan proposal. |
| `public/modules/results.js` | Artifact preview, versions, evidence, QA, finish review, provenance, and Gate C. |
| `public/modules/knowledge.js` | Bounded search, collections, and Connections/list parity. |
| `public/modules/system-graph.js` | Run trace, semantic SVG graph, inspector, and synchronized list. |
| `public/modules/notifications.js` | Quiet-by-default reminders and actionable notification state. |
| `public/modules/agents.js` | Agent profiles, activation/evidence/limitations, and project-context conversation entry. |
| `public/modules/settings.js` | Model/environment/integration/permission/notification/privacy/accessibility drafts. |
| `public/styles.css` | Token declarations and legacy compatibility only; focused view styles are separate imports when supported. |
| `state.mjs` | Single validated canonical state writer and append-only events. |
| `oracle.mjs` | Deterministic intake/plan proposal service and optional live adapter. |
| `projects.mjs` | Explicit project-root registration and artifact projection. |
| `scripts/ui-*.mjs` | Behavior, metric, and screenshot coverage. |

**Legacy compatibility:** existing routes must remain usable or receive tested redirects; existing Node ESM domain modules and `/api/*` behavior stay authoritative until replacement parity is demonstrated. Existing `data/`, `knowledge/`, `public/media/`, fixture records, and unrelated uncommitted work are preserved.

**Untouched-path exclusions:** this approved prototype does not alter reusable Convenium.Design agents, skills, registry, templates, doctrines, external project sources, protected local records, credentials, or media provenance. It does not add a React/Tauri migration, CrewAI, WebGL, cloud runtime, billing, marketplace, external media generation, or deployment work. A later approved slice must explicitly own any protected path before changing it.

## Build order

1. Implement canonical state/approval hashes and deterministic fixtures with tests.
2. Build the shared shell, semantic tokens, route strip, navigation, and responsive drawer.
3. Implement Oracle intake and Brief, then Plan/Configure and Playground.
4. Implement execution, Results/evidence, Knowledge/Agents/Settings, quiet notifications/reminders, and System/List parity.
5. Verify static hierarchy at 390, 820, 1280, 1440×900, and 1920px before motion.
6. Add only the approved causal motion, then run author QA and independent finish review.

## Acceptance criteria

1. The full visible journey advances from Home to Gate C without direct URL entry or prompt expertise, and every stage gives a back, cancel, or reset path where consequential.
2. One fixed 210px desktop rail, one route order, one route/status strip, semantic color meanings, and one bottom-center Oracle composer appear on all primary routes.
3. Home, Projects, and Results remain comprehensible without graph literacy; every graph has a synchronized accessible list and evidence-backed relationships.
4. Oracle asks relevant unanswered questions one at a time, exposes removable context, and cannot silently approve or mutate production.
5. Configuration and Playground changes remain drafts until an explicit, hash-bound proposal applies them; material changes invalidate affected approval records.
6. Every UI state distinguishes empty, loading, stale, failed, offline, blocked, draft, demo, unknown, unverified, approved, live, and complete where applicable.
7. The 28px display maximum matches the selected Instrument doctrine; no design-system field is undecided at implementation start.
8. Desktop, 390px mobile, keyboard-only, 200% text, reduced motion, runtime health, and likely performance risks are verified before Gate C; no decorative media is required.
9. Gate C is not reported complete without artifact, provenance, QA, independent review, limitations, and real user review evidence.
10. Agents and Settings provide the stated data, state, primary-action, and mobile contracts; reminders/notifications remain quiet unless actionable or user-created.
11. Convenium.Design identity and textual environment status remain fixed and honest across desktop and mobile shell states; a configured credential never implies verified live execution.
12. The existing 84-skill registry and the six-role Olympus workflow (Oracle, Design Director, Visual Analyst, Asset Producer, Design Engineer, Independent Critic, plus Analytics Specialist only when scoped) remain compatible. The director remains authoritative, specialists do not delegate, and author/critic work remains sequential.

## Research basis

No claim in this plan depends on a current external trend. The binding evidence is local: `PRODUCT-ARCHITECTURE.md`, `CONTINUOUS-UI-CONTRACT.md`, and the numbered routing reference.

## Visual correction after user rejection — committed before UI edit

Restore canonical05/09/10 composition: same210px rail; labelled Lucide icons; warm workspace; Barlow body16px and Barlow Condensed headings40px/700; IBM Plex Mono state/evidence labels13px. Self-host fonts with OFL source records. Use role rows with ordinal, icon/name, responsibility, activation, skill summary; selected row has a restrained semantic tint and right inspector. Keep functional editing controls and draft mediation unchanged. Inspector20rem. Heading40px is an explicit exception to doctrine28px: supplied Configure screenshot and user rejection show the previous compact ramp erased the required editorial hierarchy. Narrow heading32px; body remains16px. No marketing hero.

System/Knowledge are supporting routes already; their desktop canvas is visible on entry with inspector alongside and synchronized readable list below. Graph is optional at <820px and list remains first. No fake execution states or edges. Local semantic colors preserved. Shared spacing/radii/motion tokens unchanged. Verify actual loaded font faces,9rail SVGs,6role SVGs,role metadata,canvas discovery; retain full journey and accessibility thresholds.
