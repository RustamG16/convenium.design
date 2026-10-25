# Design System

The craft layer: how to build the fluid type, deliberate grids, and surface treatments that separate award work from default output. Reach for these instead of Tailwind defaults.

## Fluid type with `clamp()`

Award typography is *extreme*: large display sizes, tight negative tracking on headings, a clear ratio between levels. Size everything fluidly so it scales with the viewport instead of snapping between breakpoints.

`clamp(MIN, PREFERRED, MAX)` — `MIN` and `MAX` are floors/ceilings; `PREFERRED` (usually a `vw` expression) is what scales. A robust fluid scale:

```css
:root {
  /* Fluid type scale — editorial, with a strong jump to display */
  --step--1: clamp(0.83rem, 0.78rem + 0.24vw, 0.96rem);
  --step-0:  clamp(1rem, 0.93rem + 0.34vw, 1.19rem);   /* body */
  --step-1:  clamp(1.2rem, 1.08rem + 0.6vw, 1.55rem);
  --step-2:  clamp(1.44rem, 1.25rem + 0.96vw, 2.0rem);
  --step-3:  clamp(1.73rem, 1.43rem + 1.5vw, 2.59rem);
  --step-4:  clamp(2.07rem, 1.62rem + 2.27vw, 3.36rem);
  --display: clamp(2.8rem, 1.5rem + 6.5vw, 9rem);       /* hero headline */
}

.h-display {
  font-size: var(--display);
  font-weight: 700;
  letter-spacing: -0.03em;   /* tight tracking — signature of editorial display type */
  line-height: 0.95;          /* display type wants leading well under 1 */
  text-wrap: balance;
}
.body { font-size: var(--step-0); line-height: 1.55; }
```

Notes:
- **Tracking**: display/heading type usually wants negative tracking (`-0.02em` to `-0.04em`). Body and small-caps labels often want *positive* tracking (`0.05em`+). Don't apply one value everywhere.
- **Leading**: the bigger the type, the tighter the line-height. Hero headlines often sit at `0.9`–`1.0`.
- **Pairing**: a common award pairing is a characterful display face (heavy grotesk, or a high-contrast serif like a Didone) against a neutral, legible body (a humanist or grotesk sans). One voice for impact, one for reading.

## Fluid spacing

Same principle for rhythm — fluid section padding and a spacing scale, so whitespace breathes:

```css
:root {
  --space-s:  clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
  --space-m:  clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --space-l:  clamp(3rem, 2rem + 5vw, 7rem);
  --space-xl: clamp(5rem, 3rem + 10vw, 12rem);   /* section vertical padding */
}
section { padding-block: var(--space-xl); }
```

## Grid archetypes

The default centered max-width column is the thing to avoid. Pick a deliberate archetype:

**Bento** — a tight grid of unequal cells, each holding one idea, sized by importance.
```css
.bento {
  display: grid;
  gap: var(--space-s);
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(120px, auto);
}
.bento > .feature { grid-column: span 7; grid-row: span 2; }
.bento > .tall    { grid-column: span 5; grid-row: span 2; }
.bento > .wide    { grid-column: span 12; }
/* collapse gracefully */
@media (max-width: 760px) { .bento > * { grid-column: 1 / -1 !important; } }
```

**Asymmetric editorial** — content deliberately off-center, large negative space on one side, type hanging into the margin. Use a 12-col grid and place content on, say, cols 2–7 while an image spans 8–12, then invert in the next section to create rhythm.

**Brutalist** — dense, hard edges (radius 0), visible grid lines/borders, monospace or oversized type, high contrast, intentional "raw" feel. Sparse color, heavy rules.

**Split-screen** — two full-height halves (often media | type), one or both reacting to scroll/hover.

Vary the archetype between sections so the page has pacing — don't repeat the same grid down the whole page.

## Surface treatments

Used with restraint, these create the high-contrast, tactile depth award sites have.

**Glassmorphism** — frosted translucent panels over busy/media backgrounds (nav bars, cards over video):
```css
.glass {
  background: color-mix(in srgb, white 8%, transparent);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid color-mix(in srgb, white 18%, transparent);
}
```
Only reads as "glass" when there's something behind it worth blurring.

**Noise / grain overlay** — kills flat-digital sterility, adds film texture. A tiling SVG noise as a fixed, low-opacity, pointer-events-none overlay:
```css
.grain::after {
  content: ""; position: fixed; inset: 0; z-index: 9999;
  pointer-events: none; opacity: 0.04; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

**`mix-blend-mode: difference`** — for high-contrast elements that must stay legible over any background (custom cursors, sticky labels, marquees crossing light↔dark sections). The element inverts against whatever it overlaps:
```css
.blend-difference { mix-blend-mode: difference; color: #fff; }
```
Watch contrast at the crossover points and test against the real backgrounds — difference can produce muddy mid-tones over busy imagery.

## Color discipline

Award palettes are usually *disciplined*: a near-monochrome base (often a tinted off-black "ink" and an off-white "bone" rather than pure #000/#fff) plus one or two loud accents used sparingly. Name tokens by role, not hue, so the system stays coherent:

```css
:root {
  --ink:   #0d0d0f;   --bone:  #f4f1ea;
  --accent:#ff4d2e;   --muted: color-mix(in srgb, var(--ink) 55%, var(--bone));
}
```

Pure black on pure white is a tell of an unconsidered palette — nudge both toward a tint.
