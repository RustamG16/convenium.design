# Kinetic

Motion-first cinema. The scroll is the narrative device. A page should be experienced,
not read — launches, campaigns, product stories, hero moments, immersive marketing sites.

## The doctrine

The scroll is the narrative device. Every section earns its entrance.

1. **Choreograph before you compose.** Write the beat sheet first; layout follows.
2. **One hero moment per page.** Exactly one.
3. **Motion carries meaning, not decoration.** Each move answers "what does this tell
   the reader?"
4. **Contrast is the visual engine.** Dark ground, bright figure, large scale jumps.
5. **Continuity.** Elements transform between sections rather than fading out and in.

## What it refuses

Uniform fade-up-on-scroll (a default, not choreography); motion that delays reading;
autoplaying audio, scroll-hijacking, infinite-loop attention-grabbers; a second hero
moment; effects with no reduced-motion fallback.

## Tokens

```
--font-display : high-contrast or wide grotesque, variable weight if available
--font-text    : neutral grotesque
--scale        : 1.500 (perfect fifth)
--display-max  : clamp to viewport, 12-18vw normal for the hero
--leading      : 0.9 display / 1.5 body
--tracking     : display -0.03em / body 0 / eyebrow +0.14em uppercase
--ground       : near-black with a colour cast (never neutral #000)
--surface      : ground lifted 4-6%
--figure       : near-white
--accent       : ONE luminous colour - hero moment and state changes
--space        : 4 / 8 / 16 / 32 / 64 / 128 / 100vh - sections are viewport-height units
--dur-micro    : 150ms   state feedback
--dur-move     : 400ms   element transitions
--dur-scene    : 800ms   section handoffs
--ease-out     : cubic-bezier(.16,1,.3,1)
--ease-inout   : cubic-bezier(.65,0,.35,1)
--stagger      : 60ms, capped at 8 elements
--scrub        : 1 (smoothed), never 0
```

The beat sheet is the required first output: a table of beat / trigger / what moves /
duration / hands off to. If you can't fill it, there is no design yet.

## When to use it

The brief says "cinematic," "scroll experience," "make it feel alive," "premium launch
page," "scrollytelling," "wow moment." Not this if the brief wants restraint (see
Atelier) or a data-dense tool (see Instrument).

## Who builds it

No agent is named after a doctrine. The `design-director` selects this doctrine at intake
(from the client's `.olympus/brand-dna.json` or the brief), commits its tokens as numbers in
the project's `DESIGN.md`, and `design-engineer` builds from that. New media is planned by
`asset-director` and produced by `asset-producer`. This file is reference documentation,
not an executable skill — read it, don't invoke it.

## Related

`profile.json` in this folder - the same doctrine as a taste-profile default.
