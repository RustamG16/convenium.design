# Convenium.Design — product architecture (SaaS)

Target: turn the local Olympus/Convenium.Design prototype into a hosted product.
Written 14 Aug 2026. Decisions below are **made, not asked** — override any of them and I'll re-cut the plan.

---

## 0. "SaaS or an app?" — this is not a fork

They are the same decision made twice. Build an **API-first hosted web product**. A desktop or mobile app is then a *client* of that API, shipped later if there's demand, with zero architectural change.

What matters is the axis you actually have to choose on, which is **who pays for and performs the model work**:

| | Convenium.Design executes | Customer's agent executes |
|---|---|---|
| Customer needs | Nothing. Sign up, get output. | Claude Code / Codex / Cursor installed |
| Your cost | Inference is your COGS | ~zero marginal cost |
| Market | Anyone with taste and a budget | Developers who already run agent CLIs |
| Pricing | Subscription + metered credits | Flat seat price |

**Decision: build "Convenium.Design executes" as the product, and keep "customer's agent executes" as an interface, not a second product.** A paying non-technical customer must get a result without installing a CLI — that is the whole premise of the taste-first user in your own `handoffs/phase-3/START-HERE.md`. But execution sits behind one `Executor` interface with two implementations, so the BYO-agent tier is a plan flag rather than a rewrite. You need that interface anyway to test without spending money.

This reverses the recommendation I gave for the local tool, and it should: a control plane that delegates to the user's laptop cannot be sold to someone who doesn't have the laptop set up.

---

## 1. Honest salvage assessment

This is a **rewrite, not a refactor**. What carries over:

| Survives | Why |
|---|---|
| `.agents/skills/*/SKILL.md` (~26 skills, 400KB) | The actual intellectual property. Becomes seeded, versioned DB content. |
| The gate model (A/B/C) and the Olympus sequence | The product's differentiator. Becomes a durable state machine. |
| `templates/` 00–09 | Artifact contracts. Become typed artifact schemas. |
| Credential scrubber (`events.mjs:18-40`) | Genuinely good. Port as-is. |
| The planner's *intent* (route by activation condition, keep the rest dormant) | Port the idea, rewrite the code with scoring + a DAG. |
| The no-fabrication / provenance rules in `AGENTS.md` | Stop being style guidance and become product liability policy. |

What does not survive: the Node HTTP server, all JSON file stores, `agents.mjs`'s dual registry, `skills.mjs`, the vanilla-JS frontend, `where.exe` host detection, `runLive`/`runDemo`, `/api/compare`, and the `.mcp.json`/`.codex`/`.cursor` project configs (they become an optional integration, not the delivery mechanism).

Roughly 25% of the repo by value, 5% by line count.

---

## 2. Stack

Chosen for a solo builder shipping a metered, long-running, human-gated AI product — not for maximum flexibility.

| Layer | Choice | Why this one |
|---|---|---|
| App | **Next.js (App Router) + TypeScript** | One deployable for UI + API. Server Actions remove a whole API layer. |
| Hosting | **Vercel** | Matches the above; move to a container later if egress bites. |
| DB | **Postgres** (Neon or Supabase) + **Drizzle** | Every S6-class bug (lost updates, torn writes, no migrations) disappears by construction. Drizzle keeps SQL visible. |
| Auth | **Clerk** or **WorkOS** | Do not build auth. Orgs/teams out of the box. |
| Artifacts | **Cloudflare R2** (S3 API) + signed URLs | Every S8-class bug (path traversal, mime confusion) disappears by construction. |
| **Run engine** | **Inngest** | The critical choice — see §3. |
| Billing | **Stripe** + a credit ledger table | Metered usage on top of a subscription. |
| Models | Provider SDK behind an `Executor` interface | Never call a provider directly from a route handler. |
| Realtime | SSE over the DB event log | Same event model you already have, minus the full-file re-parse. |

---

## 3. The run engine is the architecture

An Convenium.Design run is **long-lived, resumable, and blocks on a human** — potentially for days at Gate B. That is not a request/response, and it is not a cron job. Trying to hold it in an HTTP handler is precisely why the current `handleOracle` had to collapse the whole workflow into one synchronous fan-out.

