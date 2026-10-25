# Spec 02 — the agency model

> **2026-09-07 amendment — planning only.** [MASTERPLAN.md](MASTERPLAN.md) supersedes the sequence and acceptance details below.
>
> - A hostNote is explanation, never proof of a working capability. Verify delivery/version/support files and plugin availability; fail required unresolved capabilities. Distinguish Studio display stubs from executable hosts.
> - Regression tests use isolated fixtures, not intentional damage to the working registry. Derive expected failures from fixtures rather than hard-coded historical counts.
> - No nested specialist delegation. The director may do small local reads; delegation must earn its overhead. Usage/budget enforcement must declare what the host actually exposes.
> - Validate one run schema; migrate camelCase records explicitly; bind approvals to artifact hashes. Phase counts are not token measurements. Missing critical fields must not silently default to success.
> - Quality fixtures and the design contract precede KB expansion. The drawer uses available metadata; SOP prose is not a console blocker.
> - Native execution remains default. CrewAI is an optional Flow-first pilot after an operational need is demonstrated. No assumption that subscriptions provide API credentials.
> - Agency #2 is deferred until repeatable design quality and a defined use case exist. Adding an agency also needs namespaces, routing/permission tests and capability validation, not merely a JSON file.

**Status:** draft, unapproved. Depends on Spec 01.
**Goal:** one system, many agencies, one shared KB. Design finished first; Marketing and the
rest attach without restructuring anything.

---

## 1. What exists today

Convenium.Design v2 is **one agency** — Design — and it is already whole:

| Piece | State |
|---|---|
| `design-director` | the conductor; routes the whole run |
| 5 specialists | `visual-analyst` · `design-engineer` · `independent-critic` · `asset-producer` · `analytics-specialist` |
| Pipeline | intake -> 01 audit -> Gate A -> 02 direction -> 03 critique -> Gate B -> 05/06 -> implement -> 07/08 -> Gate C -> 09 handoff |
| Registry | 84 skills, 31 routed, 53 unrouted |
| Knowledge | `library/knowledge/` — 8 corpora |
| Studio | `convenium-design-studio/` — MCP server + UI surface |

Unification completed 2026-09-02, Phases 0–8 all PASS. **Nothing here is being rebuilt.**

### Landed 2026-09-04 — the workflow lock

Driven by the two-run comparison in `SOURCE-ANALYSIS.md` §9. All of it is doctrine now, in
the repo, projected to both hosts:

| Change | Where |
|---|---|
| `impeccable` projected to `.claude/skills` with its `scripts/` and `reference/`; `defaultOn: true` | `skills.registry.json` |
| **`06-build-plan.md` is the design document** — art direction, palette, type scale as numbers, a per-section media map naming exact files | `templates/06-build-plan.md`, `AGENTS.md` |
| **Written in plan mode, implemented from in a fresh session** | `AGENTS.md`, `START-HERE.md` §4 |
| **Brief-reading rules** — creative freedom cancels intake; a refusal is a rejection to encode; "trending"/a named year opens a research lane; an ambition word is a floor | `AGENTS.md` |
| **Abridged trail** as a first-class entry with a decision table | `START-HERE.md` §0 |
| **Design-system stage §3.5** — `PRODUCT.md` + `DESIGN.md` committed as numbers before layout, hero size checked against the doctrine's `--display-max` | `START-HERE.md`, `AGENTS.md` |
| **Two-pass verification** — author's `07-qa.md`, then an independent scored `10-finish-review.md` by an agent that did not build it | `AGENTS.md`, `templates/10-finish-review.md` |
| Every agent states its own **phase, priority, activation condition and trigger words** | `library/agents/*.md`, projected to both hosts |
| `runtimeOwner` maps the console's five-name pantheon onto the six real agents | `library/registry/slots.json` |

This is §4.4's cheaper cousin and it shipped first: rather than 31 skill SOPs, it wrote down
the **six activation conditions and the run's shape**, which is what actually routes a job.

## 2. The three layers

```
SHARED          knowledge/ · design-dna/ · tools/ · registry schema · the KB itself
                -> anything true regardless of which agency is running

AGENCY          agents · doctrines · pipeline · phase set · routing conditions
                -> design/ is populated. marketing/ is an empty folder and a KB filter value.

PROJECT         <website-project>/.olympus/ — run state, artifacts, evidence
                -> unchanged; already correct
```

The only structural change to the repo is that `library/agents/`, `library/doctrines/` and
the pipeline definition gain an agency owner. Everything in `library/knowledge/`,
`library/design-dna/` and `library/tools/` is **shared and stays exactly where it is.**

## 3. How an agency is declared

One file per agency, `library/agencies/<id>/agency.json`:

