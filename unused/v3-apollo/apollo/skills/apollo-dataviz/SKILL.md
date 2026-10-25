---
name: apollo-dataviz
description: Read this BEFORE writing any chart, graph, plot, dashboard, stat tile, meter, KPI row, sparkline, or heatmap — in any medium, including an SVG inside a design comp. Covers choosing the right form, a validated color formula for categorical/sequential/diverging palettes, mark specs, axis and legend rules, and light/dark consistency. Triggers on "chart", "graph", "plot", "dashboard", "data viz", "visualize this", "stat tile", "sparkline", "heatmap", "chart colors", "color by series", "legend", "axis".
---

# Apollo — Data Visualization

Charts are the place where a good design system most reliably falls apart: brand
palettes do not satisfy categorical separation requirements, and a chart built
from brand colors alone will be unreadable for some viewers and ambiguous for
the rest.

**Load this before writing the first line of chart code or picking the first
series color** — not after, when the palette is already wired in.

> **Provenance note.** The upstream `dataviz` skill ships its `references/` and
> `scripts/` as files but keeps its instruction body inside the harness, so
> there was no SKILL.md to vendor. This file is authored for Apollo; everything
> under `references/` and `scripts/` is the upstream content unchanged. Treat
> the references as authoritative and this file as the router.

## Order of work

1. **Choose the form** before anything visual — `references/choosing-a-form.md`.
   The most common failure is a chart type chosen by habit rather than by the
   question the data answers.
2. **Build the palette** — `references/color-formula.md` for the method,
   `references/palette.md` for validated default values. Swap in brand colors
   only where they survive the formula's separation requirements; where they do
   not, the brand accent becomes a highlight color, not a series color.
3. **Validate it, don't trust it:**
   ```bash
   node scripts/validate_palette.js
   ```
   This is a real check, not a formality — it catches pairs that look distinct
   to you and collapse for a colorblind viewer or in grayscale.
4. **Draw the marks** — `references/marks-and-anatomy.md` for mark specs, axes,
   gridlines, labels.
5. **Compose** — `references/components.md` for stat tiles, KPI rows, legends,
   dashboard layout.
6. **Wire interaction** — `references/interaction.md` for tooltips, hover, and
   focus states.
7. **Check against `references/anti-patterns.md`** before calling it done.

## Non-negotiables

- **Never encode by color alone.** Position, length, or shape carries the
  meaning; color reinforces it.
- **Light and dark both work,** or the chart is not finished.
- **Never a truncated y-axis on a bar chart.** Bars encode magnitude by length,
  so a cut axis is a false statement about the data.
- **Direct-label where you can.** A legend is a lookup task you are imposing on
  the reader; labels on the marks remove it.
- **One chart, one question.** If it needs a paragraph to explain, it is two
  charts.

## Inside a design comp

Charts in a comp follow the same rules as production charts — a placeholder
chart with arbitrary colors teaches the implementer the wrong palette, and it
will ship. If the real data is not available, use plausible values and label
them as sample data in the handoff.

Series colors belong in `brandspec.json` as their own token group with their own
rules, distinct from the brand palette. Note in the handoff which is which.
