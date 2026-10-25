# Cyberpunk Athens

Marble carries the past. Circuitry carries the present. An ancient civilization that
never stopped building — its marble is still standing, and it's wired for light. This is
Apollo_claude's own dashboard identity, and also a client-facing style.

## The doctrine

Marble carries the past. Circuitry carries the present. Neither is decoration on the
other. Not generic cyberpunk with Greek columns bolted on — the two registers are fused
at the material level.

1. **Material over motif.** The defining feature is the crack - a fine fracture network
   along anatomical or architectural lines, glowing from within.
2. **Two-colour glow discipline.** Cyan is the primary channel. Gold is the secondary
   filigree. Magenta is reserved for environment signage only, never a character's own
   glow.
3. **Halo as identity, not crown.** Every character carries the ringed halo motif; its
   variation is how one figure reads as distinct from another.
4. **Black grounds the character register; the environment register is lived-in.**
   Character portraits: pure black background, studio lighting. Environment work:
   classical architecture, rain-slicked streets, neon signage, present-day pedestrians
   moving through it unremarked.
5. **Restraint on what glows.** Not everything is lit. Fully-covered-in-neon has lost
   the reading and become generic sci-fi.

## What it refuses

Chrome, latex, or leather sci-fi costuming; neon with no classical grounding underneath
it; literal held weapons or props as a defining feature; more than two glow colours on
a character; an action pose (every reference figure stands still - calm, not under
attack).

## Tokens

```
--marble       : off-white, cool-neutral, fine visible grain
--crack-primary: cyan glow (~#4fd8e8 range - tune per asset, never pure #00ffff)
--crack-gold   : warm gold filigree (~#c9a35a range)
--env-magenta  : reserved for environment signage/accent ONLY, never on a character
--ground-black : pure black, character-portrait background only
--halo-ring    : same cyan as crack-primary, thin stroke, concentric
--type-display : classical-leaning serif or carved-letterform face
--display-max  : none of its own - this is a skin; it inherits the base doctrine's --display-max
--type-ui      : neutral grotesque (shared with Instrument when skinning system UI)
--tracking     : identity/department labels get wide tracking, +0.15em to +0.22em
--motion       : glow pulse (slow, ambient) and crack-reveal-on-focus only
```

## When to use it

The brief explicitly asks for this style, or it's Apollo_claude's own dashboard/agent
identity work.

## Who builds it

No agent is named after a doctrine. The `design-director` selects this doctrine at intake
(from the client's `.olympus/brand-dna.json` or the brief), commits its tokens as numbers in
the project's `DESIGN.md`, and `design-engineer` builds from that. New media is planned by
`asset-director` and produced by `asset-producer`. This file is reference documentation,
not an executable skill — read it, don't invoke it.

## Related

`profile.json` in this folder - the same doctrine as a taste-profile default.
`dashboard/css/tokens.cyberpunk-athens.css` - these tokens as real CSS, already in use.
`media/gods/`, `media/manifest.json` - the actual reference art this is grounded in.
