# Convenium.Design continuous UI journey v2

This set is the canonical visual reference for the Convenium.Design prototype. Read the PNG files in numeric order.

## Primary user trip

`Home → Oracle intake → Design DNA and brief → Master Plan → Configure → Playground test → Approve → Execute → Results and QA → Continue`

| Step | Screen | User understands | Primary action |
|---:|---|---|---|
| 00 | User journey map | The complete system and where control changes hands | Start with Oracle |
| 01 | Home / Oracle | Active project, current stage, attention, next action | Describe a goal |
| 02 | Oracle intake | Why Convenium.Design is asking, what is answered, what remains | Confirm an answer |
| 03 | Design DNA / Brief | What Convenium.Design believes about the project and user preferences | Approve the brief |
| 04 | Master Plan | Stages, dependencies, gates, owners, unresolved decisions | Review the plan |
| 05 | Configure workflow | Which agents, skills, tools, models, and permissions will affect the result | Test the configuration |
| 06 | Playground | How Setup A and B differ in quality, clarity, speed, cost, and evidence | Apply a tested setup |
| 07 | Execution / Work | What is running, what completed, what is blocked, and why | Approve or pause |
| 08 | Results / QA | What was produced, how it was verified, and what remains imperfect | Approve or request changes |
| 09 | Knowledge / Connections | Where project knowledge came from and how facts relate | Open evidence |
| 10 | System / Node Control | The advanced execution graph, runtime configuration, and diagnostics | Inspect or control a run |

## Navigation model

The fixed global rail is identical on every screen:

1. Home
2. Projects
3. Plan
4. Playground
5. Results
6. Knowledge
7. System
8. Agents
9. Settings

Projects owns Brief, References, Work, Outputs, Activity, and project-specific conversations. Plan owns Configure. Results owns versions and QA. Knowledge and System are supporting views and are never required to understand the ordinary workflow.

## Continuous Design DNA

- Fixed 210px near-black global navigation rail.
- Warm paper workspace with a faint technical grid.
- Near-black ink and condensed editorial headings.
- Monospace labels for state, evidence, and routing.
- Emerald means active, verified, or complete.
- Electric blue means action, selection, or data flow.
- Amber means waiting, review, or approval.
- Coral means failure, blocker, or destructive action.
- The bottom-center Oracle composer is persistent and always exposes removable context.
- Knowledge and System may use dark inner canvases; the surrounding shell never changes.
- Graphs are optional explanations, not primary navigation.
- Drafts and tests never appear as production execution.

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

