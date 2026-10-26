# AGENTS — Convenium.Design Studio Desktop

## Read order

Read `ARCHITECTURE-ESSENTIALS.md` first. Read `PRD.md` for product decisions, `ARCHITECTURE.md` for runtime/data work, and `PROGRESS-AND-DECISIONS.md` only for needed history. The Convenium.Design root `AGENTS.md` remains authoritative for redesign gates.

## Ownership and boundaries

Use bounded ownership and progressive disclosure. Protect existing business logic, API compatibility, `data/`, `knowledge/`, `public/media/`, credentials, local data, and unrelated uncommitted work. Write decision/evidence artifacts only in `.olympus/`. Do not silently replace legacy modules during migration; establish parity first. Do not alter media beyond approved manifest use.

## Evidence and safety

Do not invent user research, analytics, browser evidence, media provenance/rights, or credentials. Record uncertainty. Oracle can explain and draft but cannot mutate without a visible structured proposal and explicit approval. Never reveal secrets or bypass permission boundaries. Any new dependency, WebGL surface, external generation, or migration requires the approved Gate-B plan and documented fallback.

## Frontend quality

`DESIGN.md` is the specification of the one resolved visual world and is read in full before any frontend change. Its standing rules are not advisory: a 13px type floor, every `font-size` in `rem`, AA contrast, 36px desktop / 44px narrow targets, one type family and one accent, no literal colour/spacing/radius/duration/z-index in a rule, an empty state with one primary action per view, no decorative imagery, undo on every destructive action, no `!important`.

**The evidence standard is `scripts/ui-metrics.mjs`, not a markup detector and not a claim.** It boots the app, walks all eight views at 1280x800, 1440x900 and 1920x1080 and reads computed styles. A markup-pattern detector reported this interface clean while 165 text nodes failed contrast and 289 controls were under the stated minimum; that class of tool is not accepted as evidence for a frontend change. Record the T1-T11 numbers before and after every slice in `PROGRESS-AND-DECISIONS.md`. No slice may regress a threshold, and a slice that fails verification is repaired inside that slice rather than carried forward.

Continue to apply accessible primitives, familiar Windows-appropriate patterns, labels, visible focus, error recovery, keyboard paths, reduced motion/transparency, and purposeful non-decorative motion.

## Verification

Run `npm.cmd run check` — which now runs the syntax checks and `scripts/ui-metrics.mjs --check`, failing the build on any threshold regression — plus project-context validation, relevant API checks, desktop/narrow visual checks, keyboard primary flow, reduced-motion behavior, and console/runtime checks before handoff.

Gates A/B/C govern client website projects. Work on Convenium.Design Studio itself has no human approval gates; its exit gates are the self-verified measurements in `LOADOUT-PLAN.md` section 06.
