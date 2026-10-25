# Convenium.Design product architecture — Oracle-first design agency

Updated 2026-09-15. This document supersedes the earlier assumption that an editorial node map is Convenium.Design's primary product surface. It records the direction approved through the September 15 product discussion.

## Product definition

Convenium.Design is a proactive, adjustable design-agency operating system. It takes the task-first simplicity of Manus as its category archetype, then adds what general agent products hide: structured intake, Design DNA, an editable master plan, visible agent/skill/tool routing, safe experiments, approval gates, evidence, and model choice at the final implementation stage.

The prototype remains local-first and low-cost. The eventual product supports the same project and run contract in managed cloud and through a local desktop bridge.

## Primary audience and promise

The first audience is a technically comfortable founder, designer, developer, or small agency operator who wants to turn an idea into a designed and implemented digital product without learning prompt engineering.

Convenium.Design's promise:

> Explain the goal in ordinary language. Oracle asks what matters, Convenium.Design proposes a complete design workflow, and the user can understand, test, change, approve, and execute it from one place.

The success test is not “the graph looks advanced.” A first-time user must be able to say, within five seconds: what project is active, what Convenium.Design is doing, what needs attention, and what action is next.

## Product principles

1. **Oracle is the only front door.** Users begin with a conversation, not a skill picker or graph.
2. **Questions replace prompt engineering.** Oracle asks one high-value question at a time, uses selectable responses where useful, never repeats answered questions, and explains why sensitive or consequential information matters.
3. **One source of project truth.** The approved intake produces the six root context files plus the Olympus run artifacts. UI state is a projection, not another authority.
4. **Automatic but inspectable.** The director recommends agents, skills, tools, models, constraints, and budgets with plain-language reasons and consequences.
5. **Draft before production.** Configuration changes are isolated until explicitly applied. Every meaningful mutation supports cancel, reset, or undo.
6. **Implementation is last.** Research, direction, planning, asset decisions, and design-system commitment precede model selection and execution.
7. **Complexity is progressive.** Ordinary work never requires understanding nodes. Graphs have list equivalents and live under System.
8. **Motion explains causality.** Animation shows selection, activation, progress, data flow, comparison, or completion; it never implies work that is not running.
9. **Psychology serves understanding.** Design DNA captures taste, risk tolerance, decision style, audience empathy, and working preferences. It must not pressure or covertly steer choices.
10. **Quality is evidenced.** Outputs carry source lineage, plan/design hashes, QA, reviewer identity, limitations, and approval state.

## Core user journey

1. **Arrive.** Oracle asks: “What is your goal? What do you want to build?” Voice, text, files, and choice cards are available.
2. **Discover.** Oracle classifies the project and runs the relevant project questionnaire. It builds or updates the user's durable Design DNA without re-asking stable preferences.
3. **Confirm.** The user reviews a plain-language brief: outcome, audience, primary action, constraints, references, assets, scope, risk, and missing decisions.
4. **Plan.** The Design Director creates the master plan and six-file project context, then proposes bounded agent tasks, skills, tools, gates, budget, environment, and evidence requirements.
5. **Configure.** The user reviews the proposal in Plan. Advanced controls reveal agent assignments, skills, MCPs/plugins, models, permissions, and fallbacks.
6. **Experiment.** Playground creates Setup A/B drafts, previews which capabilities change, runs isolated tests, compares quality/cost/time/evidence, and never changes production implicitly.
7. **Approve.** The user accepts the plan and design contract. Approval is bound to the artifact hash and becomes invalid if the approved artifact changes materially.
8. **Implement.** The user chooses the implementation model and local or cloud environment. Convenium.Design executes bounded tasks and exposes progress, blockers, decisions, and evidence.
9. **Review.** Results shows the artifact, versions, changes, desktop/mobile states, QA, independent review, provenance, and limitations.
10. **Continue.** Oracle recommends the next meaningful action and can create reminders or quiet notifications for blockers, approvals, completion, or scheduled follow-up.

## Information architecture

The binding shell, route ownership, visual language, and primary user trip are defined in `CONTINUOUS-UI-CONTRACT.md`. When an older example conflicts with that contract or the numbered `media/apollo-continuous-journey-v2/` sequence, the continuous contract and numbered sequence win.

### Home

Answers “What needs my attention?” Active project, current stage, next action, pending decisions, latest output, recent activity, and contextual Oracle composer.

### Projects

Project list and project workspace. Subviews: Overview, Brief, References, Plan, Work, Outputs, Activity. The project owns the questionnaire, Design DNA snapshot, six context files, Olympus artifacts, conversations, runs, and approvals.

### Plan

Human-readable master plan first; advanced configuration second. Shows stages, agent tasks, skills/tools, dependencies, gates, estimated cost/time when known, and every unresolved decision. The user can propose changes, but production does not start here.

### Playground