```json
{
  "id": "design",
  "title": "Design Agency",
  "conductor": "design-director",
  "specialists": ["visual-analyst", "design-engineer", "independent-critic",
                  "asset-producer", "analytics-specialist"],
  "phases": ["always","diagnose","direct","prepare","build","verify"],
  "gates": ["A","B","C"],
  "doctrines": "library/doctrines/",
  "schemaVersion": 1
}
```

`kb build` reads these, stamps the `agency` column on every row it indexes, and that is the
entire mechanism. Adding Marketing is: write `agencies/marketing/agency.json`, add its
agents and doctrines, rebuild. No migration, no refactor, no touching Design.

**`schemaVersion` from day one**, missing fields defaulted on load rather than a hard error.

**`conductor` and `specialists` name the agents in `library/agents/`, and nothing else.** The
repo also carries a five-name pantheon — Convenium.Design, Athena, Calliope, Hephaestus, Hermes — in
`convenium-design-studio/data/systems.json` and as `owner` in `slots.json`. It reads well and **no
runtime has ever loaded it**; both `.claude/agents/` and `.codex/agents/` contain the same six.
It is a console display model. `slots.json` now carries `runtimeOwner` alongside `owner` so the
two can be joined without either being renamed. Agency #2 must not inherit this confusion:
one roster is real, the other is a view.

## 4. What "finishing the Design Agency" means

The unification made the system *coherent*. It did not make it *complete*. These are the
gaps, in the order they cost you money:

### 4.0 Host parity — the gap nothing was watching

`SOURCE-ANALYSIS.md` §9. Eleven pipeline skills carried `hosts: ['codex','studio']`, so Claude
ran a weaker loadout than Codex against the same repository for an unknown length of time. Two
of the eleven were `defaultOn: true`, meaning Convenium.Design's own defaults expected them active and
they silently were not.

`impeccable` is fixed. **The class is not.** Nothing in `project.py`, `verify.py` or the
registry schema asserts that a routed, `defaultOn` skill reaches every host that claims to run
the pipeline.

### Measured, 2026-09-04

| | |
|---|---:|
| Routed skills (`phase != unrouted`) | 31 |
| Host-restricted | **13** |
| …of which `defaultOn: true` | **2** — `apple-design`, `emil-design-eng` |
| Records carrying a `hostNote` | **0** |
| `verify.py` verdict today | **CLEAN** |

`verify.py` already validates that `hosts` is a non-empty subset of the three (check 6). It
has never asked whether a skill the pipeline *defaults to* actually reaches the host running
it. Two do not, and the health check says everything is fine.

### The work

1. **`hostNote` field.** Optional, free text, on any record whose `hosts` is a proper subset
   of the three. It is the difference between "deliberately plugin-served" and "forgotten".
   Populate it for the 13 restricted routed skills — the `gsap-*` family, `apple-design` and
   `emil-design-eng` are genuinely plugin-served on Claude; the three `studio`-only records
   are stubs with no body to project.
2. **`verify.py` check 10 — fail.** A record with `phase != unrouted` and `defaultOn: true`
   whose `hosts` omits any of `claude`/`codex`/`studio` **and** carries no `hostNote` is a
   failure.
3. **`verify.py` check 11 — warn.** Any routed record that is host-restricted without a
   `hostNote` warns. Needs a warning channel; `verify.py` currently only has `bad`.
4. **Agent parity.** Every file in `library/agents/` must project to every host. Cheap to
   add now, and it is the check that matters once agencies exist — an agency whose
   specialists do not reach a host is not runnable there and should say so at build time.

### Acceptance

- Run `verify.py` **before** the change: CLEAN.
- Run it **after**, with no `hostNote` populated: **fails on exactly two records** —
  `apple-design` and `emil-design-eng` — and warns on eleven more.
- Populate the notes: **CLEAN again**, with the eleven warnings gone and the restriction now
  documented rather than invisible.
- Flip any one skill's `hosts` to drop a host it needs, re-run: it fails. Restore: clean.
  That last step is the real test — the check has to catch a regression, not just describe
  today's state.

**Do this first.** It is an afternoon, it is a correctness bug rather than an optimisation,
and every other item in §4 is worth less while the hosts disagree about what is installed.

### 4.1 Delegation discipline — *not* a multi-model worker lane

**Scope decision, 2026-09-03: Hermes, GLM-5.2, Ollama Cloud and the gateway are out.**
Convenium.Design runs on the user's existing Claude and Codex subscriptions. No third-party model
lanes, no self-hosted gateway, no extra keys. That removes most of `SOURCE-ANALYSIS.md` §3.

What survives is the part that was never about vendors — **the economics of delegation**
(§2), which Claude Code's own subagents already support:

