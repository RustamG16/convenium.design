---
name: apollo-tokens
description: Build, audit, document, or extend a design token system — color, type scale, spacing rhythm, radii, elevation, motion timing — and prove it holds up. Use for "design system", "design tokens", "set up a palette", "type scale", "our spacing is inconsistent", "hardcoded values everywhere", or when a chosen visual direction needs turning into concrete named values. Emits a validated `brandspec.json`. For choosing the direction in the first place, see `apollo-direction`.
---

# Apollo — Tokens

Turn a direction into named values that hold up under use, or audit an existing
system and say where it has drifted. This is a `SYSTEM` job, and it is also
Stage 3's output on every other job type.

The deliverable is `brandspec.json` plus a written rationale. Values are
**proven, not asserted** — every contrast pair is computed.

## What a token system contains

**Color** — 4–6 named tokens, no more at the base layer. Each carries a hex, a
role, and a *rule*:

```json
"accent": {
  "value": "#19E28D",
  "role": "single accent",
  "rule": "rim light, letterform counters, primary CTA, cursor. Never a background, never body text."
}
```

The `rule` field is what stops a palette rotting. A hex with no rule gets used
everywhere within a week and the system is gone. Write the rule as a permission
and a prohibition.

Neutrals are tinted, never dead gray — pull them toward the accent's hue or its
complement. `#0A0A0B` reads considered; `#0A0A0A` reads unset.

**Type** — display, body, and a utility face if data or captions need one. Per
role: family, weight, tracking, and the scale ratio. Display type gets negative
tracking at large sizes; body does not. State the measure (characters per line)
the body face is set for — 60–75 for long-form, tighter for UI.

**Spacing** — one scale, stated. Every gap is on it, or off it deliberately with
a note. The most common real-world failure is not a wrong value, it is two
near-values (`24px` and `28px`) doing the same job.

**Radii, elevation, motion timing** — same discipline. Motion tokens are
durations and easings, named by intent (`enter`, `exit`, `emphasis`), not by
number.

## Fluid by default

Size type and spacing with `clamp()`, not fixed desktop pixels. Layout should
breathe across viewports rather than snap between three hardcoded breakpoints.

```css
--step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--step-4: clamp(2.5rem, 1.8rem + 3.5vw, 5rem);
```

Anchor the scale at both ends: the min is the 375 value, the max is the **1920**
value. 2560 is then a max-width and margin question, not a type question. Do not
let the top of the scale be an accident of the viewport unit.

See `references/design-system.md` for fluid `clamp()` construction, grid
archetypes (bento / asymmetric / brutalist), surface treatments (glass, noise,
`mix-blend-mode`), and color discipline.

## Prove it

Before emitting anything, run the checker:

```bash
node lib/contrast.mjs brandspec.json
```

Every foreground/background pair that can occur must be listed with its computed
ratio and pass/fail against WCAG 2.1 AA (4.5:1 normal text, 3:1 large text and
UI components). A pair that fails is a token bug, not a note for later — fix the
value or forbid the combination in that token's `rule`.

Combinations that *cannot* occur should be stated as forbidden rather than left
untested. "Untested" and "not allowed" look identical in a spec sheet and are
not the same thing.

For charts, stat tiles, or any data display, load `apollo-dataviz` before
choosing series colors — categorical palettes have separation requirements that
a brand palette does not satisfy by accident.

## Auditing an existing system

When tokens already exist, report in this order:

1. **Naming consistency** — same concept under different names, or one name
   covering two concepts. Worst first: these are the ones that make the system
   unteachable.
2. **Coverage** — what is hardcoded that should be a token. Count the raw hex
   values and raw pixel values in the codebase; the number is the finding.
3. **Near-values** — pairs close enough that no one can tell them apart on
   purpose. These are drift, and they compound.
4. **Contrast failures** — computed, with the pair named.
5. **Orphans** — tokens defined and never used, or used once.

Give each a fix and a cost. Do not propose renaming an entire system unless the
user asked for that; propose the smallest change that stops the drift.

## brandspec.json

```json
{
  "specVersion": "1.0",
  "name": "…",
  "mood": "…",
  "voice": { "tone": "…", "vocabulary": ["…"], "neverSay": ["…"] },
  "tokens": {
    "color":   { "<name>": { "value": "#…", "role": "…", "rule": "…" } },
    "type":    { "display": { "family": "…", "weight": 700, "tracking": "-0.03em" },
                 "body":    { "family": "…", "weight": 400, "measure": "68ch" },
                 "scale":   { "ratio": 1.25, "min": "…", "max": "…" } },
    "space":   { "scale": ["4px","8px","12px","16px","24px","40px","64px","104px"] },
    "radius":  { "…": "…" },
    "motion":  { "enter": { "duration": "420ms", "easing": "cubic-bezier(.2,.8,.2,1)" } },
    "texture": "…"
  },
  "breakpoints": [375, 768, 1024, 1440, 1920, 2560],
  "contrast": { "checkedAt": "…", "pairs": [ { "fg": "…", "bg": "…", "ratio": 0.0, "pass": true } ] }
}
```

Validate against `lib/tokens.schema.json`. The `contrast` block is written by
`lib/contrast.mjs` — never by hand, because a hand-written ratio is a claim and
a computed one is a fact.

## Stopping

The system is done when every token has a name, a value, and a rule; every
occurring pair has a computed ratio; and the scale is stated. It is not done
when it is beautiful. Emit the spec, list what you left unresolved, stop.
