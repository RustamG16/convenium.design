# library/agents/ — host-neutral agents

Seven agents: the `design-director`, who owns the run and talks to the user, and six bounded
specialists it activates one at a time.

| Agent | Access | Phase | Job |
|---|---|---|---|
| `design-director` | write | always | Owns the brief, the gates and every user conversation |
| `brand-strategist` | write (`.olympus/` only) | diagnose, first | The business's Design DNA: `.olympus/brand-dna.json` + `BRAND.md` |
| `visual-analyst` | read-only | diagnose | Page evidence and reference deconstruction |
| `independent-critic` | read-only | verify | Scores directions and builds; never redesigns |
| `asset-producer` | write | prepare | Media from an approved asset manifest only |
| `design-engineer` | write | build | Implements the Gate-B direction |
| `analytics-specialist` | read-only | verify | Measurement plans and event contracts |

`$name` in a body is the **host-neutral skill marker**. `tools/project.py` translates it:
Codex keeps `$name`; Claude rewrites it as "the *name* skill (Skill tool)".

`access: read-only` agents get no Write/Edit in any host projection. Tool sets cannot express
"write only to `.olympus/`", so `brand-strategist` carries that limit in its instructions.

Adding an agent means adding it to `SANCTIONED_AGENTS` in `tools/verify.py` in the same commit.
