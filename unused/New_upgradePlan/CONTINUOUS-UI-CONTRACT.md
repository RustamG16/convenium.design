# Convenium.Design continuous UI contract

Updated 2026-09-15. This contract supersedes the navigation, color, and route treatment shown in earlier isolated mockups. The canonical visual references are the numbered files under `media/apollo-continuous-journey-v2/`.

## Product journey

The primary path is linear and understandable:

`Home → Oracle intake → Design DNA and brief → Master Plan → Configure → Playground test → Approve → Execute → Results and QA → Continue`

Knowledge, System, Agents, and Settings are supporting destinations. They are available throughout but never required to understand the normal project workflow.

## Global application shell

Every primary desktop view uses the same shell:

- Fixed 210px near-black left navigation rail.
- Convenium.Design identity and environment status remain in fixed positions.
- Navigation order never changes: Home, Projects, Plan, Playground, Results, Knowledge, System, Agents, Settings.
- Exactly one navigation item is active and uses emerald.
- A fixed route/status strip shows `Projects / {project} / {view}` and Oracle availability.
- The main workspace uses warm paper `#F7F7F2` and near-black ink.
- A bottom-center Oracle composer uses identical geometry and interaction logic across views.
- Oracle shows removable context tokens for project, view, selection, draft/run, blocker, and attached source.

Knowledge and System may place a near-black technical canvas inside the paper workspace. This is an inner work surface—not a theme or shell change.

## Semantic color contract

- `#050506`: navigation and deep technical canvas.
- `#F7F7F2`: application workspace.
- `#57C98A`: active, verified, complete, approved.
- `#5FA8F5`: action, selection, link, active data flow.
- `#E0A64B`: pending, waiting, review, approval required.
- `#F0757F`: error, blocker, destructive action.

Color meaning may not change by route.

## Route ownership

| Global route | Owns | Does not own |
|---|---|---|
| Home | Attention, active project, current stage, next action | Detailed project configuration |
| Projects | Overview, Intake, Brief, References, Work, Outputs, Activity | Global runtime diagnostics |
| Plan | Master Plan and Configure | Execution results |
| Playground | Draft configurations, isolated tests, A/B comparison | Production mutation without approval |
| Results | Artifacts, versions, evidence, QA, Gate C | Agent configuration |
| Knowledge | Search, collections, Design DNA, sources, connections | Runtime control |
| System | Run trace, architecture, graph/list, permissions, budgets, diagnostics | Ordinary onboarding |
| Agents | Profiles, roles, activation, skills, tools, evidence, specialist conversation | Plan authority |
| Settings | Models, environments, integrations, notifications, privacy, accessibility | Project content |

## Route examples

- `Projects / Northstar / Home`
- `Projects / Northstar / Intake`
- `Projects / Northstar / Brief`
- `Projects / Northstar / Plan`
- `Projects / Northstar / Plan / Configure`
- `Projects / Northstar / Playground`
- `Projects / Northstar / Work / Run 0248`
- `Projects / Northstar / Results / Run 0248`
- `Projects / Northstar / Knowledge / Connections`
- `Projects / Northstar / System / Run 0248`

## Screen sequence and purpose

1. `00-user-journey-map.png`: overview of the complete experience.
2. `01-home-oracle.png`: project, stage, attention, and next action.
3. `02-oracle-intake.png`: one-question-at-a-time guided discovery.
4. `03-design-dna-brief.png`: editable understanding before planning.
5. `04-master-plan.png`: stages, owners, dependencies, and gates.
6. `05-configure-workflow.png`: visible agents, skills, tools, models, permissions, and effects.
7. `06-playground-compare.png`: isolated A/B testing and cause/effect comparison.
8. `07-execution-work.png`: bounded task execution, progress, evidence, and approvals.
9. `08-results-review.png`: output preview, provenance, QA, limitations, and Gate C.
10. `09-knowledge-connections.png`: searchable evidence with optional typed graph.
11. `10-system-node-control.png`: advanced run graph and control inspector.

## Interaction rules

- The primary action is visually unique on every screen.
- The next mandatory step is always stated in plain language.
- Draft, test, demo, blocked, live, approved, and complete are distinct states.
- Configuration changes remain drafts until explicitly applied to Plan.
- Material changes invalidate downstream approval hashes.
- Implementation remains locked until Brief and Plan approvals exist.
- Graphs always have synchronized list equivalents.
- Back, cancel, reset, and undo are available wherever a user can create consequential change.
- Motion communicates selection, activation, comparison, progress, data flow, or completion and respects reduced motion.

## Responsive transformation

At widths below 820px, the global rail becomes a compact drawer triggered from the fixed route strip. The current route, stage, next action, and Oracle composer remain visible without opening the drawer. Graph screens default to List mode on mobile; the graph is optional and horizontally pannable only after explicit activation.

## Implementation acceptance

The UI fails this contract if two routes appear to belong to different products, the navigation changes order, color meaning changes, the current location is unclear, the next action is ambiguous, the Oracle obscures essential controls, or the main journey requires graph literacy.

