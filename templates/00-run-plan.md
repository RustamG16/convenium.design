# 00 — Run plan (the activation plan)

Written by the director at step 0 of **every** trail, before any agent exists, and checked with
`python <Convenium.Design>/library/tools/verify.py --plan <this file>` before the first spawn.
`06-build-plan.md` stays the creative document; this file is the roster. An agent, a skill body
or a parallel wave not in this file does not run — update the file first, re-check, then spawn.

`agent` is a sanctioned agent id or `director` (the main session). `skill` is **one** registered
skill id, or `null` when the phase needs none. `skill_path` is the absolute path the packet
hands over. `parallel: true` is allowed only for agents whose file sets do not overlap.

```json
{
  "run": "<project or fleet name>",
  "trail": "full | abridged | fleet",
  "convenium_design": "<absolute path of the Convenium.Design folder on this machine>",
  "phases": [
    {
      "id": "brand-dna",
      "agent": "brand-strategist",
      "skill": "product-marketing",
      "skill_path": "<convenium_design>/library/skills/07-research-intel/product-marketing/SKILL.md",
      "model": "opus",
      "inputs": [".olympus/00-brief.md"],
      "outputs": [".olympus/brand-dna.json", ".olympus/BRAND.md"],
      "stop": "brand-dna.json validates against library/schemas/brand-dna.schema.json",
      "parallel": false
    }
  ],
  "gates": ["A", "B", "C"]
}
```

## Notes

- One phase, one agent, one skill body. A phase that needs two bodies is two phases.
- Every packet the director sends quotes this file's row for that phase and nothing from the
  conversation.
- Record each phase's artifact hash in `run.json → artifact_hashes` when it completes; the
  anti-loop bound in `AGENTS.md` compares hashes, not impressions.
