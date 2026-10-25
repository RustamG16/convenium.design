# Convenium.Design Studio Phase 2 — Product model and information architecture

## Status and boundary

Phase 2 defines the durable product objects and candidate navigation structures. It does not authorize the broader UI build. The Knowledge count defect is a direct repair and is tracked separately from the proposed product structure.

## Product promise

Convenium.Design Studio helps a person turn visual taste into finished creative work without requiring development vocabulary. Oracle guides decisions, Creative DNA preserves reusable taste, a mission scopes the work, a configurable squad performs it, and proven configurations can become playbooks.

## Canonical objects

| Object | Purpose | Owns | Does not own |
|---|---|---|---|
| Project | Durable container for a creative outcome | brief, audience, constraints, members, linked assets | global agent definitions or marketplace proof |
| Style Profile | Named, reusable Creative DNA | explicit preferences, avoid-list, reference decisions, confidence, provenance, versions | a single mission's execution settings |
| Reference Decision | Evidence behind a taste choice | source, rights/provenance, keep/reject rationale, affected dimensions | inferred universal taste |
| Mission | Bounded creative contract | outcome, deliverable, project, selected profile version, budget ceiling, approvals, definition of done | permanent agent identity |
| Squad Configuration | Mission-specific working recipe | selected agent versions, roles, active inventory, budgets, approvals, order | marketplace-wide claims |
| Agent Definition | Stable marketplace identity | role, identity bible, capability limits, inventory catalog, availability rules | proof that a particular run succeeded |
| Agent Configuration | Versioned operational setup | active skills/tools, instructions, model/runtime when material, permissions | stable persona or avatar anchors |
| Run | Immutable execution trace | mission and configuration snapshots, stages, events, usage provenance, statuses | editable source definitions |
| Artifact | Inspectable output from a run | file/preview, provenance, contributors, verification state | unsupported outcome claims |
| Portfolio Entry | Evidence-backed presentation | artifact links, agent role, constraints, outcome evidence, verification label | fabricated clients, metrics, or authorship |
| Playbook | Reusable setup proven useful | mission template, profile reference, squad/configuration versions, evidence links, change history | a guarantee of future results |
| Progress Record | Meaningful mastery or collection evidence | milestone, supporting artifact, evidence state, user reflection | spend-driven rank or unverifiable status |

## Identity and snapshot rules

- Use stable IDs plus human-editable names.
- Version Style Profiles, Agent Configurations, and Playbooks.
- Snapshot the selected versions into every Run so history cannot be rewritten by later edits.
- Keep user-stated, inferred, simulated, estimated, verified, and unavailable states distinct.
- Store a budget ceiling separately from actual usage. Missing actual usage remains unavailable, never zero.
- Attribute multi-agent and human-guided artifacts to all recorded contributors.

## Core lifecycle

1. Create or open a Project.
2. Ask Oracle for the smallest next creative decision.
3. Create, select, or revise a Style Profile from explicit preference evidence.
4. Create a Mission with outcome, constraints, budget, and approval boundaries.
5. Accept or edit a suggested Squad Configuration.
6. Snapshot the mission, profile, agents, and inventory into a Run.
7. Review stages, spend, approvals, and artifacts.
8. Accept the output, revise the mission, or retry with an explicit cost decision.
9. Save a useful setup as a Playbook and attach inspectable evidence.
10. Update Creative DNA only with the user's confirmation.

## Progressive disclosure

### Start

Show Project, desired outcome, Style Profile, references, recommended squad, budget ceiling, and the next approval.

### Adjust

Show plain-language creative levers, agent substitutions, stage scope, output variants, and lower-cost paths.

### Advanced

Show exact skills, tools, plugins, models, runtime instructions, token allocations, event traces, and architecture controls.

Cost, permissions, external transmission, destructive consequences, and evidence state remain visible at every layer.

## Three information-architecture directions

### A. Oracle-first journey — recommended

Primary navigation: **Home · Projects · Creative DNA · Missions · Agents · Playbooks**. Oracle is persistent context rather than a separate destination. Runs live inside Missions and advanced system tools live under Studio settings.

Why: matches the novice user's mental model, keeps one next decision visible, and moves architecture controls out of the primary creative path.

Tradeoff: expert operators need one extra step to reach raw systems, skills, and playground controls.

### B. Studio desk

Primary navigation: **Today · Create · Library · Team · Activity**. Creative DNA, agents, assets, playbooks, and runs are grouped into Library or Team.

Why: compact and familiar for returning users managing many active projects.

Tradeoff: important Convenium.Design-specific objects become less visible and category boundaries can feel ambiguous.

### C. Mission map

Primary navigation: **Base · Missions · Squad · Vault · Chronicle**. The experience foregrounds progression and collection.

Why: strongest playful identity and a clear sense of journey.

Tradeoff: metaphor raises learning cost and risks making serious controls, cost, and verification feel game-like.

## Recommendation and decision gate

Use **A. Oracle-first journey** as the Phase 3 starting structure. Retain the current **Architecture · Systems · Knowledge · Playground** surfaces under an explicitly advanced **Studio settings** area instead of deleting them. Keep **Runs** contextual to a Mission, with a global activity view available to advanced users.

Do not implement this structure until the user approves direction A, B, or C.

## Phase 3 acceptance questions

- Can a first-time user begin a mission without understanding agents, models, or skills?
- Can an expert inspect and change the exact configuration before execution?
- Is Creative DNA clearly reusable, editable, versioned, and user-owned?
- Can every portfolio or progression claim reach inspectable evidence?
- Are budget ceilings, actual usage, and unavailable telemetry visually distinct?
- Can users pause, exit, retry, or reduce scope without punishment or automatic spend?

## Measurement recommendation

Do not add analytics in Phase 2. For a later approved implementation, consider: mission setup completed, Style Profile reused, squad recommendation edited, approval declined, budget reduced, playbook saved, playbook reused, and status label inspected. Pair completion signals with budget-overrun and regretful-retry guardrails. Never invent a baseline.

## Asset statement

No new media is required to validate this product model or repair the Knowledge count. Avatar and marketplace media requirements belong to the selected Phase 3/4 flows and must follow the agent identity evidence rules.
