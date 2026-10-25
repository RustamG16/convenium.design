# Convenium.Design — architecture & orchestration review

Reviewed: `D:\Analyst_Designer\Convenium.Design` (Olympus context pack + `convenium-design-studio/`), 14 Aug 2026.
Scope of this document: **architecture and orchestration only.** UI is reviewed separately.

---

## 1. The structural problem: two products in one repo

The repo contains two different things that share a name and contradict each other.

**Olympus** (`START-HERE.md`, `AGENTS.md`, `ARCHITECTURE.md`, `.agents/skills/`, `.codex/agents/`, `templates/`) is a *prompt/context pack*. The runtime is the host — Codex, Cursor, Claude Code. Its value is the gated workflow: intake → audit → Gate A → 3 concepts → Gate B → build → QA → Gate C. It is well written and internally coherent.

**Convenium.Design Studio** (`convenium-design-studio/`) is a *local Node app* that calls the OpenAI Responses API itself, with its own agent registry, its own skill catalog, its own event log, and its own planner. It re-implements the orchestration in code — badly, and with none of the gates.

The consequence is that almost every concept exists twice, in two incompatible representations:

| Concept | Representation A | Representation B | Drift |
|---|---|---|---|
| Skills | `.agents/skills/*/SKILL.md` (rich, 2–25 KB, the real thing) | `skills.mjs` one-line `runtimePrompt` strings | Total. The studio never reads a single SKILL.md. |
| Skills again | `skills.mjs` (21 built-ins) | `knowledge/index.json` custom skills (1) | Two registries merged at read time |
| Skills a third time | `skills-lock.json` (8 Higgsfield skills, hashed) | not referenced by anything in `convenium-design-studio/` | Dead registry |
| Agents | `agents.mjs → agentDefinitions` + `knowledge/agents.json` | `data/systems.json → system.agents` | **Only B affects planning. A is inert.** |
| Workflow | Olympus Gates A/B/C | `plan.steps[].approval` boolean | Gates do not exist at runtime |
| Phases | `START-HERE.md` sequence | `phaseByAgent` map in `systems.mjs` | Phases are labels, never enforced |

**This is the root cause of most of the bugs below.** Nothing is a single source of truth.

---

## 2. The orchestration is not orchestration

`handleOracle` (`server.mjs:113-158`) advertises a planner, specialists, phases, budgets and gates. What it actually does:

```
buildPlan(prompt)                        # keyword regex → list of agents
  ↓
for batch of 2:                          # concurrency hardcoded = 2
    requestOpenAI({ input: prompt, ... }) # ← every specialist gets the RAW PROMPT
  ↓
requestOpenAI(synthesis of all packets)
```

Every specialist receives the **same original user prompt** and nothing else. The Design Engineer never sees the Evidence Analyst's findings. The Verification Critic never sees the implementation. There is no dependency graph, no state passed between steps, no ordering that matters.

That is a **fan-out/fan-in ensemble**, not a pipeline. Concretely:

- **Phases are decorative.** `phase` is used for UI lane grouping and nothing else. Batching is by `priority` sort, so `Evidence Analyst` + `Experience Designer` run *simultaneously* — the designer is designing before the audit exists.
- **Cost scales linearly for no benefit.** 6 matched specialists = 7 model calls, each re-paying the full input prompt, to answer one question. The Olympus docs explicitly warn against exactly this ("Broad agents tend to load overlapping guidance, independently reinterpret the brief… high token use with low design coherence", `ARCHITECTURE.md:83`). The studio does the thing the pack was written to prevent.
- **Gates A/B/C are absent.** The only approval mechanism is `approvedAgentIds` passed up-front in the same request (`server.mjs:122`). It is a checkbox, not a gate: no run is ever paused, persisted, and resumed. There is no run state machine at all.
- **`plan.system.instructions` is prepended to every specialist**, so all N calls also carry the orchestrator's rules. More duplication.
- **`concurrency: 2` is hardcoded** in `agents.mjs:74` and contradicts `AGENTS.md:32`, which permits two parallel workers *only for independent read-only evidence*.

---

## 3. Confirmed bugs

Ordered by severity. File:line refers to the current working tree.

### S1 — `/api/agents` is a dead control surface
`agents.mjs:21-37` (`listAgents`/`updateAgent`) reads and writes `knowledge/agents.json`.
`agents.mjs:53-57` (`buildPlan`) reads `getActiveSystem().agents` from `data/systems.json`.

