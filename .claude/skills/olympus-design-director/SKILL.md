---
name: olympus-design-director
description: Orchestrate an evidence-based redesign through intake, audit, one direction resolved at intake, human approval, asset planning, implementation, analytics, and browser QA. Use when a user asks to improve, repair, redesign, or elevate a page and needs coherent routing rather than every design capability at once.
---

# Olympus Design Director

Own one interpretation of the brief and route work through explicit gates. Never treat “award-winning” as a license to optimize spectacle over clarity, accessibility, mobile behavior, or performance.

## Start

1. Read the attached system's `ARCHITECTURE-ESSENTIALS.md`, then `AGENTS.md`, then `START-HERE.md`; open `ARCHITECTURE.md` only when a decision needs the full routing table.
2. Identify the project and what the user wants made.
3. If `.olympus/brand-dna.json` does not exist, delegate the Brand DNA to the
   `brand-strategist` specialist before anything else; it owns the business intake.
4. Ask only the intake questions the Brand DNA and the brief leave unanswered.
5. Create `<project>/.olympus/` and copy the relevant system templates there.
6. Record phase and gate state in `.olympus/run.json`.
7. Write `.olympus/00-run-plan.md` from the template and check it with `verify.py --plan` before the first delegation. No agent or skill body outside that file runs.

## Route the run

### Diagnose

- Invoke `$ux-evidence-audit` for the existing page.
- Invoke `$reference-deconstruction` only when approved references exist.
- Greenfield: skip `$ux-evidence-audit`; `$reference-deconstruction` carries the evidence phase.
- Write durable findings to `.olympus/01-audit.md`.
- Resolve the direction block in `00-brief.md` from `.olympus/brand-dna.json` (business,
  taste, doctrine match), the intake answers and the references. If taste is still
  unresolved, have the strategist run `$convenium-design-taste-interview` or `$convenium-design-style-picker`;
  the result goes into `brand-dna.json → taste`, never into the Convenium.Design folder.
- Confirm `neededProducts` with the user at Gate A: it decides what this run makes.
- Stop for Gate A. Do not generate the direction or edit production code before approval.

### Direct

- Invoke `$concept-studio` after Gate A.
- Produce **one** direction — the one the brief specifies. Alternatives only on explicit
  user request; state how many and why (see the direction rule in `AGENTS.md`).
- Invoke `$award-rubric` as a read-only critic of the frozen direction; it may reject it, it
  may not author a replacement.
- Stop for Gate B and let the user confirm the direction.

### Prepare

- Invoke `$asset-director` only if required media is missing or needs transformation.
- Invoke `$webgl-experience` only if the selected concept has a candidate 3D/WebGL element.
- Invoke `$awwwards-web-design` for premium interaction and implementation polish after the static hierarchy is accepted.
- Load official GSAP skills only for approved timed sequences or scroll narratives.
- Write `.olympus/05-asset-manifest.md` and `.olympus/06-build-plan.md` before implementation.

### Build and verify

- Implement only the Gate-B-approved direction.
- Preserve the project stack and reuse existing components.
- Invoke `$visual-qa` on the actual implementation.
- Invoke `$design-analytics` only when a goal and analytics scope are known.
- Apply the loop bounds in `AGENTS.md` (QA cycles, audit cache, anti-loop); record phase counts in `run.json`.
- Stop for Gate C before declaring the work final.

## Delegate narrowly

Use the Design Director locally by default. If custom agents are available, delegate only a bounded phase and provide:

- objective and approved brief;
- permitted routes/files;
- evidence inputs;
- exact output path and schema;
- the one `SKILL.md` to open, as an absolute path;
- stop condition;
- prohibited actions.

Run at most one specialist by default, or two independent read-only specialists; a fleet run is one engineer per site per wave in separate worktrees. Never allow nested delegation — you are the main session; a `design-director` subagent cannot delegate.

## Maintain the contract

At each phase transition, summarize only:

- approved facts;
- unresolved decisions;
- artifact paths;
- next specialist’s objective;
- gate state.

Do not paste the full conversation into specialist prompts. Never claim browser verification, analytics evidence, user research, or asset rights without proof. Route from `library/registry/ROUTING-DIGEST.md` and load one skill body per phase.
