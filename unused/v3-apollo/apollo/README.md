# Apollo

A design system that runs as an agent. It analyses, produces the design, and
writes the implementation plan. **You implement from that plan.** Apollo never
edits your project.

Local and unlocked right now — the skill set, MCP, and tooling are still being
varied to find the best combination. Once a variant wins, it gets packaged as a
plugin. See `MERGE-REPORT.md` for what is currently inside it.

## Why it is self-contained

The harness plugin skill set changes between sessions on the same machine —
observed range on this box: 10 to 36 skills, with design skills going from six
present to none. `dataviz` lives in a CLI-version-keyed cache and moves on every
update. An agent that routes to those works some days and not others.

So Apollo depends on nothing outside this folder. Optional capabilities are
probed and used when present, skipped silently when absent, and never required.

## Layout

```
agents/      variant agent files under test
skills/      the 7 vendored/authored skills
lib/         contrast.mjs, tokens.schema.json
scripts/     probe.ps1, verify-catalog.ps1
evals/       fixtures, rubric, runner
variants/    V1..V6 manifests
```

## The eight stages

| stage | what happens | output |
|---|---|---|
| 0 Probe | read what this session actually has | `.apollo/env.json` |
| 1 Intake | classify: `AUDIT` / `NEW` / `SYSTEM` / `ASSET` | fixed pipeline, no improvised routing |
| 2 Evidence | serve, screenshot 6 widths, extract real tokens | `_apollo/evidence/` |
| 3 Direction | 2–3 distinct directions, each with its costs | you pick |
| 4 Comp | static HTML/CSS comp of the chosen direction | `_apollo/comp/` |
| 5 Self-check | contrast, overflow, console — scripts, not opinion | pass/fail |
| 6 Handoff | the spec you feed to Claude Code | `HANDOFF.md` |
| 7 Stop | one gate | — |

`SYSTEM` and `ASSET` jobs skip stages 4–5.

Breakpoints throughout: **375 / 768 / 1024 / 1440 / 1920 / 2560**. 1920 is the
primary target and is specified deliberately, never extrapolated from 1440.

## Skills

Four authored, three vendored. Loaded on demand, two per job.

| skill | fires on |
|---|---|
| `apollo-audit` | something exists and needs critiquing |
| `apollo-direction` | something new needs a visual direction |
| `apollo-tokens` | tokens, palette, type scale, design-system work |
| `apollo-handoff` | turning a settled design into a build spec |
| `apollo-dataviz` | **before** any chart, stat tile, or plot |
| `apple-design` | gesture / spring / sheet interaction |
| `emil-design-eng` | polish pass on something that works but feels cheap |

## Running the scripts

Probe the current session:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/probe.ps1
```

Verify nothing references a skill that does not exist — run before every
bake-off round:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-catalog.ps1
```

Check a token system's contrast. Declared `contrastPairs[]` are enforced and a
failure exits 1; the advisory matrix is informational:

```bash
node lib/contrast.mjs brandspec.json --matrix
```

Write the computed ratios back into the spec:

```bash
node lib/contrast.mjs brandspec.json --write
```

## Two rules that are load-bearing

**Nothing blocks the door.** There is no checklist that must be fully cleared
before work is called done. Every stage terminates, states what it did not
resolve, and hands on. A quality bar that cannot be cleared produces an infinite
review loop, not quality.

**Computed, not asserted.** Contrast ratios come from `contrast.mjs`. Screenshots
come from a served page. Anything a script can settle never costs a review round
or a judgement call.

## Status

- [x] Scaffold, probe, catalog verification
- [x] 7 skills vendored and merged (`MERGE-REPORT.md`)
- [x] `lib/contrast.mjs`, `lib/tokens.schema.json`
- [ ] The 8-stage agent file + variants V1–V6
- [ ] Fixtures, rubric, runner
- [ ] Bake-off, score, lock
- [ ] Plugin packaging, git