They are different stores. The **Agents view in the UI is fully interactive and completely inert** — toggling an agent off, changing its budget, or setting "approval required" has zero effect on any run. `app.js:602` renders one list; `app.js:152` renders the other. Two UIs, two datasets, same nouns.

### S2 — the final answer is permanently truncated to ~1000 tokens
`server.mjs:152`:
```js
maxOutputTokens: Math.min(10_000, Math.max(1000, budget - plan.allocatedBudget))
```
`buildPlan` scales specialist budgets so that `allocatedBudget ≈ requestedBudget` (`agents.mjs:62-67`). Therefore `budget - allocatedBudget ≈ 0` on essentially every run, and the synthesis — the only output the user reads — is clamped to the 1000 floor. The specialists get 8000 each; the answer gets 1000.

### S3 — model IDs are not real OpenAI models
`server.mjs:17`: `['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']`. These are not published OpenAI API model identifiers. Live mode has, as far as I can tell, **never been executed successfully** — every request would return a 400/404. This is consistent with `STATE.json:68` recording `"mode": "demo"` and `tokenUsage.status: "unavailable"`. Demo mode is the only path that has ever been exercised.

### S4 — dangling skill reference silently drops capability
`agents.mjs:11` gives `spatial-engineer` the skills `['webgl-experience','three-js-implementation']`. `three-js-implementation` does not exist in `skills.mjs`; it lives in `knowledge/index.json` as a custom skill. `composeInstructions` (`server.mjs:39-49`) does `inventory.find(...)` and silently `.filter(Boolean)`s misses. Here it happens to resolve — but the general pattern means **any typo'd or disabled skill vanishes with no warning to the user or the log**. The plan UI will still display it as active.

### S5 — hardcoded agent id overrides user configuration
`agents.mjs:39-49` `specializedSkills()` branches on `agent.id === 'motion-engineer'` and returns a hardcoded GSAP list. Cloned systems keep the id, so a user who edits the Motion Engineer's skills in the Systems view has those edits **silently discarded at plan time**.

### S6 — lost updates across two processes, no atomic writes
`systems.mjs` and `knowledge.mjs` both do read-JSON → mutate → `writeFile` with no lock. `server.mjs` (HTTP) and `mcp-server.mjs` (stdio, launched independently by Codex/Cursor/Claude Code per `.mcp.json`) are **separate processes mutating the same `data/systems.json` and `knowledge/index.json`**. Concurrent writes lose data; a crash mid-write truncates the file. There is no `.tmp` + `rename` and no schema/version migration.

### S7 — CSRF / DNS-rebinding on a server that spends money
The server binds `127.0.0.1` (good) but has **no `Origin` check, no `Host` check, no token, and ignores `Content-Type`** (`readJson`, `server.mjs:26-35`, parses any body). Any web page the user has open can `fetch('http://127.0.0.1:4173/api/oracle/chat', {method:'POST', body:'…'})` with a simple content-type and trigger paid model calls, write files into `knowledge/`, create systems, or read `/api/config`. For a local tool holding an API key this is the one security issue I'd fix before anything else.

### S8 — arbitrary file read via `previewPath`
`systems.mjs:211-222` resolves `output.previewPath` under the Convenium.Design root and correctly blocks `..` — but then does `mime = ext === '.png' ? 'image/png' : 'image/jpeg'` with **no extension allowlist**. Any file under `D:\Analyst_Designer\Convenium.Design` (a `.env`, a SKILL.md, a handoff) can be served over HTTP labelled as a JPEG. `previewPath` is settable via the unauthenticated `POST /api/systems/:id/outputs` and via the MCP tool `convenium_design_save_output`.

### S9 — no timeouts, no retries, no cancellation
Every `fetch` to OpenAI (`server.mjs:52`, `65`) has no `AbortSignal`. A hung upstream hangs the HTTP handler indefinitely; the browser has no cancel button and no way to abandon a run. No backoff on 429/5xx — a rate limit surfaces as a failed specialist with a raw error string.

### S10 — incomplete responses are reported as success
`outputText()` (`server.mjs:37`) falls back to `'No text output returned.'` and never inspects `body.status`. When the Responses API returns `status: "incomplete"` (max_output_tokens hit during reasoning — likely given S2), the user gets that placeholder string presented as an answer, and the event log records `run.completed`.

