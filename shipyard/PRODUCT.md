# PRODUCT — Convenium Shipyard

## One line

A game-shaped editor for Convenium.Design workflows: build a ship, recruit and equip a crew
with skill artifacts, plan the voyage, pass pre-flight, and export a run plan the real
pipeline accepts.

## Who it is for

- **The owner (primary).** Runs Convenium.Design on client projects; wants to see and change
  which agent carries which skill without editing JSON and Markdown by hand, and to keep
  several proven crews ("ships") for different job types (full run, retrofit, fleet, brand only).
- **A collaborator (secondary).** Opens a shared `ship.json` to understand how a run will go.
  Single-user tool: no accounts, no leaderboard, no server.

## The job

"Before a run, I want to pick the right crew and skills for this kind of job, check it against
the system's rules, and hand the session a plan — and I want doing that to feel like fitting
out a ship, not filling in a form."

## Target behaviour (gamified-ui, decision 1)

**The owner exports a ship whose run plan passes `verify.py --plan` and later imports that
run's `run.json` into the logbook.** Everything in the game layer points at this; nothing
rewards opening the app, browsing or clicking.

## Principles

1. **The library is the truth.** Agents, skills, routing, workflows and rules are read from
   the generated knowledge base. The game changes characters and presentation and composes
   plans; it never claims a capability the registry does not have.
2. **Every number is earned.** Readiness = rule checks passed. Discovery = artifacts inspected.
   Commissions = verified firsts. Each carries a truth label (Verified / Simulated /
   User-reported / Unavailable).
3. **Editable everywhere, reversible always.** Every edit has undo; the default ship can be
   restored in one action; no edit is ever destructive to `library/`.
4. **One active body per stage.** A crew member may carry up to nine artifacts, but each stage
   lights exactly one — the system's one-skill-per-phase rule made visible.
5. **The scene is optional.** Every task works in the DOM view without WebGL or with reduced
   motion; the 3D walk is a delight layer.

## Non-goals

- Running agents or calling models from the app (it exports plans; Claude Code runs them).
- Writing to `library/` directly. Proposals (a new agent, an artifact override) are exported
  as drafts for a reviewed commit.
- Accounts, cloud sync, sharing links, monetisation, XP shops, streaks, timers.

## Success / guardrails (no invented baselines)

- Outcome: ships exported with a clean pre-flight; logbook entries with a `run.json` imported.
- Guardrails: a pre-flight that blocks a valid plan (false positive) is a bug; an export that
  `verify.py --plan` rejects is a bug; any reward for non-outcome activity is a design defect.
