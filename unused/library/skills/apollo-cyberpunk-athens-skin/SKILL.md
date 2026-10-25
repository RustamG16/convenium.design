---
name: convenium-design-cyberpunk-athens-skin
description: Regenerate dashboard/css/tokens.cyberpunk-athens.css from the Cyberpunk Athens doctrine's token block, whenever the doctrine file changes. This is the mechanical derivation step CLAUDE.md's "Never hand-edit tokens.cyberpunk-athens.css directly" rule depends on. Trigger phrases - "regenerate the cyberpunk athens skin", "sync the dashboard css to the doctrine", "update the skin css". Do NOT use for - defining or changing the doctrine itself (that's the convenium-design-cyberpunk-athens agent's job; this skill only translates what's already decided there into CSS).
---

# Convenium.Design Cyberpunk Athens Skin

The dashboard's colour skin is derived, not hand-maintained — same discipline as
`architecture-essentials.md` being derived from `architecture.md`. This skill is that
derivation step. Run it after any edit to
`.claude/agents/convenium-design-cyberpunk-athens.md`'s `## Tokens` section.

## Procedure

1. Read `.claude/agents/convenium-design-cyberpunk-athens.md`'s `## Tokens` block — the current
   source values for `--marble`, `--crack-primary`, `--crack-gold`, `--env-magenta`,
   `--ground-black`, `--halo-ring`, `--type-display`, `--type-ui`, `--tracking`.
2. Read `dashboard/css/tokens.cyberpunk-athens.css`'s current values. It is scoped
   `:root[data-theme="cyberpunk-athens"]` and is **self-contained** — it defines every
   palette token it needs (`--bg`/`--bg-elev`/`--panel`/`--panel-2`,
   `--line`/`--line-strong`, `--text`/`--text-2`/`--text-3`, `--accent`/`--accent-contrast`,
   `--accent-gold`, `--env-magenta`, `--focus`, the semantic
   `--ok`/`--warn`/`--danger`/`--info`/`--pending` set, `--material-bg`/`--material-blur`/`--shadow-rgb`,
   `--font-display`) because it is loaded alone, not stacked under another preset.
3. Map doctrine token → CSS variable:
   - `--crack-primary` → `--accent`, `--info`, `--focus`
   - `--crack-gold` → `--accent-gold`, `--warn`
   - `--env-magenta` → `--env-magenta` (never a state colour)
   - `--ground-black` → `--bg` (near-black, not the pure `#000` reserved for portraits)
   - `--marble` → the light end of `--text` / `--text-2` / `--text-3`
   - `--type-display` → `--font-display`
   If the doctrine file changed one of these, update the matching CSS custom property.
4. Leave `tokens.base.css` untouched — it owns all structure (type scale, spacing,
   density, motion curves, focus ring, reduced-motion) and is itself derived from
   `convenium-design-instrument.md`. This skill only owns this theme's palette and its one
   signature motion (`cpa-glow-pulse`), never structure (`architecture.md` §8).
5. State which properties changed and why, so the change is traceable back to the
   doctrine edit that caused it.

## Why this is a skill and not just "edit the file"

Two files encoding the same palette independently is exactly the drift risk this whole
project is built to avoid (see `architecture.md`'s adversarial turn: schema versions,
derived digests, single write paths — same principle applied to colour tokens). Loading
this skill instead of hand-editing the CSS keeps the doctrine file as the one place the
palette is actually decided.
