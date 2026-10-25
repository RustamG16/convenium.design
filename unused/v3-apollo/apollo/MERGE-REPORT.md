# Merge report

What Apollo's seven skills are made of, where each piece came from, and what was
dropped. Read this before the variants get built — once a variant is locked, this
is the record of what is actually in it.

## Why vendor at all

The harness-managed plugin skill set is **not stable between sessions**. Four
session directories under
`AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/`:

| session | skills | design skills present |
|---|---|---|
| `cd9800a1` | 10 | none |
| `8c6c828e` | 19 | `frontend-design` |
| `bac936a7` | 17 | `+ awwwards-web-design` |
| `c6bd3624` | 36 | `+ web-design-pro, brand-guidelines, canvas-design, theme-factory, three-guide` |

Same machine, same user. `gsap-*` swings between 4 and 8 the same way.

A third source is volatile in a different way: `dataviz` ships inside the CLI's
own versioned cache
(`AppData/Local/Temp/claude/bundled-skills/2.1.222/<hash>/dataviz`), so it moves
with every CLI update.

Any Apollo that routes to a plugin skill works in some sessions and fails in
others, unpredictably. Hence: everything Apollo requires is in this repo.

---

## The seven

### Authored — merged from named sources

| skill | merged from | what came across |
|---|---|---|
| `apollo-audit` | `anthropic-skills:web-design-pro` | The spine. Its six-point judging order (concept → typography → space → motion → signature → fundamentals), the "see it as it renders / don't guess" rule, and the response shape: lead with critique, strong-already in 2–4 lines, gaps ranked, signature move as 2–3 options, never impose a taste call silently. |
| | `design:accessibility-review` | The WCAG 2.1 AA criteria table, folded into the main critique at real severity rather than kept as an appendix. Its separate audit-report format was **not** taken — a second parallel report competes with the critique. |
| `apollo-direction` | `anthropic-skills:awwwards-web-design` | The evidence-first loop (extract → brief → section plan), the anti-generic guardrails, and `references/reference-extraction.md` **vendored verbatim**. |
| | `anthropic-skills:frontend-design` | The three-AI-defaults calibration (cream/serif/terracotta, near-black/acid accent, broadsheet), "ground it in the subject", "spend your boldness in one place", the two-pass brainstorm-then-review method, and the Chanel remove-one-accessory close. |
| `apollo-tokens` | `design:design-system` | The audit output order — naming consistency, coverage, near-values, orphans — reordered to put naming first, since inconsistent naming is what makes a system unteachable. |
| | `anthropic-skills:awwwards-web-design` | `references/design-system.md` **vendored verbatim** (fluid `clamp()`, grid archetypes, surface treatments, color discipline). |
| | `anthropic-skills:theme-factory` | Concept only: presets as *starting points*. None of its 10 themes were copied — a fixed theme list is the opposite of what `apollo-direction` is for. |
| | `000-portfolio-russ/brandspec.json` | The spec shape, including its best idea: `accentRule`, generalised into a required `rule` on every color token. |
| `apollo-handoff` | `design:design-handoff` | The spec structure (layout, tokens, components, states, responsive, edge cases, motion, a11y) and the four principles (don't assume, tokens not values, all states, describe the why). |
| | `design:ux-copy` | Its copy patterns for CTAs, errors, empty states, and the 2–3-options-with-rationale output shape. |
| | `anthropic-skills:frontend-design` | Its "More on writing in design" section — write from the user's side of the screen, active voice, constant vocabulary through a flow, errors don't apologize. Stronger than the ux-copy principles it overlaps, so it won where they collided. |

### Vendored unchanged

| skill | source | change |
|---|---|---|
| `apple-design` | `~/.claude/skills/apple-design` | none |
| `emil-design-eng` | `~/.claude/skills/emil-design-eng` | **description rewritten only.** The original states what it encodes and never says when to fire, so it never self-triggers — `ROUTING.md:183` already flagged this. Body untouched. |

### Authored over vendored assets

| skill | source | why it isn't a clean copy |
|---|---|---|
| `apollo-dataviz` | bundled `dataviz` | **The upstream skill has no SKILL.md on disk.** It ships `references/` (7 files) and `scripts/` (`validate_palette.js`, `validate_palette.py`) as real files, but its instruction body lives inside the harness. The references and scripts are vendored byte-for-byte; the SKILL.md is authored as a router over them. Renamed with the `apollo-` prefix precisely so the difference is visible — the three unprefixed skills are faithful copies, the prefixed ones are not. |

---

## Dropped

| skill | why |
|---|---|
| `anthropic-skills:brand-guidelines` | Applies **Anthropic's** brand colors and typography. Never correct for your client work or your own. |
| `anthropic-skills:canvas-design` | Static-art output (poster/PDF). The `ASSET` job type is currently hypothetical; add it back when a real one shows up rather than carrying it speculatively. |
| `anthropic-skills:brainstorming` | Claims it must run before any creative work. That claim adds a phase to every job, so it is a **variant axis (V4)** rather than an assumption. If it earns its cost, it goes in. |
| `design:design-critique` | Overlaps `apollo-audit` almost entirely, and the half that does not overlap is Figma-oriented. |
| `prototype`, `pick-ui-library` | `disable-model-invocation: true` — the Skill tool hard-blocks agent invocation. Cannot be part of an automated pipeline by construction. |
| the `gsap-*` family | Motion **implementation**. Apollo describes motion and hands off; it does not write the animation. Out of scope by design, not by accident. |

---

## Deviations from the approved plan

Three, all worth knowing:

1. **`dataviz` could not be "vendored unchanged"** — no SKILL.md exists to vendor.
   Authored a router instead, and renamed it `apollo-dataviz` so the repo makes
   the distinction visible.
2. **`theme-factory` contributed a concept, not content.** The plan said its
   presets would be starting points; on reading, copying 10 fixed themes into a
   skill whose sibling exists to prevent default-reaching was self-defeating.
3. **`frontend-design` beat `design:ux-copy` on microcopy** where the two
   overlapped. The plan had ux-copy as the source; its guidance is thinner.

## Licensing

`apple-design` and `emil-design-eng` are copies of skills already installed under
`~/.claude/skills`. The `awwwards-web-design` reference files and the `dataviz`
references/scripts are Anthropic-distributed content. Fine for local and private
use. **Check terms before making this repo public** — that is a real gate, not
boilerplate.

## State

7 skills, 0 dead routes. `scripts/verify-catalog.ps1` enforces that and exits
non-zero if it ever stops being true.
