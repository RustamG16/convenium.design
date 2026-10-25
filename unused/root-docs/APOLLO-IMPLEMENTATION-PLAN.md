# Convenium.Design — implementation plan for Claude Code desktop

Each phase below is a **separate Claude Code session**. Run them in order. The prompt in each phase is written to be pasted verbatim — it carries its own context, because a fresh session has none.

Starter code already written and test-verified is in `convenium-design-starter/`:

```
convenium-design-starter/
  core/planner.ts        ← ported planner: scoring, DAG, negation, no fake budgets
  core/planner.test.ts   ← 10 tests, all passing under `node --test`
  db/schema.ts           ← full Drizzle schema, multi-tenant
  workflows/run.ts       ← Inngest workflow with real gates
```

Drop that folder into the new repo at Phase 1 and build outward from it.

---

## Phase 0 — commit what exists (15 minutes, do this first)

`main` has **zero commits**. Everything in `D:\Analyst_Designer\Convenium.Design` is one bad `rm` from gone.

> Initialise version control for this repository properly. It is a git repo with no commits on `main`.
>
> 1. Extend `.gitignore` so it also excludes `convenium-design-studio/data/` (all of it, not just `*.jsonl`), `convenium-design-studio/knowledge/skills/**/README.md`, and any `.env*` beyond `.env.example`.
> 2. Make one initial commit of the whole tree, message: `Initial commit: Olympus context pack + Convenium.Design Studio prototype`.
> 3. Create and check out a branch `legacy/local-prototype`, then return to `main`.
> 4. Print `git log --stat --oneline` so I can confirm what was captured.
>
> Do not refactor, rename, or "fix" anything while doing this. The point is to preserve the current state exactly, including its bugs.

**Skill:** none. **Verify:** `git log` is non-empty; `git status` is clean.

---

## Phase 1 — new repo skeleton + skill ingestion

The 26 `SKILL.md` files are the asset. Everything else is scaffolding.

> I am building Convenium.Design, a hosted SaaS that runs gated, evidence-led design workflows. Read `CONVENIUM-DESIGN-PRODUCT-ARCHITECTURE.md` in this folder completely before writing code.
>
> Scaffold a new Next.js 15 App Router + TypeScript project in `convenium-design-app/`, with:
> - Drizzle + Postgres (Neon). Use the schema in `convenium-design-starter/db/schema.ts` verbatim as `convenium-design-app/db/schema.ts`; generate and apply the initial migration.
> - Clerk for auth, with organizations enabled.
> - A `lib/tenancy.ts` helper that resolves the current `orgId` from the session, and a rule — documented in `convenium-design-app/AGENTS.md` — that **no query may be written without an orgId filter**.
> - A seeding script `scripts/seed-skills.ts` that walks `../.agents/skills/*/SKILL.md`, parses YAML frontmatter (`name`, `description`, and Convenium.Design extensions `convenium-design.id`, `convenium-design.phase`, `convenium-design.category`), stores the **full markdown body** as `skill_versions.body`, and computes `sourceHash` (sha256) so re-running is idempotent and only writes a new version when the body actually changed.
> - One page at `/skills` listing seeded skills grouped by category, showing name, phase, version and body length.
>
> Report any `SKILL.md` whose frontmatter is missing or malformed rather than guessing defaults — I will fix them in Phase 1b.
>
> Do not build the planner, runs, billing, or the marketing site yet.

**Skill:** none for scaffolding. **Verify:** sign up → `/skills` shows all 26 with non-zero body length; re-running the seed creates no new versions.

### Phase 1b — normalise the SKILL.md frontmatter

Only if Phase 1 reports malformed files (it will — the GSAP and Higgsfield skills come from different upstreams).

> Use the `skill-creator` skill. I need all `SKILL.md` files under `.agents/skills/` to share one frontmatter contract so my ingestion parser has a stable input.
>
> Required keys: `name`, `description`. Convenium.Design extensions under an `convenium-design:` block: `id` (kebab-case, matching the folder), `phase` (one of diagnose|direct|prepare|build|verify), `category`.
>
> Audit all 26 folders, report which are non-conforming and how, then fix them — editing **only** frontmatter. Never alter a skill's body: the vendored GSAP and Impeccable skills are third-party and their licences are recorded in `third-party/`.

**Skill:** `skill-creator`.

---

## Phase 2 — the planner (no model calls, no cost)

> Read `convenium-design-starter/core/planner.ts` and `convenium-design-starter/core/planner.test.ts`. Copy both into `convenium-design-app/core/`. Run the tests — all 10 must pass.
>
> Then build on top of it:
> 1. A migration that seeds one Convenium.Design-template `system` row (orgId null) whose `agents` JSON is the eight Olympus specialists, expressed in the new `AgentConfig` shape. Port them from `convenium-design-studio/agents.mjs` — but convert `triggers: string[]` into weighted `signals`, add `requires`/`vetoes` where the activation rule implies them, replace `budget` with `effort`, and add the `dependsOn`/`outputs` edges that make the DAG real. `evidence-analyst → experience-designer → {motion,spatial,media} → design-engineer → {verification,measurement}`.
> 2. A Zod schema for `AgentConfig`, validated on every write to `systems.agents`.
> 3. A server action `planRun(projectId, brief)` that creates a `runs` row with status `planned`, stores the frozen plan, and returns it. **It must make zero model calls.**
> 4. A `/projects/[id]/plan` page showing the route: ordered steps, which skills each pins, what each consumes and produces, which gates will block, which agents stayed dormant and why, and the effort estimate.
>
> Add tests for the seeded system: assert that a realistic redesign brief routes through the expected agents in the expected wave order.

