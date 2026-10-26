# Convenium.Design Studio research

Research date: 2026-08-10.

## Decisions

1. **Keep one manager in control.** Convenium.Design maps best to the manager pattern: the Design Director owns the answer and activated skills contribute bounded judgment. OpenAI's Agents SDK distinguishes this from handoffs, where a specialist takes over the conversation. [OpenAI Agents SDK: orchestration](https://openai.github.io/openai-agents-js/guides/multi-agent/)
2. **Compare deterministic configurations.** Code-driven orchestration is more predictable for speed, cost, and performance; parallel runs are appropriate when variants are independent. The playground therefore sends the same prompt to 2–3 configurations concurrently and records model, skills, latency, and usage. [OpenAI Agents SDK: orchestration](https://openai.github.io/openai-agents-js/guides/multi-agent/)
3. **Guard cost before execution.** Input guardrails can run before expensive model/tool work, while parallel guardrails may already consume tokens. This first slice enforces prompt length, variant count, skill/tool allowlists, and output-token ceilings before the API call. [OpenAI Agents SDK: guardrails](https://openai.github.io/openai-agents-js/guides/guardrails/)
4. **Make traces first-class.** Agent traces should capture generations, tool calls, handoffs, guardrails, and spans. The playground exposes request IDs, latency, token usage, configuration, and exportable run records; an Agents SDK tracing adapter can replace the thin Responses adapter later. [OpenAI Agents SDK: tracing](https://openai.github.io/openai-agents-js/guides/tracing/)
5. **Separate workflow state from durable memory.** LangGraph distinguishes thread-scoped checkpoints from cross-thread stores. Convenium.Design Studio keeps UI presets/history locally now; a production persistence adapter should separate resumable run state from durable configuration. [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
6. **Use fixed workflows for gates, agents for judgment.** LangGraph differentiates predetermined workflow paths from dynamic agents. Convenium.Design's Gate A/B/C path stays explicit; skill behavior inside a run remains model-driven. [LangGraph workflows and agents](https://docs.langchain.com/oss/javascript/langgraph/workflows-agents)
7. **Do not add durability infrastructure prematurely.** Temporal is designed for long-running crash-resilient workflows. It becomes valuable when Convenium.Design runs must resume across process or network failures; the local comparison lab does not need that operational weight yet. [Temporal documentation](https://docs.temporal.io/)
8. **Use the Responses API for current reasoning/tool workflows.** The live adapter uses the Responses endpoint, bounded reasoning effort, output-token ceilings, and optional hosted web search. Current model options follow official OpenAI model guidance. [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
9. **Expose only relevant specialist tools.** Current OpenAI guidance recommends limiting exposed tools and using tool search/deferred namespaces as inventories grow. Convenium.Design therefore creates a deterministic plan first and invokes only matched specialist bundles. [OpenAI tool search](https://developers.openai.com/api/docs/guides/tools-tool-search)
10. **Treat knowledge as indexed resources, not prompt bulk.** OpenAI file search uses vector stores and supports metadata filters. Convenium.Design's local knowledge UI establishes the category, skill, and source metadata needed for a future vector-store adapter without uploading data today. [OpenAI file search](https://developers.openai.com/api/docs/guides/tools-file-search)
11. **Do not reuse consumer session credentials.** ChatGPT/Codex subscriptions and OpenAI API billing are separate, and each supported host owns its own login. Cross-host integration should use MCP, documented CLIs, or official APIs—not copied browser sessions. [Codex with ChatGPT plans](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan), [OpenAI API billing](https://help.openai.com/en/articles/8156019-is-api-usage-included-in-chatgpt-plus)

## Implemented feature boundary

- Real local server and configuration API.
- Live OpenAI Responses calls when `OPENAI_API_KEY` is present.
- Safe demo mode with no external request.
- Two or three same-prompt variants executed in parallel.
- Independent skill combinations and optional hosted web search per variant.
- Dynamic, resize-safe workflow connectors.
- Searchable skill registry, phase filtering, presets, persistence, run history, metrics, and JSON export.
- Explicit adapter status for Browser, Figma, PostHog, Higgsfield, and Chrome DevTools.
- Filesystem-backed categorized skill knowledge with editable metadata and Markdown sources.
- Deterministic specialist planning with bounded budgets, approval gates, and concurrency two.
- Oracle plan-only and demo/live chat paths with a 300,000-token total budget ceiling.
- Host command diagnostics that never read session secrets.

The MCP adapters are declared but not falsely presented as connected. Each requires its own authenticated runtime bridge before it can participate in model runs.
