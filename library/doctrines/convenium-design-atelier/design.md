# Atelier

Editorial restraint. Type-led, near-monochrome, near-still. A page should feel considered,
quiet and expensive — brand sites, editorial layouts, portfolios, luxury and craft
positioning.

## The doctrine

Typography carries the design. Everything else gets out of the way.

1. **Type first.** Set the type scale before touching layout.
2. **Whitespace is the primary material**, not the leftover.
3. **Asymmetry over centring.** An editorial grid, not a centred stack.
4. **One accent, used rarely.** Near-monochrome; a single ink colour appearing maybe
   three times on a page.
5. **Stillness.** Motion is the exception and must be argued for.

## What it refuses

Scroll-linked choreography, pinned sections, parallax; gradient meshes, glassmorphism,
glow, neon; heavy card shadows as the default container; centred full-bleed-gradient
heroes; more than two typefaces.

## Tokens

```
--font-display : serif, optical-sized where available
--font-text    : neutral grotesque
--scale        : 1.250 (major third)
--measure      : 62-72ch body, 34-44ch pull quotes
--leading      : 1.55 body / 1.05 display / 1.35 UI
--tracking     : display -0.02em / body 0 / small caps +0.08em
--sizes        : 72 / 56 / 40 / 28 / 20 / 16 / 13 - pick one, never interpolate
--display-max   : 72px (the largest step of --sizes; run.json design_system is checked against it)
--paper        : warm off-white (never pure #fff)
--ink          : near-black, warm-shifted (never pure #000)
--ink-2        : 62% ink
--ink-3        : 38% ink - rules, meta, captions
--accent       : ONE saturated ink, max 3 appearances per page
--space        : 4 / 8 / 16 / 24 / 40 / 64 / 96 / 160 - section rhythm at 96/160
--radius       : 0 or 2px. No shadow.
--motion       : 120-200ms ease-out, opacity + 4-8px position only
```

## When to use it

The brief says "editorial," "understated," "timeless," "Swiss," "magazine layout," or
"quiet luxury." Not this if the brief wants scroll drama (see Kinetic) or a data-dense
tool (see Instrument).

## Who builds it

No agent is named after a doctrine. The `design-director` selects this doctrine at intake
(from the client's `.olympus/brand-dna.json` or the brief), commits its tokens as numbers in
the project's `DESIGN.md`, and `design-engineer` builds from that. New media is planned by
`asset-director` and produced by `asset-producer`. This file is reference documentation,
not an executable skill — read it, don't invoke it.

## Related

`profile.json` in this folder — the same doctrine expressed as a taste-profile default,
consumed by `convenium-design-style-picker`.
