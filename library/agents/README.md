# library/agents/ — host-neutral agents

Eight agents: the `design-director`, who owns the run and talks to the user, and seven bounded
specialists it activates one at a time. `routes:` in the frontmatter is the list of skills an agent
may be routed — informational, shown on the console; it is **not** projected into the host
`skills:` field, because that field preloads every listed body and would break one-body loading.
The packet names the one `SKILL.md` path the agent opens with the Skill tool.

| Agent | Access | Phase | Job |
|---|---|---|---|
| `design-director` | write | always | Owns the brief, the gates and every user conversation |
| `brand-strategist` | write (`.olympus/` only) | diagnose, first | The business's Design DNA: `.olympus/brand-dna.json` + `BRAND.md` |
| `visual-analyst` | read-only | diagnose | Page evidence and reference deconstruction |
| `independent-critic` | read-only | verify | Scores directions and builds; never redesigns |
| `asset-producer` | write | prepare | Media from an approved asset manifest only |
| `design-engineer` | write | build | Implements the Gate-B direction |
| `analytics-specialist` | read-only | verify | Measurement plans and event contracts |
| `fleet-measurer` | read-only | diagnose | Runs a measurement script over many routes; returns a table, writes nothing |

`$name` in a body is the **host-neutral skill marker**. `tools/project.py` translates it:
Codex keeps `$name`; Claude rewrites it as "the *name* skill (Skill tool)".

`access: read-only` agents get no Write/Edit in any host projection. Tool sets cannot express
"write only to `.olympus/`", so `brand-strategist` carries that limit in its instructions.

Adding an agent means adding its file here **and** exactly one crew member for it in
`registry/crew.json`, in the same commit; `tools/verify.py` checks the 1:1 mapping (v2 governance,
owner 2026-11-08 — the fixed `SANCTIONED_AGENTS` list is gone). The Shipyard Forge does both for you
on the dev server, then runs `project.py all` and `verify.py`.