| Rule | Convenium.Design's version |
|---|---|
| Expensive tokens plan, cheap tokens type | `design-director` decomposes and judges. It does not crawl, grep, draft or transcribe. |
| IN ~600 / INSIDE 40K / OUT 1–2K | A subagent gets a bounded brief, explores freely, and returns **one page**. The exploration is disposable. |
| Escalation is one-way | A subagent may ask for a decision. It never takes one. No subagent changes direction, passes a gate, or edits the brief. |
| Isolate, don't accumulate | Stateless subagents per task, not one long-lived conversation carrying every prior result. |

Codex is the one exception worth keeping from his routing table: **codegen and execution
loops** are the work most worth moving off the planning context, and the user already pays
for it. Everything else stays on Claude.

Needs: a `delegates` field per agent saying what it may fan out, the bounded-brief and
one-page-return contract written into the agent files, and the guardrails in §4.2.

**Partially delivered 2026-09-04.** Every agent file now carries an `## Activation` block —
phase, priority, activation condition, trigger words — projected into both hosts. That is the
*when*. Still missing is the *what*: `delegates`, the bounded-brief contract, and the
one-page-return rule. The two-pass verification rule also landed one real delegation
constraint worth generalising: **the agent that reviews is never the agent that built.**

### 4.2 Token guardrails
`SOURCE-ANALYSIS.md` §6. None of these exist in `run.json`:
depth cap (2 levels, a worker's sub-agent cannot recruit) · per-run token ceiling that stops
and asks · output truncation (nothing over ~2K enters a window unsummarized) · window
awareness.

### 4.3 Retrieval
Spec 01. In progress.

### 4.4 SOP content
`operator-console-ui.md` §"detail drawer" — the format worth stealing. Every routed skill
should carry: what it replaces · what the human still owns · the 3-rung autonomy ladder ·
the SOP written out · tools at the end of the chain.

**This is a writing project, not a code project** — ~175 honest words x 31 routed skills.
It is the highest-value and slowest item here. Scope it to the routed 31; leave the 53
unrouted alone.

### 4.5 The console
Sub-project 4. Blocked on 4.4 having content to render.

## 5. Sequencing

**Resequenced 2026-09-04** against measured output rather than inferred cost — see
`SOURCE-ANALYSIS.md` §9. Two runs were measured and neither failed on tokens.

| # | Sub-project | Depends on | Why this order |
|---|---|---|---|
| 0 | **Host parity guard (§4.0)** | — | A correctness bug, not an optimisation. An afternoon. Every item below is worth less while the hosts disagree about what is installed. |
| 1 | Shared KB (Spec 01) | — | Everything queries it; the `agency` column must exist before agency #2 |
| 2 | Delegation discipline + guardrails (§4.1–4.2) | 1 | Still the biggest **cost** win. No longer the biggest quality win. |
| 3 | SOP content for the 31 routed skills | 1 | Slow, parallelisable, gates the drawer. See the note below before committing to it. |
| 4 | Console (Spec 03) — Map + Skills first | 1 | Map and Skills need only `kb.db`; the drawer waits on 3 |
| — | Agency #2 (Marketing) | 1, 2 | Only after Design is genuinely finished |

**A finding that should shrink item 3.** The workflow lock (§1) improved output measurably
and it is roughly 300 words of doctrine plus one template — not 31 SOPs. The mechanical
detector caught three real defects in one unprompted pass; the independent scored review
caught nineteen more. Neither needed a written SOP for any skill.

Before writing ~5,400 words of SOP content, it is worth asking what it buys that a *checked
condition* does not. The evidence so far says: **write the run's shape and the activation
conditions, then buy checks; write per-skill prose last, and only for the skills where a
human is genuinely deciding something.** Item 3 is not cancelled — it is demoted from
"gates the drawer" to "fills the drawer", and the drawer can ship showing the activation
block, which every agent now has.

**Invariant across all of it:** the way Convenium.Design is used does not change. Open Claude Code in
a project folder — or create the project under `test_projects/` — and run it. No new install
step, no service that must be up, no subscription beyond Claude and Codex.

## 6. The rule that keeps this honest

> Work that splits into independent lanes pays for delegation. Work where every step depends
> on the last pays the multiplier without earning it. Keep that on one thread.
> — `SOURCE-ANALYSIS.md` §7

Convenium.Design's pipeline is **mostly sequential with gates**. Audit -> direction -> critique -> build
is a dependency chain, not independent lanes. So the worker lane pays off inside a phase
(crawl a site, draft copy, refactor a stylesheet, transcribe evidence) and **not** across
phases. Do not fan out the pipeline itself. That is the mistake this architecture invites.

## 7. Open

See `OPEN-DECISIONS.md`. The load-bearing one is UI direction for sub-project 4.
