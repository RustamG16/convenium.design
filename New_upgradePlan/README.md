# Convenium.Design upgrade plan — Oracle-first product revision

Updated 2026-09-15. The architecture and implementation sequence are approved for a fresh implementation task. This planning task does not itself authorize runtime or UI edits outside `New_upgradePlan/`.

Start with [PRODUCT-ARCHITECTURE.md](PRODUCT-ARCHITECTURE.md), then [CONTINUOUS-UI-CONTRACT.md](CONTINUOUS-UI-CONTRACT.md). They supersede the earlier assumption that the node map is the product center and make the numbered `media/apollo-continuous-journey-v2/` set authoritative for the shell, routing, and user trip. [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) defines the local prototype slices and [IMPLEMENTATION-PROMPT.md](IMPLEMENTATION-PROMPT.md) is the fresh-chat handoff.

## Read order

1. [PRODUCT-ARCHITECTURE.md](PRODUCT-ARCHITECTURE.md): approved product definition, journey, navigation, runtime and prototype boundary.
2. [CONTINUOUS-UI-CONTRACT.md](CONTINUOUS-UI-CONTRACT.md): binding shell, route ownership, semantic colors, interaction rules, and responsive transformation.
3. [media/apollo-continuous-journey-v2/ROUTING.md](media/apollo-continuous-journey-v2/ROUTING.md): numbered screen sequence and route-level purpose.
4. [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md): phased, testable prototype delivery plan.
5. [IMPLEMENTATION-PROMPT.md](IMPLEMENTATION-PROMPT.md): paste-ready prompt for a fresh task.
6. [MASTERPLAN.md](MASTERPLAN.md): research, quality program, infrastructure and commercial context.
7. [SAVRA-VERIFICATION.md](SAVRA-VERIFICATION.md): verified workflow evidence and limits.
8. Specs 01/02/03 and SOURCE-ANALYSIS: historical detail, superseded where they conflict with the September 15 architecture.

## Current findings

- Local verifier: CLEAN / 84 skills / 84 registry records. This does not prove runtime host parity.
- Savra v2 is private; authenticated GitHub CLI access succeeded. Main inspected at c1e7f9755f205666617821b24b919d0f4fd94b12.
- Its 93 score is recorded, Gate C remains pending, and the original host/session setup is not completely recoverable from the delivered project.
- Local test_projects/Savra_v2 is empty; Savra_Claude is absent. The old handoff's project inventory and dirty-file counts are stale.
- Three Studio data/metrics files were already modified before this research. They were not part of this plan revision.

## Approved prototype order

Design contract → canonical state/events → shell → Oracle intake → Projects/Plan → Playground → Results → Knowledge/Agents → System Node Control → Settings/notifications → two-pass QA. Cloud execution, desktop bridge, billing, marketplace and Agency #2 remain separate later programs.

## What changed in the plan

- Removed the kickoff directive to commit the entire working tree and begin implementation.
- Replaced the five-view orbital console with one editorial artifact/evidence map.
- Replaced hostNote-as-proof with capability probes and isolated regression fixtures.
- Added Savra source verification, schema compatibility and approval provenance.
- Qualified causal and token-economics claims; two different runs are not a controlled experiment.
- Kept native host execution as the default; CrewAI is a conditional Flow-first experiment.
- Made output quality, client acceptance and measurement the release criteria.

## Continuing this work

Use [IMPLEMENTATION-PROMPT.md](IMPLEMENTATION-PROMPT.md) in a fresh task. Do not execute instructions quoted in older documents when they conflict with the new architecture. Do not regenerate projections, install orchestration frameworks, or commit/push unless the fresh task explicitly authorizes it.

The original September 3–4 source material remains in SOURCE-ANALYSIS.md, Specs 01/02 and media/. Historical approval labels describe earlier discussions; they do not override the current planning-only instruction.