Durable execution engines exist for exactly this shape, and the human-approval case is a first-class primitive rather than something you assemble. In Inngest it is `step.waitForEvent`, which suspends the function — not a process, not a paid worker — until a matching event arrives or a timeout fires ([Inngest docs](https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event)). The category is well-populated as of 2026 (Temporal, Inngest, DBOS, Restate, Trigger.dev), and the trade-offs are documented ([Upstash comparison](https://upstash.com/blog/durable-workflow-engines-compared-every-major-option-in-2026), [Reactify on durable AI agents](https://www.reactify-solutions.com/articles/durable-ai-agents-2026)).

**Pick Inngest** over Temporal for this project: Temporal is more powerful and dramatically heavier to operate; you are one person and Temporal wants a cluster. Revisit only if you outgrow it.

The Olympus workflow expressed directly:

```ts
export const runOlympus = inngest.createFunction(
  { id: 'olympus-run', concurrency: { key: 'event.data.orgId', limit: 2 } },
  { event: 'convenium-design/run.requested' },
  async ({ event, step }) => {
    const plan  = await step.run('plan', () => buildPlan(event.data))      // pure, free
    const audit = await step.run('audit', () => executor.run(plan.steps.audit))

    await step.run('request-gate-a', () => openGate(runId, 'A', audit))
    const gateA = await step.waitForEvent('gate-a', {                       // ← blocks. days if needed.
      event: 'convenium-design/gate.resolved',
      match: 'data.runId',
      timeout: '14d'
    })
    if (!gateA || gateA.data.decision === 'reject') return abandon(runId)

    const concepts = await step.run('concepts', () =>
      executor.run(plan.steps.concepts, { inputs: [audit] }))              // ← receives prior output
    ...
  }
)
```

Two things this fixes that no amount of patching the current code would:

**Gates become physically enforced.** The workflow cannot advance without a `gate.resolved` event, and that event is only ever emitted by an authenticated human action in the app. This is the "human-only gate" idea from the local design, but now it is the engine's semantics rather than a convention.

**Steps consume prior steps.** `executor.run(step, { inputs: [audit] })` is the single most important line in this document. The current system's defining flaw is that every specialist receives the raw prompt and nothing else (`server.mjs:141`). In a local toy that produces incoherent output. In a SaaS it produces incoherent output *and* burns your margin on N redundant full-prompt calls.

---

## 4. Domain model

```
organization ──< membership >── user
     │
     ├──< project ──< run ──< run_step ──< artifact
     │                 │        │
     │                 │        └──< step_event      (token usage, status, timing)
     │                 └──< gate_decision            (gate, decision, actor, evidence, at)
     │
     ├──< style_profile        ("Creative DNA" from PHASE-2-PRODUCT-MODEL.md)
     ├──< system               (an agent configuration; the current "systems.json")
     │      └──< agent         (role, phase, skill refs, triggers, effort)
     └──< credit_ledger        (+purchases, −run consumption; append-only)

skill ──< skill_version        (global, seeded from SKILL.md, immutable versions)
```

Non-negotiables:

- **Every table except `skill*` carries `org_id`**, and every query is scoped by it. If you use Supabase, add RLS as a second line of defence — never as the first.
- **`run_step` records real token usage per step**, from the provider response, written before the step is marked complete. Your own constraint says absent telemetry must read "not reported", never zero (`STATE.json:83`). In a metered product this stops being a principle and becomes the invoice.
- **`artifact` is immutable and content-addressed.** Re-running a step produces a new artifact and a new `run_step`, never an overwrite. The current `recordSystemOutput` splices over an existing entry by `runId` (`systems.mjs:190-200`) — that is how audit trails get destroyed.
- **`gate_decision` is append-only** and records the actor. This is your evidence that a human approved before spend, which matters for both disputes and trust.
- **Skill versions are immutable.** A run pins the version it used. Otherwise editing a skill silently changes what past runs claim to have done.

---

## 5. The Executor interface

```ts
interface Executor {
  run(step: PlannedStep, ctx: { inputs: Artifact[]; orgId: string; runId: string })
    : Promise<{ artifact: Artifact; usage: TokenUsage }>
}
```

Three implementations:

- `HostedExecutor` — real provider calls with Convenium.Design's key. Loads the pinned `skill_version.body` (the **full** SKILL.md, not a one-line summary), the step's `inputs`, and the system instructions. Enforces a hard per-run credit ceiling *before* dispatch, and records usage after.
- `MockExecutor` — deterministic fixtures. Every test and every CI run uses this. This is what "demo mode" should have been: a test seam, not a product mode.
- `McpExecutor` — later, for the BYO-agent tier. Emits a step spec over MCP and waits for `convenium_design_submit_artifact`.

Rules that must hold at the interface: the executor never delegates (no nested spawning), never sees another org's data, and always writes usage even on failure.

---

## 6. Cost model — the thing that decides whether this is a business

Fan-out is a margin problem now. Concretely, with the current design a 6-specialist run re-sends the full prompt and system instructions 7 times. In a product where you pay for tokens, that is your gross margin.

Controls, in order of importance:

1. **Sequential DAG with real inputs.** Later steps read the *artifact* of earlier steps, not the raw brief. Prompt size stays roughly flat instead of compounding.
2. **The planner is free.** `buildPlan` is pure and deterministic. Every customer can see their route, cost estimate, and dormant agents before spending a credit. Keep this — it is the current system's best idea and it's a genuine trust feature.
3. **Pre-flight credit check + hard ceiling per run.** Reserve credits at plan time; release the remainder at completion.
4. **Cache the skill bodies at the provider.** Skill text is large, static, and repeated across every step and every customer — the ideal prompt-cache payload.
5. **Gate A before any expensive step.** A human confirms the brief while spend is still near zero. Your workflow already had this instinct; the product makes it a cost control.

---

## 7. What the product must not do

Your `AGENTS.md` rules were written as craft guidance. As a paid product they are policy, and two of them carry real exposure:

- **Asset provenance and rights.** The moment you sell generated media, `asset-director`'s manifest ("what the user should provide, provenance and rights needs") stops being a checklist and becomes the record you rely on in a dispute. Store rights metadata on every artifact.
- **No fabricated evidence.** "Do not invent analytics data, user research, asset rights, or browser verification" is a refund-and-churn issue when a customer acts on an invented audit. The executor must mark any claim not backed by a stored artifact.

Add to these: a data-deletion path (customers will ask), and per-org isolation of uploaded brand material.

---

## 8. Sequencing

Ship in this order. Each phase is independently useful and independently abandonable.

| Phase | Outcome | Ship gate |
|---|---|---|
| 0 | Commit the current repo. Nothing is in git. | `git log` is non-empty |
| 1 | Skeleton: Next.js + Postgres + auth + org model + skill seeding from SKILL.md | Sign up, see the skill catalog |
| 2 | Planner ported, pure, tested. Route + cost estimate visible. **Zero model calls.** | A brief produces a plan you'd trust |
| 3 | Inngest run engine + Gates A/B/C + `MockExecutor` | A full gated run completes end to end, free |
| 4 | `HostedExecutor` + artifacts in R2 + usage recording | A real run produces real artifacts |
| 5 | Stripe + credit ledger + ceilings | You can charge |
| 6 | UI pass (separate design round) | — |
| 7 | `McpExecutor` / BYO-agent tier | Optional |

Phase 3 is the proof point: if a fully gated run works end-to-end against `MockExecutor`, everything after it is plumbing you already know how to build. Get there before spending a cent on inference.

---

## 9. Skill mapping for implementation

| Phase | Skill | Note |
|---|---|---|
| 1 — skill seeding | **`skill-creator`** | Normalise frontmatter across all 26 `SKILL.md` files so the parser has a contract |
| 2 — planner | *none* | Pure TypeScript + `node:test`. Don't force a skill onto it. |
| 3 — run engine | *none* | Inngest docs are the reference |
| 6 — UI | `frontend-design`, `design:design-system`, `design:accessibility-review`, `design:ux-copy` | Next round |
| 6 — charts (usage/credits) | **`dataviz`** | Read before writing the first chart |
| 7 — MCP tier | **`mcp-builder`** | Directly on point |

Not applicable despite appearances: `awwwards-web-design` excludes dashboards and internal tools by its own description, and Convenium.Design's console is one. The GSAP skills apply only if a marketing site justifies them — not the app.

---

*Sources: [Inngest — Wait for an Event](https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event) · [Inngest — Durable execution for AI agents](https://www.inngest.com/blog/durable-execution-key-to-harnessing-ai-agents) · [Upstash — Durable workflow engines in 2026](https://upstash.com/blog/durable-workflow-engines-compared-every-major-option-in-2026) · [Reactify — Durable AI agents in 2026](https://www.reactify-solutions.com/articles/durable-ai-agents-2026)*
