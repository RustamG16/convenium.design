---
id: inv-003
title: Claude Code repo stacks — two overlapping recommendation lists
sources:
  - src-0003 — https://www.instagram.com/reel/DcN-pkGBLHE/ (nocodealex) — "7 repos worth installing"
  - image-10 — TikTok/Reel, lvl_aiautomations — "TOP 5 Claude open repos"
mnemosyne_verdict: park (new, but an acquisition list rather than a mechanism)
filed: '2026-08-28'
---

# Claude Code repo stacks

Two independent lists, one overlap. Both select by the rule *"each one takes over a job
you are currently doing by hand"* rather than by novelty.

## List A — lvl_aiautomations, top 5

| Repo | Claim (verbatim from the slide) |
|---|---|
| `oraios/serena` | "Gives Claude real code understanding instead of just text search — it finds symbols, tracks references, and edits precisely instead of guessing from grep results." |
| `wshobson/agents` | "Splits Claude into specialist roles instead of one generalist handling everything — backend, security, performance, and testing each get their own focused expert." |
| `microsoft/playwright-mcp` | "Lets Claude actually open a browser and click through your app instead of just reading the code, so it can catch bugs that only show up when the workflow runs for real." |
| `upstash/context7` | "Pulls current library docs into Claude's context on demand, so it stops writing code against outdated APIs it remembers from training." |
| `obra/superpowers` | "Forces Claude through a real dev process — plan, then build, then verify instead of jumping straight to code and fixing mistakes after they've piled up." |

## List B — nocodealex, 7 repos

`obra/superpowers` (273.6k claimed — full brainstorm→spec→plan→test→review workflow) ·
`multica-ai/andrej-karpathy-skills` (203.6k claimed) · `nizos/tdd-guard` · plus four more
the OCR/transcript did not resolve cleanly. Caption claims 579,600 stars across the seven.

---

## Where these already stand here

| Repo | Status on this machine |
|---|---|
| `obra/superpowers` | **Present but project-local** to `005-agency` — `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `subagent-driven-development`, `verification-before-completion`, `systematic-debugging`, `using-git-worktrees` are all there and **not loaded anywhere else** |
| `microsoft/playwright-mcp` | Functionally covered — the `Claude_Browser` MCP already drives a browser (navigate, click, read console, read network) |
| `wshobson/agents` | Functionally covered — nine role agents already exist in `~/.claude/agents/` (convenium-design, zeus, hephaestus, hermes, athena, calliope, themis, oracle, convenium-design-run) |
| `upstash/context7` | **No local equivalent.** Nothing currently pulls version-matched library docs on demand. |
| `oraios/serena` | **No local equivalent.** Code navigation is grep/glob-based today. |
| `nizos/tdd-guard` | No local equivalent outside the project-local superpowers set |

## Assessment

Both lists are acquisition lists, not mechanisms — there is nothing here to file as a
library entry, which is why the pipeline parked rather than filed them.

The genuinely useful output is the **overlap**: `obra/superpowers` appears on both lists
independently, and it is the one already sitting on this machine but stranded in a single
project. That is the actionable item, and it is a configuration fix rather than a
download — see [../06-health/installed-skills-check.md](../06-health/installed-skills-check.md).

Of the rest, `context7` and `serena` are the two that overlap least with what exists.
Neither is a design tool, so neither affects the design setups.

**All star counts here are the creators' and were not verified.** The 273.6k and 203.6k
figures in list B are implausibly high for repos of that kind and should be treated as
unsupported until checked.
