---
id: idx-skill-repos
title: External skill repositories — verified inventory
verified: '2026-08-28'
method: GitHub REST API (repos + contents), live
---

# External skill repositories

Seven repos supplied on 2026-08-28. **All seven resolve to real, active, MIT-licensed
repositories.** Two of the names as given were truncated or approximate and are corrected
below.

| Repo | Stars | Last push | Licence | Skills | Local status |
|---|---:|---|---|---:|---|
| [emilkowalski/skills](emilkowalski-skills.md) | 33,204 | 2026-08-21 | MIT | 12 | **9 of 12 already installed** |
| [ConardLi/garden-skills](conardli-garden-skills.md) | 11,535 | 2026-07-12 | MIT | 5 | none installed |
| [MengTo/Skills](mengto-skills.md) | 5,541 | 2026-08-18 | MIT | ~140 | none installed |
| [jakubkrehel/skills](jakubkrehel-skills.md) | 4,543 | 2026-08-27 | MIT | 11 | none installed |
| [Owl-Listener/designer-skills](owl-listener-designer-skills.md) | 2,368 | 2026-08-08 | MIT | ~110 | none installed |
| [elayadesign/ai-design-skills](elayadesign-ai-design-skills.md) | 1,457 | 2026-07-29 | MIT | 1 | none installed |
| [codeswithroh/tastemaker](codeswithroh-tastemaker.md) | 245 | 2026-08-22 | MIT | 1 | none installed |

## Name corrections

| As given | Actual |
|---|---|
| `elayadesign/ai-des…` labelled "landing-page-design" | `elayadesign/ai-design-skills` — `landing-page-design` is the single skill *inside* it |
| `codeswithroh/taste…` | `codeswithroh/tastemaker` |
| `Owl-Listener/desig…` | `Owl-Listener/designer-skills` |
| `ConardLi/garden-sk…` | `ConardLi/garden-skills` |

Note that `Owl-Listener` also publishes `ai-design-skills` — a **different** repo from
`elayadesign/ai-design-skills`. Do not confuse them.

## The headline finding

**Emil Kowalski's repo is already installed.** Nine of its twelve skills are live in
`~/.claude/skills` right now: `animate`, `animation-vocabulary`, `apple-design`,
`emil-design-eng`, `find-animation-opportunities`, `improve-animations`,
`pick-ui-library`, `prototype`, `review-animations`. There is nothing to acquire there —
only to confirm it is wired up and used.

Against the ~97 locally indexed skills, the genuine gaps are ranked in
[../../../unused/library/knowledge/02-tool-inventories/gap-analysis.md](../../../unused/library/knowledge/02-tool-inventories/gap-analysis.md).

## 2026-10-14 — gamification sources

Searched for gamification and gamified-UI skills on GitHub and in skill directories. Each repo was
cloned and read; the directory listings were not relied on.

| Repo | Licence | Verdict |
|---|---|---|
| [eykd/vance-ts](eykd-vance-ts.md) | ISC (package.json only) | **installed** `octalysis-gamification` |
| [gamedev-skills/awesome-gamedev-agent-skills](gamedev-skills-awesome-gamedev-agent-skills.md) | Apache-2.0 | **installed** `game-feel` (1 of 67) |
| [jarrodmedrano/jarrod-claude-skills](jarrodmedrano-jarrod-claude-skills.md) | MIT (package.json only) | park |
| [mulosbron/gamification-skills](mulosbron-gamification-skills.md) | none | discard — no licence; conclusions only |

None of the licensed sources covers web gamification mechanics (XP curves, streaks,
achievements, celebration tiers). That gap is filled by the original Convenium.Design skill
`library/skills/02-web-build/gamified-ui`. The closest unlicensed match is recorded in
[../03-skill-briefs/ui-gamification.md](../03-skill-briefs/ui-gamification.md).
