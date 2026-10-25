# PROMPT.md — Codex entry point

Codex reads `AGENTS.md` (the doctrine) on its own. This file carries only the Codex-specific
mechanics; the kickoff prompt and follow-up commands are in `USAGE.md`, and the read order is
in `ARCHITECTURE-ESSENTIALS.md`.

## Codex host mechanics

- Skills are `$name` tokens (e.g. `$ux-evidence-audit`); bodies live in `.agents/skills/<id>/`.
- Specialists are `.codex/agents/<name>.toml`. `sandbox_mode = "read-only"` agents cannot write.
- The Convenium.Design Studio MCP server is opt-in for Codex: see `.codex/config.example.toml`.
- Rebuild the projections after any `library/` edit: `python library/tools/project.py all`.
