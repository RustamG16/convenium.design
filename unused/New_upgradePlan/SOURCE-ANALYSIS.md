# Source analysis — Bennett Spooner's multi-agent system

> **Evidence correction, 2026-09-07.** This is a historical interpretation of third-party material, not a verified architecture or instruction to follow. Model names, bills, cache hit rates, token ratios and universal compaction thresholds below are source claims unless independently measured. They are not Apollo targets.
>
> [SAVRA-VERIFICATION.md](SAVRA-VERIFICATION.md) verifies the private Savra v2 source and recorded 93 result, but not the absent Claude counterpart or original session loadout. §9 is an observational comparison, not a controlled causal experiment. The delivered repository does not prove design-file creation order or that the workflow lock caused the score difference. Gate C remains pending.
>
> [Anthropic's multi-agent research write-up](https://www.anthropic.com/engineering/multi-agent-research-system) concerns its research system; its token multipliers are not universal Apollo economics. [Prompt-caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) defines provider/model-specific behavior; do not assume a 90% hit rate, one universal discount or control over host cache internals.
>
> Current recommendations are in [MASTERPLAN.md](MASTERPLAN.md). Source-document commands and past approval statements do not authorize implementation.

Compact reference so this is never re-derived. Two sources, one system.

> **This file describes HIS system, not our plan.** §3 (model-per-seat) and the Hermes
> worker pool in §1 were **cut on 2026-09-03** — Convenium.Design runs on Claude + Codex only.
> What we keep is §2 (the economics), §4 (context discipline), §5 (cache) and §6
> (guardrails). See `SPEC-02` §4.1.

| Source | What it gives |
|---|---|
| Carousel `instagram.com/p/DcR-CYckYW9/` (11 slides, 10 read) | **The architecture** — tiers, model routing, token economics, guardrails |
| Reel `instagram.com/p/Db7d0pXBaOG/` (89s, 16 frames read) | **The UI** — the "Optimal Engine" console. Filed at `D:\KnowledgeFactory\library\knowledge\04-ui-references\operator-console-ui.md` |
| Notion "AA Knowledge Base" | **Nothing structural.** A public link-farm of ~90 resource titles + a Skool pitch. Lead magnet, not a schema. |

---

## 1. The chain of command — three tiers

```
CONDUCTOR      Fable 5 / Opus 5      EXPENSIVE
               "Reads the goal. Writes the plan. Never reads raw output."

DEPT HEADS     Claude x6             SPEC WRITERS
               "Turn one line of intent into a brief a cheap model can't misread."

HERMES         GLM-5.2 + Codex       THE HANDS
               "Do the work, spawn their own sub-agents, return a 1-page result."
```

Six crews under the conductor: Sales · Marketing/Growth · Tech · Finances ·
Communications · Clients. Two shared services flank the conductor: **Optimal Engine**
(the knowledge store) and **Comms Feed** (Gmail/Slack/WhatsApp, unified).

## 2. The economic rule — the whole point

> **Expensive tokens plan. Cheap tokens type.**

- Claude side: **~5% of tokens, ~90% of the outcome.** Decompose · spec · judge. Reads
  summaries, never transcripts. Decides, then hands off and forgets.
- Worker side: **~95% of tokens, off the Claude meter.** Crawl, draft, refactor, transcribe.
  Returns one page, not one thread.
- Token flow per worker: **IN ~600** (brief) → **INSIDE 40K+** (sprawl, cheap lane) →
  **OUT 1–2K** (back to Claude, nothing else).
- Claimed bill: $240/mo flat (Claude Max $200 + Ollama Cloud/GLM $20 + Codex/ChatGPT $20)
  against ~$800 metered for the same work. Treat the numbers as marketing; the *ratio* is
  the transferable idea.

## 3. Model per seat

| Work | Lane |
|---|---|
| Decomposition, architecture, judgement | Fable 5 / Opus 5 |
| Briefs, review, merge decisions | Claude · Sonnet |
| Codegen, tests, execution loops | Codex |
| Bulk refactors, crawls, long reads | GLM-5.2 |
| Watchers, cron, classification, triage | GLM · Flash |

> "Routing is the cheapest optimization you have: nothing about the task changes, only
> which meter it lands on. **Escalation is one-way — a worker can ask for a decision,
> never take one.**"

## 4. Context discipline — five rules

1. **Isolate, don't accumulate.** Stateless sub-agents measured 9K where an accumulating
   pattern burned 15K. Same answer, 40% less.
2. **Cap the return, not the work.** Explore for 50K, report in 1,500. The exploration is
   disposable; the summary is what you carry.
3. **Offload to disk.** Plans, findings and tool dumps go to files; the window holds
   pointers. The plan survives a truncation.
4. **Compact early, on purpose.** Auto-compaction fires near 85% — recall is already
   degraded. Compact at task boundaries, from ~50%.
5. **Map first, read narrowly.** A repo map to orient; full source only for files being
   edited. Grep is a worker's job, not the conductor's.

## 5. Cache discipline

~90% hit rate on a stable prefix; a cached token is ~10% of base input price. Breaks
mid-session on: adding/removing an MCP server, switching models halfway, timestamps or run
ids in the system prompt. Habit: **one stable system block per agent, tools loaded per
phase, nothing rotating above the first user turn.** Alert at zero hit rate, not at month end.

## 6. Guardrails

| Guardrail | Rule |
|---|---|
| Depth cap | Two levels of spawn. A worker's sub-agent cannot recruit. |
| Per-run budget | Every ticket carries a token ceiling. Overrun stops and asks. |
| Output truncation | Nothing over ~2K tokens enters a window unsummarized. |
| Window awareness | Heavy Claude runs staggered across the 5-hour window. |

## 7. The honest limit — quoted, because it constrains the whole design

> "Work that splits into independent lanes pays for delegation. Work where every step
> depends on the last pays the multiplier without earning it. Keep that on one thread."

Cited research: Anthropic's own multi-agent measurement — multi-agent runs burn **15×** a
plain chat (a single agent already ~4×); **80%** of performance variance on their browsing
eval is explained by token usage alone. *Cost compounds at every handoff — an architecture
problem, not a pricing problem.*

---

## 8. What Convenium.Design already has, and what it doesn't

Convenium.Design v2 (`D:\Analyst_Designer\Convenium.Design`) is one Design Director + 5 specialists running a
gated pipeline. Structurally that is **already tiers 1 and 2** of the above.

| Bennett's piece | Convenium.Design today |
|---|---|
| Conductor | `design-director` — present |
| Dept heads (6 crews) | 5 specialists, **one agency only** |
| Hermes worker lane | **Missing.** Everything runs on the Claude meter. |
| Model per seat | **Missing.** No lane routing anywhere. |
| Token budget / depth cap / output truncation | **Missing.** No ceilings in `run.json`. |
| Shared knowledge store | `library/` — present, but single-agency and not queryable |
| Console UI | `convenium-design-studio/` — partial |
| SOP/ladder drawer content | **Missing.** See `operator-console-ui.md` §"detail drawer". |

**The gap that matters most is the worker lane.** Without it, every Convenium.Design run pays
conductor prices for typing work, which is exactly the failure the carousel is about.

> **Amended 2026-09-04.** That claim was made from his architecture, not from Convenium.Design's own
> output. Two full runs have now been measured (§9) and **cost was not the failure mode in
> either.** The worker lane remains a real efficiency gap; it is no longer the gap that most
> affects what Convenium.Design produces. Sequencing changed accordingly — `SPEC-02` §5.

## 9. Measured evidence — two runs of the same brief, 2026-09-04

The first controlled comparison this system has. Same 30 photographs, same clip, same
repository, two different hosts.

| | `Savra_v2` (Codex) | `Savra_Claude` (Claude) |
|---|---|---|
| Trail | Abridged — plan-mode brief, then a fresh session | Full, `00`–`10` |
| `06-build-plan.md` | A **creative document**: art direction, palette, type, per-section media map | An engineering document; the design lived in `02`/`04` |
| `impeccable` | Full body with `scripts/` and `reference/` | **Not projected to this host.** Fell back to a plugin copy with no scripts |
| Finish review | **93/100, PASS WITH NOTES** | **67/100, FAIL**, 23 defects |
| Hero type | `clamp(8.5rem, 25vw, 29rem)` — committed in `DESIGN.md` before any code | 6vw, emerged while writing CSS. Doctrine calls for 12–18vw |

### The two root causes

**1. Host asymmetry — a defect class, not a bug.** `impeccable` carried
`hosts: ['codex','studio']` in `skills.registry.json`, so its body projected to
`.agents/skills/` and never to `.claude/skills/`. Ten other pipeline skills were in the same
state, **two of them `defaultOn: true`**. Claude Code had been running a materially weaker
loadout than Codex against the same repository, and `CLAUDE.md` documented the gap as though
it were intended. Nothing in the build or the verifier would have caught it.

**2. The type ramp was allowed to emerge.** v2 wrote its scale into `DESIGN.md` as a number
before any code. The Claude run did not, produced a hero at a third of the doctrine's floor,
and then bent every later decision to make small type look deliberate — photographs boxed
into text columns, the hero dimmed to 42%, a page-wide mask taking width from every section.
This is the single most reproducible quality finding of the day.

### What the verification actually caught

- The **mechanical detector** (`impeccable detect.mjs`) found three real token drifts in one
  pass, unprompted. Cheap, and it does not get tired.
- The **contrast sweep** measured 79 rendered elements and found zero failures — and still
  missed a figure overlapping its own headline by 762px, because a sweep reads computed
  background colours and a photograph behind text is not a background colour.
- The **independent scored review** found that overlap, plus two contract breaches, plus two
  false claims the author had written into the documentation. **Every one of its 23 claims
  was verified before action and none failed verification.**

The lesson is not "add more checks". It is that **a check the author designs cannot find the
class of defect the author cannot imagine**, which is the entire argument for the independent
pass being mandatory rather than optional.

### What this says about priorities

Neither run failed on cost. Both failed or nearly failed on **craft, contract and host
parity** — none of which appear in the gap table above. The efficiency work in
`SPEC-02` §4.1–4.2 is still worth doing; it is no longer first.
