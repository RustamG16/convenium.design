# Convenium.Design Orchestration Studio

A working local control plane for Convenium.Design architecture, conditional specialist routing, filesystem-backed knowledge, Oracle chat, and same-prompt skill experiments.

Convenium.Design also ships a dependency-free local MCP server that connects Codex, Cursor, and Claude Code to the same explicit skill context, planner, and event feed while each host keeps its own supported login.

## Run

From `D:\Analyst_Designer\Convenium.Design\convenium-design-studio`:

```powershell
npm.cmd start
```

Open `http://127.0.0.1:4173`.

`npm.cmd start` runs in watch mode and restarts the local server when Studio source or built-in capability files change. Use `npm.cmd run start:once` only when a fixed, non-watching process is explicitly required.

The app starts in demo mode without credentials. Demo results validate routing and interaction but are clearly labeled and do not call a model.

For live comparisons, set an API key in the process environment before starting the server:

```powershell
$env:OPENAI_API_KEY = "your-key"
npm.cmd start
```

The key stays on the local server and is never sent to browser storage. Live runs use the OpenAI Responses API. Optional web search can be enabled per variant; other listed MCP tools remain unavailable until their authenticated adapters are implemented.

GSAP 3.15.0 is vendored locally in `public/vendor/gsap.min.js` so workflow motion does not depend on a CDN. The repository-level GSAP notice and license apply.

## What is working

- **Architecture:** resize-safe workflow connections, phase inspection, the active system's agent roster, live skill switches, and honest tool status.
- **Systems:** create, name, duplicate, activate, and delete reusable systems; replace or reorder agents; edit agent/system instructions; assign skills, MCP/tools, plugins, approvals, phases, triggers, and token budgets; inspect each system's output library. Oracle runs are attached automatically, and connected hosts can save visual or text previews through HTTP or MCP.
- **Agents:** reusable specialist templates plus fully editable per-system agent instances with bounded inventory and no nested delegation.
- **Knowledge:** every skill has a categorized folder under `knowledge/skills/`; the UI creates custom skills, moves categories, edits instructions, enables/disables skills, and adds Markdown source notes.
- **Oracle:** local deterministic planning, a 300,000-token total budget ceiling, approval-gated specialists, demo execution, and live Responses API execution when configured.
- **Playground:** two or three same-prompt configurations, parallel execution, run history, and JSON export.
- **Connections:** local detection for Codex, Cursor Agent CLI, and Claude CLI. Detection never reads session cookies or secrets.
- **Shared MCP:** project-scoped Codex, Cursor, and Claude Code configurations; deterministic planning tools; and an explicit cross-host event feed in Oracle and phase-based Runs.

The custom `Three.js Implementation` capability is included as an example of a skill created through the adjustable knowledge UI. Its files live under `knowledge/skills/spatial/three-js-implementation/`.

See [`INTEGRATIONS.md`](./INTEGRATIONS.md) for subscription-safe connection options and the recommended shared-MCP architecture.

## Local APIs

- `GET /api/knowledge`, `POST /api/knowledge/skills`, `PATCH /api/knowledge/skills/:id`
- `POST /api/knowledge/skills/:id/sources`
- `GET /api/agents`, `PATCH /api/agents/:id`
- `GET/POST /api/systems`, `PATCH/DELETE /api/systems/:id`, `PATCH /api/systems/active`
- `POST /api/systems/:id/outputs`, `GET /api/systems/:id/outputs/:outputId/preview`
- `POST /api/oracle/plan`, `POST /api/oracle/chat`
- `GET /api/events`, `POST /api/events`
- `GET /api/integrations`, `POST /api/compare`, `GET /api/health`

`GET /api/health` reports the loaded skill counts, which makes a stale catalog process visible during local diagnosis.

## Shared MCP server

The three project-scoped host configurations launch the same command:

```powershell
node D:/Analyst_Designer/Convenium.Design/convenium-design-studio/mcp-server.mjs
```

The server exposes four tools:

- `convenium_design_get_context` — enabled skills, agents, and hard orchestration constraints;
- `convenium_design_create_plan` — local deterministic planning with no model call;
- `convenium_design_publish_event` — explicit host/run/tool/artifact events for Oracle;
- `convenium_design_save_output` — attach a run or artifact preview to a saved system;
- `convenium_design_list_events` — recent shared events, never private host chat history.

Configuration files live at `../.codex/config.toml`, `../.cursor/mcp.json`, and `../.mcp.json`. Restart each host after opening this project and approve the project MCP server when prompted. Use the host's MCP panel or `/mcp` command to confirm that the five Convenium.Design tools are visible.

## Playground behavior

- Every experiment sends exactly the same prompt and model settings to each enabled variant.
- Each variant has an independent skill set and tool selection.
- Runs execute concurrently to reduce comparison bias from waiting between variants.
- Results record latency, token usage, request ID, and exact configuration.
- The browser stores presets and recent comparison history locally. Runs keeps that browser history separate from MCP-connected host lifecycles, and JSON export includes both sources without merging or deleting their provenance.

## Validation

```powershell
npm.cmd run check
```

Then verify `/api/health`, Oracle planning/demo chat, skill creation/editing, desktop, mobile, keyboard controls, and connector alignment in the browser.
