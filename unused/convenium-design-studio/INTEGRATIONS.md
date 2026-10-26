# Convenium.Design host integrations

## Recommendation

Use Convenium.Design as a shared local workspace and MCP control plane. Open `D:\Analyst_Designer\Convenium.Design` in Codex, Cursor, or Claude Desktop, let each host keep its own supported sign-in, and expose only explicit Convenium.Design resources and tools:

- skill and agent registry;
- knowledge sources and project artifacts;
- plan creation and approval state;
- opt-in run events and results.

This preserves subscription authentication inside the product that issued it. Convenium.Design should never import browser cookies, bearer tokens, or private session storage.

## What can and cannot be mirrored

Convenium.Design can show a cross-host activity feed only when the host explicitly forwards messages or run events through an MCP tool, CLI bridge, or local HTTP adapter. It cannot transparently read the private conversation UI of Codex, Cursor, or Claude Desktop. That is a deliberate security boundary, not a missing frontend switch.

The current Studio provides a working Oracle chat for demo and OpenAI API execution, reusable active-system configurations, shared MCP context/events, command diagnostics for supported host bridge work, and a Runs view that groups explicit MCP lifecycle events by run ID and phase. Phase events can carry the responsible agent and actual token usage; absent historical telemetry is shown as unavailable rather than estimated. It does not claim full transcript sync.

## Options

### 1. Shared Convenium.Design MCP server — implemented

The same dependency-free STDIO server is now configured at project scope for all three hosts. The host uses its own login/subscription, while Convenium.Design receives only explicit tool calls. This is the cleanest route for shared skills, knowledge, approvals, and artifacts.

| Host | Project configuration | Verification |
| --- | --- | --- |
| Codex | `.codex/config.toml` | Restart in this folder, then use `/mcp` or `codex mcp list`. |
| Cursor | `.cursor/mcp.json` | Open Cursor in this folder and inspect MCP tools; the CLI can also run `cursor-agent mcp list`. |
| Claude Code | `.mcp.json` | Open Claude Code, approve the project server, then use `/mcp` or `claude mcp list`. |

All three configurations launch `convenium-design-studio/mcp-server.mjs`. It exposes:

- `convenium_design_get_context` for enabled skill and agent definitions;
- `convenium_design_create_plan` for zero-token deterministic planning;
- `convenium_design_publish_event` for explicit opt-in activity;
- `convenium_design_save_output` for attaching completed run and artifact previews to a named system;
- `convenium_design_list_events` for Oracle's shared activity feed.

The shared event log is runtime data at `convenium-design-studio/data/events.jsonl` and is git-ignored.

### 2. Supported CLI subprocess bridge — next phase

Use authenticated, documented non-interactive CLIs where available. Codex `exec --json`, Cursor Agent CLI `--print --output-format stream-json`, and Claude Code `--print --output-format stream-json` can return structured run events. The next adapter will normalize those streams behind one Oracle contract. Exact commands remain host-specific and will never be inferred from session files.

Write access will be a separate per-run choice. A connected host is not automatically authorized to edit files, run arbitrary commands, or bypass its approval model.

### 3. Official API keys

Use provider APIs for the most predictable embedded chat and tracing. This is separate metered API billing and is not the same pool as a ChatGPT or Claude consumer subscription.

### 4. Manual shared-folder workflow

Open this repository in the host app, ask it to use Convenium.Design skills, and save outputs under the project. This works today, uses the host subscription, and requires no transcript bridge. The tradeoff is that the Studio shows artifacts and plans rather than the host’s private chat bubbles.

## Current security boundary

- No session-token fields exist in the browser UI.
- No cookies or browser storage are inspected by the server.
- The OpenAI API key, when configured, stays in the server process.
- Provider cards report detection and configuration state, not false connectivity.
- Approval-gated agents remain paused until explicitly approved in the Oracle plan.

## Primary documentation

- OpenAI: [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
- OpenAI: [API billing is separate from ChatGPT](https://help.openai.com/en/articles/8156019-is-api-usage-included-in-chatgpt-plus)
- OpenAI: [MCP and connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- Anthropic: [Claude plans and API Console](https://support.claude.com/en/articles/9876003-does-my-paid-claude-subscription-include-api-usage)
- Anthropic: [Claude Agent SDK with a Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- Cursor: [CLI authentication](https://docs.cursor.com/en/cli/reference/authentication)
- Cursor: [CLI parameters and non-interactive output](https://docs.cursor.com/en/cli/reference/parameters)
- Cursor: [Model Context Protocol](https://docs.cursor.com/context/model-context-protocol)
