# Knowledge

Curated, verified knowledge filed from sources. This holds **conclusions**, organised by
what they are for rather than by where they came from.

Every claim here is marked as observed or inferred, and every external repo was resolved
live against the GitHub API on the date in its frontmatter. Unresolvable claims are
recorded as unsupported rather than repeated.

```
knowledge/
├── 00-rules/            practices promoted to standing rules
├── 01-skill-repos/      external skill repositories, verified
├── 03-skill-briefs/     individual skills described by a source
├── 04-ui-references/    UI and design references to build from
└── 06-health/           is the local setup correct and correctly used
```

The design doctrines (atelier, kinetic, instrument, cyberpunk-athens) live in
`library/doctrines/`, not here. Tool-shopping research (`02-tool-inventories`,
`05-pending-capture`) and the superseded three-agent design setups (`07-design-systems`)
moved to `unused/library/knowledge/` on 2026-10-08.

## Start here

| If you want to | Read |
|---|---|
| Know whether your installed skills are healthy | [06-health/installed-skills-check.md](06-health/installed-skills-check.md) |
| Build the map of your own system | [04-ui-references/system-map-ui.md](04-ui-references/system-map-ui.md) |
| Pick a design doctrine | [`library/doctrines/`](../doctrines/) |
| The rule that now applies to every new project | [00-rules/six-files-before-code.md](00-rules/six-files-before-code.md) |

## Conventions

- One file per item. Frontmatter carries id, source, verification date and verdict.
- Verdicts: `installed` · `gap` · `park` · `discard`.
- Creator-supplied figures (star counts, time savings, agent counts) are labelled as
  unverified wherever they are repeated.
