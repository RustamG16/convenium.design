# USAGE.md — the runbook

## What this system does

Convenium.Design takes a business from its Brand DNA — who it serves, how it should look and sound,
what it needs made — to a verified, built design, as a single Design Director that routes
work through explicit approval gates, activating one skill or specialist at a time instead of
loading every design capability at once. The method, token rules, and loop bounds are in
`AGENTS.md`; the routing table is in `ARCHITECTURE.md`; the skill and agent source of truth
is `library/`.

## The gates, in three sentences

**Gate A** freezes the brief, the list of products to make, and the single design direction
(resolved from the Brand DNA, not by generating options). **Gate B** confirms that direction before
any production code is written. **Gate C** is the client review of the verified
implementation, with before/after evidence, asset provenance, and how success will be
measured.

## Connect a project (once per project)

```bash
python library/tools/apollo.py attach <PROJECT_FOLDER>
```

In Claude Code, also install the plugin once per machine (`/plugin marketplace add
<this folder or RustamG16/convenium.design>`, then `/plugin install convenium-design@convenium-design`) — or start the
session with `claude --add-dir <this folder>`.

## Kickoff — Claude Code

Open the project, then send:

> Read `.olympus/APOLLO.md`, then Convenium.Design's `ARCHITECTURE-ESSENTIALS.md`, `AGENTS.md` and
> `START-HERE.md` completely before acting. Act as the Convenium.Design Design Director for
> `<BUSINESS / PROJECT>`. Start with the Brand DNA (the `brand-strategist` agent) unless
> `.olympus/brand-dna.json` exists, then ask only the intake questions it leaves open. Do not
> edit production code yet. Route skills from `library/registry/ROUTING-DIGEST.md`, respect
> Gates A/B/C and the loop bounds in `AGENTS.md`, and write everything to `.olympus/`.

## Kickoff — Codex

Open the project, then send:

> Read `.olympus/APOLLO.md` and follow its read order before acting. Act as the Convenium.Design Design
> Director for `<BUSINESS / PROJECT>`. Start with the Brand DNA (the brand-strategist
> instructions in Convenium.Design's `library/agents/brand-strategist.md`) unless
> `.olympus/brand-dna.json` exists, then ask only the intake questions it leaves open. Do not
> edit production code yet. Route skills from Convenium.Design's `library/registry/ROUTING-DIGEST.md`
> (skills are `$name` tokens), respect Gates A/B/C and the loop bounds in `AGENTS.md`, and
> write everything to `.olympus/`.

Codex-specific mechanics (skill tokens, sandboxed agents, the opt-in MCP server) are in
`PROMPT.md`. Do not start a new task for every phase; the durable `.olympus/` artifacts are
the handoff if a new task becomes necessary.

## Follow-up commands (either host)

- "Gate A approved. Detail the one direction from the brief; do not implement."
- "Run the independent critique against the frozen direction."
- "Gate B approved with these changes: … Prepare the asset manifest and build plan."
- "The asset manifest is approved. Implement the first bounded slice and show browser evidence."
- "Run final visual QA. Apply the AGENTS.md loop bounds and surface remaining tradeoffs."
- "I want two alternative directions as well — here is why: …" (alternatives are opt-in)

## Rebuild the projections

`library/` is the only place to edit skills, agents, and the registry. After any change:

```
python library/tools/project.py all      # regenerate .claude/ .agents/ .codex/ .claude-plugin/ convenium-design-studio/knowledge/
python library/tools/verify.py            # the single health check — exit 0 = clean
python library/tools/build_index.py       # refresh library/INDEX.md
```

`project.py <claude|codex|studio|digest|plugin>` runs one projector; add `--dry-run` to preview.

## The Studio

`convenium-design-studio/` is an optional local control plane (Node ≥20): `npm --prefix convenium-design-studio
start`, then `http://127.0.0.1:4173`. It reads the same `library/registry/` data via
`skills.mjs`. `npm --prefix convenium-design-studio run check` syntax-checks it.