### S11 — event log is O(file) on every poll, forever
`events.mjs:65-74` reads and JSON-parses the **entire** `events.jsonl` on every `/api/events` call. The UI polls every 5 s (`app.js:869`). Append-only with no rotation. Also `listEvents` applies `after` filtering *before* `slice(-limit)`, and string-compares ISO timestamps, so events sharing a millisecond can be duplicated or dropped across polls.

### S12 — knowledge "sources" are write-only
`addSource` (`knowledge.mjs:135-154`) writes markdown into `knowledge/skills/<cat>/<id>/sources/`. **Nothing ever reads those files.** `composeInstructions` uses only `skill.runtimePrompt`. The entire source-attachment feature is a no-op with respect to model behaviour, while presenting itself in the UI as knowledge the agent has.

### S13 — Windows-only host detection
`detectCommand` (`server.mjs:161`) shells `where.exe`. `/api/integrations` therefore fails on macOS/Linux, as does `scripts/validate-system.ps1`. Fine if Windows-only is a deliberate constraint — it isn't stated anywhere.

### S14 — everything is a 400
The top-level catch (`server.mjs:253`) returns HTTP 400 for internal failures, so client errors and server bugs are indistinguishable. It can also fire *after* headers are sent by the preview handler (`server.mjs:227-232`), producing an `ERR_HTTP_HEADERS_SENT` crash.

### S15 — trigger matching is a keyword regex with no negation
`agents.mjs:56`. `"design"`, `"website"`, `"ui"` fire the Experience Designer on nearly every prompt. `"Please add no animation"` fires the Motion Engineer. `"generate"` fires the approval-gated Media Producer. There is no scoring, no threshold, no way for the planner to say "no specialist needed".

### S16 — zero commits, and runtime state is tracked
`git log` → *"your current branch 'main' does not have any commits yet."* Every file in this review is uncommitted. `.gitignore` excludes only `convenium-design-studio/data/*.jsonl`, so `data/systems.json` (runtime state, seeded with a `Savra_Restraunt` demo output pointing at `test_projects/`), `knowledge/index.json`, and every generated `README.md` will land in the first commit as source.

### S17 — no tests
`npm run check` is `node --check` — syntax only. There is no test for `buildPlan`, no schema validation on any API body, and no fixture asserting that a given prompt produces a given route. The single most testable, highest-value unit in the system (the planner) is entirely unverified.

---

## 4. What is genuinely good

Worth preserving in any rewrite:

- The **Olympus pack itself** — the gate model, the routing table with explicit "keep dormant when" columns, the context-budget rules, the anti-copying and no-fabrication rules. This is the actual intellectual asset.
- **Zero runtime dependencies.** No supply chain, no `node_modules`, starts instantly.
- **Credential scrubbing in the event store** (`events.mjs:18-40`) — key-name *and* value-pattern checks, recursive, depth-capped. Better than most production code.
- **Path containment** in `serveStatic`, `insideKnowledge`, and the `previewPath` `..` check (the mime allowlist is the only gap).
- **Demo mode as a first-class path** — being able to inspect a route with zero spend is the right instinct, and is the seed of the correct architecture.
- **The handoff discipline** (`handoffs/phase-3/STATE.json` + `START-HERE.md`) — an explicit, resumable, approval-gated boundary between sessions. This pattern should be applied to *runs*, which is exactly what's missing.

---

## 5. The core recommendation

The planner is the valuable part and it is deterministic and free. The specialist fan-out is the expensive part and it degrades the answer. Invert the current emphasis:

**Convenium.Design should plan, gate, and record. The host (Claude Code / Codex / Cursor) should execute.**

That means:
- `buildPlan` becomes a real, tested, dependency-aware planner over a run state machine with Gates A/B/C as first-class, persisted states.
- Skills have one source of truth: the `SKILL.md` files on disk, parsed at boot.
- The MCP server is the primary interface; the web app becomes a control plane and evidence viewer over the same run state.
- The direct OpenAI path is either deleted or demoted to an explicitly-labelled "self-hosted execution" mode — behind correct model IDs, timeouts, and a real budget accountant.

Alternatives and trade-offs are laid out in the next section of the conversation.
