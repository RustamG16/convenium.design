# Architecture essentials

One screen. Derived from `ARCHITECTURE.md` and `library/README.md` — do not add detail here;
add it there and re-summarise.

## What Convenium.Design is

One persistent Design Director takes a business from its Brand DNA to a verified, built
design — today a website or a brand identity — through explicit gates, activating a skill or
specialist only when its routing condition is true. It is not "run every
capability at once" — that failure mode is described at the end of `ARCHITECTURE.md`.

## The run

```
Brand DNA (brand-strategist → .olympus/brand-dna.json + BRAND.md)
  → remaining intake + direction block → 01 audit → Gate A (brief + products)
  → 02 direction (one, per the brief) → 03 critique → Gate B
  → 05 asset manifest + 06 build plan
  → PRODUCT.md + DESIGN.md committed as numbers   ← before any layout code
  → implement
  → 07 QA (author) + 10 finish review (independent, scored) + 08 metrics
  → Gate C → 09 handoff
```

- **The business comes first.** Every project gets a Brand DNA before Gate A — evidence mode
  (site, socials, reviews, competitors) or interview-only. It lives in the project's
  `.olympus/`, never here. See `ARCHITECTURE.md` § Brand DNA.
- **Direction is decided at intake**, not by generating alternatives. Default output is one
  direction. See the direction rule in `AGENTS.md`.
- **The design system is committed before the build**, with real numbers in `DESIGN.md`. See
  the design-system rule in `AGENTS.md`. This is the step whose absence most reliably produces
  a timid result.
- **Verification is two passes**: the author's, then an independent scored finish review.
- **Trail may be `full` or `abridged`** — abridged collapses `00`–`04` into an approved plan
  when the user's instruction already fixes brief and direction. It never skips
  `06-build-plan.md`, `DESIGN.md`, the finish review, or Gate C. A scoped repair on a built
  site ("rebuild the mobile resolution") is abridged: kickoff in
  `templates/prompts/mobile-app-grade-pass.md`, one skill body (`mobile-app-shell`).
- **`06-build-plan.md` is the design document**, not a task list — art direction, palette,
  type scale as numbers, a page sequence with a per-section media map. Written in plan mode
  where the host has one, and **implemented from in a fresh session**.
- **The brief is read as written.** Explicit creative freedom cancels intake; a refusal
  ("no three directions") is a rejection to encode, not a request; "current"/"trending"/a
  named year opens a research lane that must cite live URLs. See `AGENTS.md`.
- **Seven agents, one roster.** `library/agents/` is what both hosts run — the director, the
  brand strategist and five specialists — and each states its own activation conditions. The
  user's console is the 2D ship (`ship/index.html`): crew members are the agents
  (`library/registry/crew.json`), ships are the workflows (`library/registry/workflows.json`),
  and its data file is generated — see `ship/README.md` for the keep-it-true rule.
- **Greenfield**: no existing page → start at the questionnaire, `ux-evidence-audit` dormant,
  `reference-deconstruction` carries evidence.
- **Agents on demand, one skill each, a model per tier.** The written plan activates agents;
  nothing runs that it did not name, and each agent opens one skill body. `AGENTS.md`:
  activation protocol and the model rule (planner `opus` / builder `sonnet` / reader `haiku`).
- **Many sites at once**: `templates/prompts/mobile-fleet-pass.md` (`ss-mobile-fleet`), shell
  kit in `mobile-app-shell/reference/shell/`.
- **Loops**: see the loop bounds in `AGENTS.md` (QA cycles, intake, audit cache, one-direction,
  anti-loop). Phase counts are recorded in `run.json`.

## Where things live

| Thing | Path |
|---|---|
| Source of truth (authored here only) | `library/` |
| Skills | `library/skills/<category>/<id>/SKILL.md` — one canonical kebab-case id per folder |
| Agents (host-neutral) | `library/agents/` — `design-director` + `brand-strategist` + 5 specialists |
| Registry | `library/registry/skills.registry.json` · `ROUTING-DIGEST.md` (route from this) |
| Brand DNA (per client project) | `<project>/.olympus/brand-dna.json` · schema `library/schemas/brand-dna.schema.json` |
| Doctrines | `library/doctrines/` — direction input to the questionnaire |
| **Generated, disposable** | `.claude/` · `.agents/skills/` · `.codex/agents/` · `.claude-plugin/` · `ship/data/` |
| The ship console (crew = agents, ships = workflows) | `ship/index.html` — open in a browser, no build |
| Rebuild the generated trees | `python library/tools/project.py all` |
| Check the repo / this machine | `python library/tools/verify.py` · `python library/tools/apollo.py doctor` |
| Connect a project | Claude plugin (`.claude-plugin/`) or `python library/tools/apollo.py attach <project>` |
| Retired material (never read) | `unused/` — indexed in `unused/README.md` |
| Project artifacts (never in this repo) | `<website-project>/.olympus/` |

## Two-stage skill loading

Route from `library/registry/ROUTING-DIGEST.md` (one line per pipeline-active skill). Load a
`SKILL.md` body only after the routing decision, and never more than one body per phase.

## Hosts

`AGENTS.md` is the single doctrine for both hosts. `CLAUDE.md` and `PROMPT.md` carry only the
host-specific mechanics. `USAGE.md` is the human runbook.
