# Instrument

Dense and systematic. Information per pixel is the metric. For tools and information
surfaces — dashboards, admin panels, data-heavy screens, maps and graphs. This is also
the structural base Apollo_claude's own dashboard is built on.

## The doctrine

Information per pixel is the metric. Structure is drawn, not implied.

1. **Show the structure.** Visible rules, aligned columns, explicit grouping.
2. **Density is a feature.** Default to the tighter option.
3. **Colour is semantic, never decorative.** Every hue means a state; if it can't be
   named in a legend, it doesn't appear.
4. **One type family, many weights.** Tabular numerals everywhere.
5. **Motion is feedback only.** Under 150ms, confirming a state change.

## What it refuses

Hero sections, marketing copy, decorative imagery; cards as the default container
(they waste edges - use tables, panels, rules); colour used for mood; proportional
numerals in data contexts; motion that delays a state change.

## Tokens

```
--font-ui   : neutral grotesque, tabular numerals ON
--font-mono : IDs, codes, values, keys, paths
--scale     : 1.200 (minor third)
--sizes     : 11 / 12 / 13 / 14 / 16 / 20 / 28
--display-max : 28px (the largest step of --sizes; run.json design_system is checked against it)
--leading   : 1.35 UI / 1.5 prose blocks
--label     : 11px, uppercase, +0.1em tracking, dim
--bg        : neutral, slightly cool
--panel     : bg lifted 3%
--line      : hairline, ~12% contrast against bg
--text      : high contrast
--text-2    : 65% - labels and meta
--ok / --warn / --danger / --info / --pending  <- the ENTIRE accent palette
--space     : 2 / 4 / 6 / 8 / 12 / 16 / 24 / 32
--row       : 28-32px standard, 24px compact
--radius    : 2-4px. No shadow except one elevation for floating layers.
--dur       : 100-150ms, ease-out, opacity + 2-4px only
```

## When to use it

The brief says "dashboard," "internal tool," "admin panel," "data-dense," "control
surface," "map of the system." Not this if the brief wants atmosphere (see Atelier or
Kinetic).

## Who builds it

No agent is named after a doctrine. The `design-director` selects this doctrine at intake
(from the client's `.olympus/brand-dna.json` or the brief), commits its tokens as numbers in
the project's `DESIGN.md`, and `design-engineer` builds from that. New media is planned by
`asset-director` and produced by `asset-producer`. This file is reference documentation,
not an executable skill — read it, don't invoke it.

## Related

`profile.json` in this folder - the same doctrine as a taste-profile default.
`dashboard/css/tokens.instrument.css` - these tokens as real CSS, already in use.