**Skill:** none — plain TypeScript. **Verify:** a brief you'd actually type produces a route you'd trust, having spent nothing.

---

## Phase 3 — the run engine and real gates (the proof point)

Get here before spending a cent on inference. If a fully gated run completes end to end against a mock executor, everything after is plumbing.

> Read `convenium-design-starter/workflows/run.ts` — it is the intended shape, written against Inngest, with stubbed imports.
>
> 1. Install and configure Inngest for Next.js (`/api/inngest` route, dev server).
> 2. Implement `db/queries.ts` with every function `workflows/run.ts` calls. Every one takes `orgId` and filters on it.
> 3. Implement `core/executor/index.ts` exporting the `Executor` interface from the architecture doc, plus **`MockExecutor` only** — deterministic fixture artifacts keyed by agent id, ~200ms latency, fake but clearly-labelled token counts. Select it via `CONVENIUM_DESIGN_EXECUTOR=mock`.
> 4. Implement gate resolution: a server action `resolveGate(runId, gate, decision, note)` that writes a `gate_decisions` row **with the acting user id** and then sends the `convenium-design/gate.resolved` Inngest event. This action is the *only* path that emits that event.
> 5. A `/runs/[id]` page: live step timeline via SSE over `run_events`, artifacts as they land, and — when the run is blocked — a gate panel showing the evidence and Approve / Revise / Reject.
>
> Critical: a gate must be resolvable **only** by an authenticated member of the owning org through this action. Nothing else in the system may emit `convenium-design/gate.resolved`.
>
> Write an integration test that drives a full run: plan → Gate A → steps → Gate B → steps → Gate C → complete, asserting the workflow genuinely suspends at each gate.

**Skill:** none — Inngest's docs are the reference. **Verify:** a complete gated run, zero inference spend, and the run survives restarting the dev server mid-gate.

---

## Phase 4 — hosted execution

> Implement `HostedExecutor` against the `Executor` interface.
>
> For each step it must: load the **pinned** `skill_version.body` for every skill the step declares (full text, never a summary); load the input artifacts the step depends on; compose one request as system instructions + skill bodies + input artifacts + brief; call the provider with a timeout and bounded retry on 429/5xx; persist the output as an immutable artifact in R2 with a content hash; record real `inputTokens`/`outputTokens` from the response.
>
> Requirements:
> - Prompt-cache the skill bodies — they are large, static, and repeat across every step and every customer.
> - If the provider returns an incomplete or truncated response, mark the step **failed**. Never present a truncation as an answer. (The prototype did exactly this at `server.mjs:37`.)
> - Enforce the run's credit ceiling before dispatch; fail closed.
> - Any claim in an artifact not backed by a stored input artifact must be marked unverified. We do not ship fabricated evidence.
>
> Keep `MockExecutor` working and keep the whole test suite running against it.

**Skill:** none. **Verify:** a real run produces artifacts you'd send a client, and `run_steps` token totals reconcile against the provider dashboard.

---

## Phase 5 — billing

> Add Stripe: a subscription plus metered credit top-ups. Credits move only through `credit_ledger`; balance is `SUM(delta)` — never a mutable counter. Webhook handlers must be idempotent on `stripeEventId` (the unique index is already in the schema). Add a `/settings/usage` page showing balance, recent runs, and per-run credit consumption.

**Skill:** `dataviz` — read it before writing the usage chart.

---

## Phase 6 — UI

Separate design round. Do not start it inside an implementation session.

**Skills:** `frontend-design`, `design:design-system`, `design:accessibility-review`, `design:ux-copy`.
**Not** `awwwards-web-design` — its own description excludes dashboards and internal tools, and Convenium.Design's console is one. Save it for a marketing site.

---

## Phase 7 — optional BYO-agent tier

> Use the `mcp-builder` skill. Add `McpExecutor` plus a hosted MCP server so a customer's own Claude Code / Codex / Cursor performs the steps while Convenium.Design keeps planning, gating, artifacts and billing. Expose: `convenium_design_get_run`, `convenium_design_next_step` (returns the step spec, its input artifacts, and skill bodies), `convenium_design_submit_artifact`, `convenium_design_request_gate`.
>
> `convenium_design_resolve_gate` must **not** exist as a tool. Gates are resolved by humans in the web app only.

**Skill:** `mcp-builder`.

---

## Carry-forward bug list

Fixed by construction in the rewrite — but verify each, because it's easy to reintroduce them:

| # | Bug | Fixed by |
|---|---|---|
| S1 | Two agent registries, one inert | Single `systems.agents` column |
| S2 | Synthesis clamped to 1000 tokens | Budgets deleted; effort levels instead |
| S3 | Non-existent model IDs | Executor owns model choice, config-driven |
| S5 | Hardcoded agent-id override of user config | Deleted with `specializedSkills` |
| S6 | Unlocked concurrent JSON writes | Postgres transactions |
| S7 | No CSRF/origin protection | Auth on every route |
| S8 | Arbitrary file read via `previewPath` | Object storage + signed URLs |
| S9/S10 | No timeouts; truncation reported as success | Phase 4 requirements, explicitly |
| S11 | Event log re-parsed per poll | Indexed table + SSE |
| S12 | Knowledge sources never reach the model | Skill body **is** the source |
| S15 | Keyword matching with no negation | Scored signals + vetoes (tested) |
| S16 | Zero commits | Phase 0 |
| S17 | No tests | Phases 2 and 3 both ship tests |

Two more, found while porting: the original matcher was **plural-blind** (`"images"` never matched the signal `"image"`), and `recordSystemOutput` **overwrote history in place** when a `runId` repeated. Both are fixed in the starter code — immutable artifacts with an `attempt` counter, and suffix-tolerant matching.
