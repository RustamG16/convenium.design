---
id: health-001
title: Installed-skills health check
ran: '2026-08-28'
scope: ~/.claude/skills, ~/.claude/skill-index, ~/.claude/agents, skills-library, live harness listing
---

# Installed-skills health check

Run in response to: *"no need to download skills which I already have, just make sure
they are setup correctly and they work correctly and we use them correctly."*

Three questions, answered separately.

---

## 1. Are they set up correctly? — YES, clean

| Check | Result |
|---|---|
| Personal skill directories | 71 |
| Missing `SKILL.md` | **0** |
| Missing/invalid YAML frontmatter | **0** |
| `name:` field disagreeing with folder name | **0** |
| Missing `description:` field | **0** |

No structural faults. Nothing to fix.

---

## 2. Do they work correctly? — YES, with one intentional exception you already know

68 of the 71 are exposed to the model. The three that are not are hidden **on purpose**:

| Skill | Why hidden |
|---|---|
| `pick-ui-library` | `disable-model-invocation: true` |
| `prototype` | `disable-model-invocation: true` |
| `review-animations` | `disable-model-invocation: true` |

These only run when you type them (`/prototype`). This is correct configuration and
`skills-library/ROUTING.md` already documents it. Nothing on disk is missing from the
harness, and nothing the harness lists is missing from disk — the two sides reconcile
exactly.

---

## 3. Are we using them correctly? — ONE REAL BREAK

### `awwwards-web-design` is not loaded outside `005-agency`

This is the finding that matters.

- `~/.claude/skill-index/graphic-designer.md` lists
  `anthropic-skills:awwwards-web-design` as **routing choice #1** for convenium-design — "new
  high-end / reference-inspired site or landing page… owns visual and motion direction."
- `skills-library/ROUTING.md` §1 makes it the **winner of the 6-way visual/web design
  precedence rule**.
- **It is not in this session's available-skills list.** It does not exist under
  `~/.claude/skills/`.

Where it actually lives:

```
Desktop/DigitalAgency_Saas/lab/005-agency/.claude/skills/awwwards-web-design   ← project-local
skills-library/skills/_session-snapshot/anthropic-skills/awwwards-web-design   ← reference only, dead path
```

**Consequence:** in any project that is not `005-agency` — including this one — convenium-design's
primary design route silently fails and falls through to whatever matches next
(`impeccable`, `web-design-pro`, `frontend-design`). The routing documents claim a
decision that the runtime cannot honour.

### The same applies to nine more

The Aug-21 MNEMOSYNE index recorded 97 skills. Twenty-one of those are unavailable in
this session. Three are the intentional hides above. Eight are `higgsfield-*` (a plugin
not loaded here). The remaining **ten are a coherent design suite that is project-local
to `005-agency`**:

`asset-director` · `award-rubric` · `awwwards-web-design` · `concept-studio` ·
`design-analytics` · `olympus-design-director` · `reference-deconstruction` ·
`ux-evidence-audit` · `visual-qa` · `webgl-experience`

`005-agency` also holds `systematic-debugging`, `art`, `brainstorming`,
`test-driven-development`, `writing-plans`, `subagent-driven-development`,
`verification-before-completion` and the rest of the superpowers workflow set — none of
which are available here either.

### Knock-on: the MNEMOSYNE gate is measuring against the wrong set

`.mnemosyne/skills-index.json` is a snapshot taken on 2026-08-21 **from within a session
where those project-local skills were loaded**. The gate that decides "is this source
new or duplicate" therefore credits coverage that does not exist in most projects. A
source can be marked `duplicate` because `awwwards-web-design` covers it, while
`awwwards-web-design` is unreachable from the project you are actually working in.

---

## Fixes, in order of value

1. **Decide where the ten design skills belong.** If they are meant to be general, they
   belong in `~/.claude/skills/`, not in one project. If they are genuinely
   agency-project-specific, then `skill-index/graphic-designer.md` and `ROUTING.md` §1
   must say so — because right now they read as globally available.
2. **Re-run the MNEMOSYNE index from a neutral project** so the gate measures the set
   that is actually loaded, and record in the index which project scope it was taken
   from.
3. **Keep the catalogs honest about the three hidden skills.** `ROUTING.md` already
   does. `graphic-designer.md` lists `prototype` and `pick-ui-library` in a way that
   reads as model-invocable — they are not; only the user can fire them.

Nothing here requires downloading anything.
