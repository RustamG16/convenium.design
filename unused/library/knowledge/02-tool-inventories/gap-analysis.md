---
id: inv-004
title: Gap analysis — everything supplied, against what is installed
compiled: '2026-08-28'
inputs: 7 GitHub repos, 4 social inventories, 5 MNEMOSYNE source records
---

# Gap analysis

Everything supplied on 2026-08-28, sorted by whether it adds anything to the ~97 skills
already indexed. **No downloads are recommended here** — this is a map of where the holes
are, so the decision is yours.

## Already covered — do nothing

| Supplied | Covered by |
|---|---|
| `emilkowalski/skills` (9 of 12) | Installed verbatim in `~/.claude/skills` |
| ibraviz "21 installs" — marketing/SEO/social items | `seo-audit`, `ai-seo`, `social`, `content-strategy`, `ad-creative`, `cro` |
| ibraviz "42 skills" — marketing + social departments | Same as above |
| ibraviz — `frontend-design` | Installed |
| lvl_aiautomations — `wshobson/agents` | Nine role agents already exist |
| lvl_aiautomations — `playwright-mcp` | `Claude_Browser` MCP |
| nocodealex / lvl — `obra/superpowers` | Present, but **stranded in `005-agency`** |
| `garden-skills` — `kb-retriever` | MNEMOSYNE + `library/` |
| `Owl-Listener` — `design-critique`, `accessibility-audit`, `handoff-spec`, `ux-writing` | The `design:` plugin set |

## Real gaps, ranked

### 1. Named visual styles — `MengTo/Skills/web-design` (~90)
Nothing installed does this. Every local design skill is a **process** ("improve this",
"audit this"); none is a **look** ("clean-minimal-beige-light-mode",
"documentary-brutalist-agency", "solar-duotone-bold"). This is the single largest gap and
the direct enabler of three genuinely different design outputs.

### 2. Single-axis improvement — `jakubkrehel/skills` (11)
`better-colors`, `better-typography`, `better-layout`, `variant`, `break`. Local design
skills change everything at once and cannot be applied surgically. `variant` in particular
has no equivalent — `prototype` is close but is `disable-model-invocation: true` and so
cannot be routed to by an agent.

### 3. Design laws as individual units — `Owl-Listener/designer-skills` (~60 of 110)
The Gestalt laws, usability heuristics and seven critique axes each as their own
invocable skill. Makes critique *citable* rather than impressionistic. No local
equivalent.

### 4. Persistent taste profile — `codeswithroh/tastemaker` (1)
`library/design-dna/`, `library/layout/`, `library/motion/` and `library/typography/` are
**all empty**. MNEMOSYNE already captures references and extracts frames; nothing turns
those frames into a profile the design agents read. This is the missing middle of a
pipeline that already exists here.

### 5. Version-matched docs — `upstash/context7`
Not a design tool. Nothing local pulls current library docs on demand.

### 6. Symbol-level code navigation — `oraios/serena`
Not a design tool. Code navigation is grep-based today.

## Non-gaps that look like gaps

- **`garden-skills`** — 11.5k stars overstates its value here. Four of five skills sit
  outside design, and `web-design-engineer` overlaps three installed skills.
- **`elayadesign/ai-design-skills`** — one narrow skill. Useful for its page-structure
  conventions; not a capability gap.
- **Finance and legal departments** (from ibraviz's 7-crew grid) — genuinely absent
  locally. Whether that is a gap or correct scope is a decision, not an oversight.

## The finding that outranks all of the above

Ten design skills and the whole superpowers workflow set are **installed but project-local
to `005-agency`**, while the routing documents treat them as globally available. Fixing
that recovers more capability than any download on this page.

See [../06-health/installed-skills-check.md](../06-health/installed-skills-check.md).
