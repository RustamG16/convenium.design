# CLAUDE.md

Entry point for Claude Code when this folder is attached for a website redesign. This file
carries **only** the read order and the host-specific mechanics. All doctrine is in
`AGENTS.md` — it is not duplicated here.

## Read order

1. `ARCHITECTURE-ESSENTIALS.md` — one screen: what Convenium.Design is, the run, where things live.
2. `AGENTS.md` — the operating doctrine. Read in full.
3. `START-HERE.md` — the gated workflow and the intake questions.
4. Then only the file the current decision needs: `ARCHITECTURE.md` for the full routing
   table, a `library/doctrines/<name>/design.md` for a chosen doctrine, a specific
   `library/agents/<name>.md` before delegating.

Route skills from `library/registry/ROUTING-DIGEST.md`. Load a `SKILL.md` body only after the
routing decision, one per phase.

## Host mechanics — Claude Code

- **Skills** load from `.claude/skills/<id>/`. Invoke a skill with the **Skill tool**, not a
  `$name` token. Where `AGENTS.md` or an agent file writes `$reference-deconstruction`, that
  means "use the `reference-deconstruction` skill".
- **Agents** are in `.claude/agents/<name>.md` (7: `design-director`, `brand-strategist` + 5 specialists). A
  read-only specialist has no Write/Edit in its `tools:` list — respect that boundary.
- **`impeccable` is projected here as a full body**, including its `scripts/` and
  `reference/` playbooks — run `node .claude/skills/impeccable/scripts/context.mjs` at the
  start of a finish pass. It carries `init` (PRODUCT.md), `document` (DESIGN.md) and the
  design detector, so it owns the design-system stage. Until 2026-09-04 it was projected only
  to `.agents/` (Codex) and this host fell back to a plugin copy that ships no scripts, which
  meant Claude ran a materially weaker loadout than Codex on the same repository.
- **Every skill the pipeline needs is bundled** — `gsap-*`, `apple-design` and
  `emil-design-eng` included. Use the `.claude/skills/` copy (or `convenium-design:<id>` when Convenium.Design is
  installed as a plugin), never a same-named personal or plugin skill: those differ between
  machines.
- **Tooling is stdlib Python and cross-platform.** `python library/tools/verify.py` is the one
  health check (`--project <path>` checks a project's six context files);
  `python library/tools/apollo.py attach <project>` connects a project, `doctor` checks this
  machine. The `scripts/*.ps1` files are thin wrappers kept for habit.
- **Rebuild the generated trees** after any `library/` change:
  `python library/tools/project.py all` then `python library/tools/verify.py`.
- **Before implementing anything visual**, write `PRODUCT.md` and `DESIGN.md` into the website
  project from `templates/` and fill `DESIGN.md`'s token block with real numbers. See the
  design-system rule in `AGENTS.md`; it is the step whose absence most reliably produces a
  timid result.
- **Write `06-build-plan.md` in plan mode, then implement from it in a fresh session.** It is
  the design document — art direction, palette, type scale as numbers, a page sequence with a
  per-section media map. This is the locked workflow; see the build-plan rule in `AGENTS.md`.
- **Read the brief as written.** Explicit creative freedom cancels the intake round. Do not
  ask questions a brief has already told you not to ask.
- **The ship console (`ship/index.html`) must stay true to the system.** Any change to agents,
  skills, routing, doctrines or workflows also updates the console in the same change: edit
  `library/registry/crew.json` (a new agent needs a crew member) or
  `library/registry/workflows.json` (a new workflow needs a ship), then rebuild — `verify.py`
  fails while `ship/data/ship-data.js` is stale. See `ship/README.md`.
- **"Rebuild/optimize the mobile resolution" on a built site is a retrofit, not a redesign.**
  Kick off from `templates/prompts/mobile-app-grade-pass.md` on the abridged trail and load the
  `mobile-app-shell` skill body alone (verification stays `visual-qa`). No intake, no other
  skill bodies — the token budget of this pass is one digest read plus one skill.

- **Several sites at once is the fleet pass.** Kick off from `templates/prompts/mobile-fleet-pass.md`
  (`ss-mobile-fleet`): the director writes `00-run-plan.md` first, one read-only agent measures
  with `mobile-app-shell/reference/shell/measure.mjs`, the shell is built once on the reference
  site, then one agent per site in parallel worktrees, each with the `mobile-app-shell` body only.
- **Models are set per agent.** `library/agents/<name>.md` carries `model: opus|sonnet|haiku`
  (the model rule in `AGENTS.md`); `project.py` writes it into `.claude/agents/*.md`, where
  Claude Code honours it for subagents. `claude --model` overrides the orchestrator only.
- **Agents are inert until the plan names them.** See the activation protocol in `AGENTS.md`:
  no agent is spawned and no second skill body is opened in a phase that the written plan did
  not ask for.

## Do not

- Edit anything under `.claude/`, `.agents/skills/`, `.codex/agents/`, or
  `ship/data/` — they are generated from `library/` and overwritten.
- Write project evidence into this repo. It goes in `<website-project>/.olympus/`.
- Touch `evidence/`, `handoffs/`, `public/media/`, or any `.olympus/`.
- Read or route from `unused/` — it is retired material, indexed in `unused/README.md`.

## For humans

See `USAGE.md` for the runbook — what the system does, the gates, the kickoff prompt, and how
to rebuild the projections.
