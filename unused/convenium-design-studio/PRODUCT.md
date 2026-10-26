# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Technically comfortable founders, designers, developers, and small-agency operators use Convenium.Design to turn an ordinary-language goal into a designed and implemented digital product without learning prompt engineering. Advanced operators inspect the routing, evidence, permissions, and configuration behind that workflow.

## Product Purpose

Convenium.Design Studio is a local-first, adjustable design-agency operating system. Success is a user understanding the active project, Convenium.Design's current work, required attention, and the next action within five seconds, then moving through a reviewable brief, plan, test, execution, and evidence-backed result.

## Positioning

Oracle is the only front door: it asks the useful unanswered question and proposes a reviewable workflow. Convenium.Design differs from a general agent chat by exposing an editable master plan, Design DNA, bounded specialists, safe configuration experiments, approval gates, and evidence without requiring graph literacy.

## Operating Context

The first release is a local, low-cost prototype in the existing Node/vanilla application. It uses deterministic fixtures and real local project artifacts where available. A shared web shell serves desktop and narrow/mobile web states; the critical mobile width is 390px. Local, demo, live, unverified, unavailable, and unknown runtime states are visibly distinct.

## Capabilities and Constraints

- The primary journey is Home → Oracle intake → Design DNA and brief → Master Plan → Configure → Playground test → Approve → Execute → Results and QA → Continue.
- Projects own Overview, Intake, Brief, References, Plan, Work, Outputs, and Activity; Plan owns Configure; Results owns artifacts, versions, QA, and Gate C.
- Oracle can explain, ask, propose, navigate, schedule, and prepare changes, but cannot silently approve gates, mutate production, grant permissions, spend externally, publish, or deploy.
- Playground tests drafts in isolation; configuration changes require explicit application to the approved plan. Material changes invalidate downstream approvals by artifact hash.
- The prototype preserves existing Node 20+ ESM, local `/api/*` behavior, protected data and knowledge, existing Lucide/GSAP bundles, and deterministic demo/live distinction.
- Excluded: React migration, CrewAI, WebGL, managed cloud execution, accounts/billing, marketplace, unattended publication, and deployment. Generated imagery is allowed only for the interface's own assets (preview heroes, the neural core, the Convenium.Design Totem guide), generated with Higgsfield and recorded in `.olympus/asset-sources/`.

## Brand Commitments

Convenium.Design is task-first, precise, local-first, and honest about what is simulated, live, unknown, or unavailable. Every primary screen shares a 210px near-black rail, a warm-paper workspace, a fixed route/status strip, semantic state color meanings, and a persistent bottom-center Oracle composer with removable context. Technical canvases may appear inside Knowledge and System but do not replace the shared shell.

## Evidence on Hand

- Binding product direction: `New_upgradePlan/PRODUCT-ARCHITECTURE.md`.
- Binding shell, semantic color, responsive, and route contract: `New_upgradePlan/CONTINUOUS-UI-CONTRACT.md`.
- Canonical reference sequence: `New_upgradePlan/media/apollo-continuous-journey-v2/ROUTING.md` and its numbered images.
- Existing local API/domain modules, project artifacts, skill registry, and browser harness.
- No approved analytics baseline, external font license, cloud execution proof, or media rights record beyond supplied local project assets; those facts must not be invented.

## Product Principles

1. Oracle makes the next meaningful action clear without hiding the rationale.
2. The approved plan and project artifacts are the source of truth; UI state is a projection.
3. Draft, test, and production execution are visibly and technically separated.
4. Advanced control is progressive disclosure; graphs explain evidence rather than navigate.
5. Every result is accompanied by provenance, verification, limitations, and approval state.

## Superseded: chat-first rebuild (2026-09-16)

*Superseded on 2026-10-03 by Journey v2 (below).* Convenium.Design's primary entry was a standalone or project chat. The Constructor is an optional project tool, never a prerequisite for ordinary work. Projects own shared knowledge, workflows, runs, and results; folders are one-level sidebar organization only. The default journey is New chat → goal → clarification → brief → approach → work → result → continued chat. Raw gates, budgets, routing, and diagnostics remain available under technical details, while the primary controls use plain language and preserve existing canonical IDs and hash-bound semantics.

## Journey v2 (2026-10-03, current)

The owner asked for the interface in the journey-v2 imagery, implemented screen for screen. The shell is the 210px-class near-black rail with nine destinations, a warm-paper workspace, a persistent Oracle dock and right-hand inspectors. On top of that come Operator-style brain-network views of agents and skills, and guided tutorials presented by a generated mascot, the Convenium.Design Totem.

- **Journey:** Home → Oracle intake (8 questions) → Brief and Design DNA → Master plan (5 stages over the 12-phase workflow) → Configure (swap slot skills, guardrails) → Playground (real deterministic compare) → Apply → Work (run approvals) → Results (Gate C).
- **Customisation:** agents and skills are customised in drafts (Configure, Agents). A draft becomes a non-active loadout so Playground can compare it. "Save/Apply to plan" activates it and writes agent guardrails, always after a confirmation.
- **Brain views:** System → Architecture (neural tree per stage), Agents (radial and neural brain), Knowledge (typed connections). Each graph has a list twin.
- **Tutorials:** six totem-guided tours run on the real screens. `npm run tutorials` replays them with Playwright and writes videos, screenshots and instruction pages to `public/tutorials/`.
- **Not included:** XP, points and achievements.

## Accessibility & Inclusion

Support keyboard-only operation, visible focus, familiar labels and recovery, 44px narrow targets, 200% text, reduced motion, no horizontal overflow at 390px, and accessible list equivalents for graph content. The Oracle dock must not hide essential controls.