Safe configuration laboratory. Compare two setups, see which agents and skills change and why, run bounded tests, inspect output differences, reset drafts, and apply an approved setup back to Plan.

### Results

Artifact and evidence center. Shows previews, versions, before/after, inputs, producing agents, QA, independent finish review, accessibility/performance evidence, approval, export, and deployment status.

### Knowledge

Default view is search and understandable collections: project sources, reusable knowledge, skills, doctrines, Design DNA, and artifacts. Connections is an optional node view with provenance, freshness, host support, and a complete list equivalent.

### System

Advanced control and diagnosis. Default is a readable pipeline summary. Node Control exposes run trace, architecture, agents, skills, tools, hosts, permissions, budgets, failures, and why a capability activated. Draft changes route to Playground before application.

### Agents

Agent profiles explain identity, responsibility, activation condition, current tasks, skills, tools, evidence, history, and limitations. Users may talk to a specialist in project context, but Oracle remains the default coordinator and the director remains authoritative for the plan.

### Settings

Models, execution environments, integrations, MCPs/plugins, permissions, notifications, storage, privacy, billing/usage, accessibility, and defaults. Availability and unknown status are represented honestly.

## Persistent Oracle

Oracle is a bottom-center contextual composer on every product surface. It knows only the context shown in removable context tokens: project, page, selected object, active draft/run, filters, visible blocker, and explicitly attached sources.

Oracle can explain, ask, propose, navigate, schedule, and prepare changes. It cannot silently approve gates, mutate production, grant permissions, spend externally, publish, or deploy. Consequential actions always show a reviewable proposal.

Notifications are quiet by default. Notify on required input, approval, completion, failure, meaningful change, or a user-created reminder—not on unchanged progress.

## Runtime model

The durable contract is vendor-neutral:

- Oracle: intake, clarification, Design DNA, explanation, reminders.
- Design Director: interpretation, plan, routing, gates, integration.
- Visual Analyst: page/reference evidence.
- Asset Producer: approved media manifest and production.
- Design Engineer: selected plan implementation.
- Independent Critic: read-only scoring; never the builder.
- Analytics Specialist: measurement only when a goal and scope exist.
- Policy/state layer: deterministic approvals, permissions, budgets, schema validation, event log, idempotency, and capability probes.

The director recommends the smallest sufficient team. Specialists do not delegate. At most two independent read-only evidence workers run in parallel. The author and critic remain sequential.

## Visual and motion direction

The product structure follows Manus's task-first clarity. The distinctive expression comes from the approved reference folder and node-control screenshots: a technical grid, dark operational canvas, condensed typography, precise luminous connections, high-contrast status, and diagrammatic motion.

This language is applied selectively:

- Home and Projects: calm, comprehensible, output-led.
- Plan and Playground: structured, comparative, cause-and-effect.
- Results: media and evidence-led.
- Knowledge: searchable first, graph optional.
- System/Node Control: full cinematic network expression.

No graph is used merely as decoration. Every animated edge corresponds to a typed, evidenced relationship or active run event.

All routes share one continuous product shell. Knowledge and System may introduce a dark inner technical canvas, but may not change the global navigation, route strip, semantic colors, typography system, or Oracle dock.

## Prototype boundary

The first prototype is local and uses the existing Convenium.Design Studio stack. It proves the complete experience with deterministic fixture data and existing project artifacts; it does not pretend to be a production cloud service.

Included:

- Oracle-led intake and choice-card questionnaire.
- Project creation and six-file context preview.
- Editable master-plan proposal.
- Agent/skill/tool configuration with reasons.
- Playground Setup A/B comparison.
- Results/evidence view.
- Knowledge search plus connections mode.
- System Node Control and run trace.
- Persistent contextual Oracle.
- Honest demo/live states, notifications, reminders, responsive behavior, reduced motion, keyboard access, and list equivalents.

Deferred behind explicit later plans:

- Multi-tenant accounts and billing.
- Managed cloud execution and secure sandboxes.
- Local desktop bridge.
- Third-party marketplace.
- General-purpose non-design agencies.
- Unattended external publication or deployment.
- CrewAI or another orchestration vendor.

## Acceptance criteria

1. A new user can create a project and understand the next action without knowing Convenium.Design terminology.
2. Oracle asks only relevant unanswered questions and produces a reviewable brief.
3. The plan displays every agent, skill, tool, dependency, gate, and unresolved decision with a reason.
4. A user can compare two setups and understand how the change affects workflow and output.
5. No draft, test, unknown state, or simulation is presented as production execution.
6. Every graph has an accessible list equivalent and every relationship resolves to evidence.
7. Contextual chat accurately displays and allows removal of its context sources.
8. Desktop, 390px mobile, keyboard-only, 200% text, reduced-motion, empty, loading, stale, failed, offline, blocked, and approval states are verified.
9. The existing 84-skill registry and six-role Olympus workflow remain compatible.
10. The independent reviewer scores the implementation against the committed design contract; Gate C remains a real user review.
