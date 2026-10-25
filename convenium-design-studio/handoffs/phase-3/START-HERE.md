# Convenium.Design Studio — resume after Phase 2

Read this file and `STATE.json` completely before inspecting or changing code. Then read the source documents listed under **Required context**. Treat this handoff as the durable boundary for a fresh Codex chat; do not assume access to the earlier conversation.

## Current status

- Work is intentionally paused after Phase 2.
- Phase 1 foundation is complete: three design-system skills were created and registered.
- Phase 2 is complete: the product model and three information-architecture directions were documented.
- The Knowledge catalog defect is fixed and verified at 22 enabled skills.
- Phase 3 has not been approved and must not start until the user chooses IA direction A, B, or C and explicitly approves Phase 3.

## Product intent

Convenium.Design Studio is a taste-first, gamified creative-work system for people who may have strong visual taste but little development knowledge. Oracle is the conversational guide. Users create projects, express visual taste, maintain reusable Style Profiles (Creative DNA), choose missions, configure suggested squads, browse truthful agent identities and proven work, run missions, and save effective setups as playbooks. Advanced controls are progressively disclosed. Rewards must reinforce meaningful creative agency rather than arbitrary activity or spend.

## Required context

Read these files in order:

1. `D:/Analyst_Designer/Convenium.Design/convenium-design-studio/handoffs/phase-3/STATE.json`
2. `D:/Analyst_Designer/Convenium.Design/convenium-design-studio/PHASE-2-PRODUCT-MODEL.md`
3. `D:/Analyst_Designer/skills/taste-first-experience-design/SKILL.md`
4. `D:/Analyst_Designer/skills/ethical-gamification-systems/SKILL.md`
5. `D:/Analyst_Designer/skills/agent-identity-and-portfolio/SKILL.md`
6. `D:/Analyst_Designer/Convenium.Design/convenium-design-studio/README.md`
7. Relevant implementation files only after the Phase 3 decision: `public/index.html`, `public/app.js`, `public/styles.css`, `knowledge.mjs`, `systems.mjs`, `agents.mjs`, and `events.mjs`.

Do not load unrelated test projects, media libraries, or every shared skill.

## Completed work

### Phase 1 — foundation

- Created the three local skills named above, each with `agents/openai.yaml` metadata.
- Registered them as built-in Convenium.Design knowledge capabilities in `skills.mjs`.
- Initialized their Convenium.Design knowledge README entries.
- Recorded run `convenium-design-studio-foundation-20260811-codex`.

### Phase 2 — product model and catalog repair

- Defined canonical entities, ownership, versioning, snapshot rules, evidence states, lifecycle, and progressive disclosure in `PHASE-2-PRODUCT-MODEL.md`.
- Documented three structurally different IA directions:
  - **A — Oracle-first journey**: recommended.
  - **B — Studio desk**.
  - **C — Mission map**.
- Fixed stale built-in catalog loading for the documented local workflow:
  - `npm start` now runs Node watch mode.
  - `npm run start:once` provides a fixed-process option.
  - `/api/health` reports loaded and enabled skill counts.
- Verified desktop and 390×844 mobile Knowledge views at 22 skills with no browser warnings/errors.
- Recorded run `convenium-design-studio-phase2-20260811-codex`.

## Decision gate

Before Phase 3, ask the user to choose one:

- **A — Oracle-first journey (recommended):** `Home · Projects · Creative DNA · Missions · Agents · Playbooks`; Oracle remains persistent; advanced controls move under Studio settings.
- **B — Studio desk:** `Today · Create · Library · Team · Activity`.
- **C — Mission map:** `Base · Missions · Squad · Vault · Chronicle`.

If the user already includes a choice and explicit Phase 3 approval in the new-chat prompt, record it and proceed. Otherwise stop after asking for the decision. Do not infer approval from this handoff.

## Phase 3 intended scope

After approval, define the critical UX flows and Oracle content for the selected IA:

- project entry and first mission;
- taste elicitation and Style Profile creation/editing;
- mission setup and plain-language constraints;
- suggested squad review and configuration;
- run approval, progress, spend/status truth, and artifact review;
- playbook save/reuse;
- marketplace agent identity and evidence inspection.

Produce flow maps, state/error/empty/loading behavior, Oracle decision copy, and a bounded implementation recommendation. Do not begin the broader visual redesign or production implementation unless the user separately approves the next phase.

## Constraints to preserve

- Preserve existing files, framework, conventions, and unrelated user changes.
- Keep work narrow because weekly usage is constrained.
- Do not install external skills, plugins, dependencies, or MCP connections.
- Do not fabricate token usage, analytics, research, portfolio proof, or agent achievements.
- Keep cost, approvals, evidence state, external data transmission, and destructive consequences visible.
- Use adjacent skills only when their activation conditions are met; do not invoke the entire catalog.
- Keep later phases approval-gated.

## Environment and verification

Workspace: `D:/Analyst_Designer`

Convenium.Design Studio: `D:/Analyst_Designer/Convenium.Design/convenium-design-studio`

Start or resume the local app:

```powershell
cd D:\Analyst_Designer\Convenium.Design\convenium-design-studio
npm.cmd start
```

Open `http://127.0.0.1:4173`.

Validate before new implementation:

```powershell
npm.cmd run check
Invoke-RestMethod http://127.0.0.1:4173/api/health
```

Expected health: `ok: true`, `skillCount: 22`, `enabledSkillCount: 22`.

If port 4173 is already active, query health before starting another process. Do not create duplicate servers.

## Evidence and telemetry

- Desktop proof: `evidence/phase2-knowledge-desktop.png`
- Mobile proof: `evidence/phase2-knowledge-mobile.png`
- Exact historical Codex token usage was unavailable and was not estimated.
- Convenium.Design supports future phase token reporting through explicit event data; absent usage must remain “Tokens not reported,” not zero.

## Handoff completion condition

This handoff is complete when a fresh chat can read the listed files, reproduce health at 22 skills, identify the unresolved IA decision, and avoid starting Phase 3 without explicit approval.
