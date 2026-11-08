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

- ~~Running agents or calling models from the app.~~ **Amended in v2 (owner, 2026-11-08):** a
  *live trial* may run headless Claude Code on the **dev server only**, on a scratch copy of a
  fixture project, after an explicit confirmation of its estimate. The deployed build still runs
  nothing.
- ~~Writing to `library/` directly.~~ **Amended in v2:** the **dev server's** Forge may write
  allow-listed `library/` files, then runs `project.py all` + `verify.py` and rolls back on
  failure. It never commits. The deployed build stays read-only.
- Accounts, cloud sync, sharing links, monetisation, XP shops, streaks, timers.

## Success / guardrails (no invented baselines)

- Outcome: ships exported with a clean pre-flight; logbook entries with a `run.json` imported.
- Guardrails: a pre-flight that blocks a valid plan (false positive) is a bug; an export that
  `verify.py --plan` rejects is a bug; any reward for non-outcome activity is a design defect.


---

## v2 — Live library, Forge, trials, Regatta (owner, 2026-11-08)

### Why

The critic scored v1 79/100, and three gaps stop it being the owner's daily tool:

- **The UI is frozen at build time.** A skill or agent added to `library/` does not appear until
  someone regenerates and reloads, and a new workflow can silently vanish.
- **Agents cannot be customized.** Only their costume can.
- **Nothing tells the owner which crew is better for a job.**

### What v2 adds

1. **Live library.**
   - When `library/` changes (by the owner, or by Claude at the owner's request) and the KB is
     regenerated, the open dev UI updates without a reload.
   - A new skill, agent, doctrine or workflow appears in the Armory, on the Bridge or in the
     Hangar with no code change.
   - A workflow that cannot become a ship is shown in dry dock with its problems, never dropped.
2. **Forge** (dev server). Create and edit agents, skills and workflows as forms:
   - agents: model tier, access, routes, phase, priority, persona;
   - each change gives a diff preview, then Apply, then a regenerate-and-verify log.

   Each change is a reviewable git diff.
3. **Variants.** A ship can override an agent's model, skill or prompt addendum for itself only.
   "Fork as variant" makes ship B; "Promote to library" sends a variant to the Forge.
4. **Trials.**
   - **Dry trials** simulate a ship against a test brief, instantly and deterministically
     (label: Simulated).
   - **Live trials** run the exported plan with headless Claude Code on a fixture project and
     import `run.json`, `verify.py --plan` and a critic score. Labels: Verified for the run
     facts, Model-judged for the critic's number.
5. **Regatta.** Two to four ships race the same brief:
   - per-criterion scores, the better value marked, an overall winner, ties shown as ties;
   - **ratings and a leaderboard** per brief and overall.
6. **Game and 3D.**
   - a trial arena where ships race a course of stage and gate buoys;
   - a Forge workbench;
   - bodies for new agents and a fixed hull roster, made with three.js/R3F plus paid Higgsfield
     assets **approved one at a time against a recorded cost**.

### Ethics gate, v2 (replaces 06 § 7.6 where they differ)

- **Now allowed:** ranking ships, a winner per regatta, ratings and a leaderboard.
  - Ratings come **only from trial records** (outcomes), never from clicks, visits or time spent.
  - A rating is the mean of the last three **Verified** scores per ship and brief.
  - Simulated scores are shown in their own column and never mixed in.
- **Unchanged:**
  - no XP or levels, streaks, countdowns or expiry;
  - no random or paid rewards, and no locked basics;
  - every edit reversible;
  - celebrations only on outcomes, and once;
  - sound off by default.
- **Every number carries one truth label:** Verified, Simulated, Estimate, Model-judged,
  User-reported or Unavailable.
- **A trial's duration is a measured fact, not a timer.** Nothing counts down at the user.

### Non-goals (v2)

- No accounts, cloud, or sharing service. The leaderboard is local to this browser plus the
  dev server's `shipyard/trials/` folder.
- No Elo or matchmaking.
- No automatic commits.
- No regeneration on file save. Regeneration is an explicit Rebuild, so it never races Claude.
- No Spline and no generated video (see ARCHITECTURE v2).

### Adversarial pass (what breaks, edge cases, what is over-engineered)

**What breaks:**

| Risk | Answer |
|---|---|
| **Live runner** on Windows: process trees, headless auth and permission prompts, variance between runs, cost | A fake CLI in tests; one trial at a time; caps on turns and wall clock; a scratch folder outside the repo; typed confirmation of the estimate; permission bypass flags never used |
| **Forge racing a concurrent Claude edit** of the same file | Hash preconditions, a mutex, and refusing files that are dirty in git |
| **Rollback** | Restore the bytes, then regenerate |
| **Governance change:** `verify.py`'s fixed agent list becomes "every agent file has exactly one `crew.json` member" | Approved by the owner with the plan, 2026-11-08 |
| **Higgsfield rigs** may not fit the existing clips | Prototype one body before approving more |

**Edge cases:**

- id collisions and CRLF line endings;
- the KB fetched mid-write (keep the last good index);
- a deleted agent still aboard a ship (shown as retired);
- a ninth crew station in the 2D console;
- undo across a KB reload;
- trial records that go stale after a library edit (flagged stale by hash);
- the deployed build calling `/__shipyard` (no such routes are compiled in; an e2e asserts it).

**Over-engineered, cut first if scope runs out:**

1. generated video
2. per-agent paid bodies
3. the 3D Forge scene (keep the 2D Forge)
4. the critic in live trials
5. creating workflows from the Forge
6. the overall leaderboard (keep it per brief)

Already rejected: Elo, a conversion DSL, a job queue.

### Success (v2)

- **Live library:** a skill added to the library appears in the open Armory with no reload.
- **Forge:** an agent created in the Forge passes `verify.py` and shows in `ship/index.html`.
- **Regatta:** a two-ship regatta names a winner from labelled numbers.
- **Live trial:** one real live trial completes and logs Verified facts.
- **Finish review:** a score of 85 or more.
