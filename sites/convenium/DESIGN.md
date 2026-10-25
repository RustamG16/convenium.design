---
name: The Rustam Codex
description: A stone-and-brass observatory under one red moon, read by candle-warm type on a violet-black ground.
northStar: The Codex — a private universe for one inhabitant (doctrine convenium-design-kinetic, Atelier type discipline in the reading sections)

colors:
  ground: "#0D0B10"          # near-black with a violet-brass cast; the page ground
  surface: "#17131D"         # ground lifted ~5%; board tiles, nav scrim
  figure: "#EDE6D8"          # warm near-white; display and body
  figure-2: "#A89F91"        # 62% figure; secondary text, interpretations
  figure-3: "#6E675E"        # 38% figure; rules, meta — never body text
  brass: "#D4A24C"           # THE one luminous accent: hero word, lit quests, focus, links
  brass-deep: "#8A6A2F"      # brass at rest: hairlines, inactive numerals (decorative only)
  moon: "#C2301C"            # the red moon; appears in imagery and once, in the closing line
  line: "rgba(237,230,216,0.14)"   # hairline rules on ground
  scrim: "linear-gradient(180deg, rgba(13,11,16,0) 0%, rgba(13,11,16,0.72) 60%, rgba(13,11,16,0.94) 100%)"

typography:
  hero:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(4.5rem, 16vw + 0.25rem, 16.5rem)"   # 1440 → 234px (16.25vw); ≤640 → 24vw + 0.25rem (390 → 98px)
    fontWeight: 600
    fontStyle: italic
    lineHeight: 0.86
    letterSpacing: "-0.03em"
  display:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(2.75rem, 6.4vw + 0.25rem, 6.75rem)"  # 1440 → 96px; 390 → 44px
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  path-name:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(3.25rem, 8vw, 8.5rem)"              # the pinned path names; 1440 → 115px
    fontWeight: 500
    fontStyle: italic
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(1.75rem, 2.8vw, 2.5rem)"            # 1440 → 40px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.25rem, 1.6vw, 1.6875rem)"         # 1440 → 23px (18 × 1.5 = 27 reserved for pull quotes)
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"                                 # 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"                                # 13px; nav, meta, captions — never above a heading
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
    textTransform: uppercase

spacing:
  scale: "4 / 8 / 16 / 32 / 64 / 128 px; sections are viewport units (100vh, the paths 600vh pinned)"
  gutter: "clamp(20px, 5vw, 80px)"
  measure: "62ch body (38ch beside a campaign title), 38ch pull quotes, 44ch ledes"

motion:
  micro: "150ms"
  move: "400ms"
  scene: "800ms"
  ease-out: "cubic-bezier(.16,1,.3,1)"
  ease-in-out: "cubic-bezier(.65,0,.35,1)"
  stagger: "60ms, capped at 8 elements"
  scrub: "1"

breakpoints:
  target: "desktop 1440×900 and mobile 390×844 are the designed viewports; 1024 (tablet) and 640 (hero word switches to 24vw) are the two change points"

components:
  nav-link:
    textColor: "{colors.figure-2}"
    typography: "{typography.label}"
    hover: "{colors.figure} with a 1px brass underline at 0.3em offset"
    contrast: "7.49:1 at rest, 15.77:1 hover"
  quest-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.figure}"
    rounded: "0"
    padding: "32px 28px"
    border: "1px solid {colors.line}"
    contrast: "14.74:1"
  quest-tile-lit:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.figure}"
    border: "1px solid {colors.brass}"
    marker: "brass disc 10px, box-shadow 0 0 24px rgba(212,162,76,.45)"
  button-ghost:
    textColor: "{colors.figure}"
    border: "1px solid {colors.figure-3}"
    padding: "14px 24px"
    hover: "border {colors.brass}, text {colors.brass}"
    contrast: "15.77:1 rest, 8.46:1 hover"
  focus-ring:
    outline: "2px solid {colors.brass}, offset 4px; over imagery the same ring with a 0 0 0 6px rgba(13,11,16,.9) halo"
---

# The Rustam Codex — The Codex, a private universe for one inhabitant

## Visual World

A violet-black ground that is never pure black, lit from inside by the inhabitant's own
commissioned imagery: a stone observatory, aged brass instruments, a red moon seen through an
oculus. Type is candle-warm and enormous: a high-contrast didone, italic, set at a sixth of
the viewport for the single word *Codex*, then a neutral grotesque at eighteen pixels for
everything that must be read. Media bleeds full-width and is shown at full strength; where
words cross a picture, the darkness belongs to the words (a scrim rising from the bottom of
the type block), never to the picture. Brass is the only luminous colour the interface owns —
the hero word, a lit quest, a focus ring. The red of the moon lives inside the images and is
spoken aloud exactly once, in the closing line. Someone who has not read the brief could
pick it from ten others by the one italic word over the dragons and the moon.

## Type

**Bodoni Moda** (variable, 400–900, roman and italic) carries the mythic register: the hero
word, section displays, the six path names, the campaign titles, the pull quotes. It is
confined to display and headline roles; it never sets body text. **Instrument Sans** carries
reading: ledes, body, the board, the nav and meta labels. Nothing else is loaded.

The scale is 1.5 (perfect fifth, per the kinetic doctrine) from an 18px body: 18 → 27 → 40 →
61 → 91 → 137, with the hero decoupled from the scale and set fluid. **Hero: 16vw** on
desktop (234px at 1440). The doctrine's `--display-max` is 12–18vw; 16 was chosen because
*Codex* is five letters and at 16vw it spans ~60% of the width, leaving the dragons and the
moon visible above it, while at 18vw the word collides with the instrument. Below 640px it
switches to 24vw (98px at 390) because a five-letter word at 16vw of a phone is a subtitle,
not a hero. Every fluid size carries a rem term so text zoom still scales it.

Tracking: display −0.03em (hero, path names), −0.02em (display), −0.01em (headline), body 0,
label +0.14em uppercase. Labels never sit above a heading as an eyebrow; they are used for
nav, captions and meta only.

## Colour

Measured (WCAG 2.x relative luminance), figure on ground unless stated:

| Pairing | Ratio | Use |
|---|---:|---|
| figure `#EDE6D8` on ground `#0D0B10` | 15.77:1 | all display and body |
| figure on surface `#17131D` | 14.74:1 | board tiles |
| figure-2 `#A89F91` on ground | 7.49:1 | secondary text, interpretations, captions |
| figure-2 on surface | 7.00:1 | board meta |
| brass `#D4A24C` on ground | 8.46:1 | hero word, links, lit states, focus ring |
| brass on surface | 7.91:1 | lit quest marker and border |
| ground on brass | 8.46:1 | not used (no filled brass buttons on this page) |
| moon `#C2301C` on ground | 3.48:1 | **display only** (the closing line at ≥ 61px); banned for body |

Banned pairings, measured so they are not rediscovered: figure-3 `#6E675E` on ground 3.51:1
(hairlines and decorative numerals only, never text); brass-deep `#8A6A2F` on ground 3.90:1
(rules only); figure on brass 1.86:1 (never); moon on surface 3.25:1 (never as text).

Colour never carries information alone: a lit quest also changes its marker shape (ring → disc)
and its label ("Lit").

## Media

Photography bleeds full-width in the hero, the two video sections and the closing; it is
contained in the inhabitant portrait (4:5 crop of the right half), the pinned path frame
(3:2, sticky) and the campaign hover frames (3:2, 22vw wide, max 330px, anchored at the right gutter beside the row and following the cursor vertically; inline thumbnails below 1280px). Images
are shown at full strength; no tint, no blend, no blur. Type crosses media in the hero, the
video sections and the closing, and in each case the scrim belongs to the type: a gradient
rising from the bottom of the copy block (`scrim` token), never a darkening of the whole
picture. Every image has a `background-color: surface` behind it so a slow CDN leaves a
composed rectangle, not a hole. Videos are muted loops with the matching still as `poster`.

## Motion

GSAP 3 + ScrollTrigger earn their place for exactly two jobs: the hero handoff and the pinned
path sequence. Everything else is CSS state feedback at the micro/move tokens.

| Name | Owner | What moves |
|---|---|---|
| `hero-reveal` | GSAP timeline, on load | the word *Codex* rises out of a clip (800ms, ease-out), poster settles from scale 1.06 to 1 over 1.6s, the sub-line fades at +300ms |
| `hero-handoff` | ScrollTrigger scrub 1 | over the first 100vh the poster drifts up 12% and the title moves up 40vh and fades — it hands off to the portrait section rather than stopping |
| `paths-pin` | ScrollTrigger pin, scrub 1 | the six-path section pins for 600vh; each path's copy scrolls through a fixed reading column while the sticky image crossfades (opacity 0→1, scale 1.04→1) to the next path; the roman numeral counter ticks |
| `portrait-wipe` | ScrollTrigger once | the portrait's `clip-path: inset(0 0 100% 0)` opens to `inset(0)` (scene, ease-out) |
| `rows-rise` | ScrollTrigger once, batch | campaign rows and board tiles rise 24px → 0, 60ms stagger, max 8 |
| `board-count` | JS on toggle | the XP figure counts to its new value over 400ms |

Reduced motion: no ScrollTrigger is created; the paths section is unpinned and each path
becomes a 100vh block with its own image; every element is at its final state; videos are
replaced by their posters; the XP figure updates instantly. The content is identical.

## Accessibility

Landmarks: `header` (nav), `main`, eight `section`s, seven with an `h2` and the hero with the `h1`, `footer`. One `h1`
(*The Rustam Codex*); `h2` per section; `h3` for path names, campaign titles and quest
titles. Skip link to `main`. Focus ring is brass 2px at 4px offset everywhere; over imagery
it gains the ground-coloured halo from the `focus-ring` token. The quest tiles are real
`<button aria-pressed>` elements; the reset is a `<button>`; the XP figure is a live region
(`aria-live="polite"`). The nav is a plain list of anchors; on mobile it collapses to a
single "Index" disclosure. Videos are `aria-hidden`, muted, `playsinline`, and paused when
off-screen.

## Known Deployment Debt

- Media is hot-linked from Higgsfield's CDN; if the URLs expire the page shows composed
  surface-coloured rectangles and all copy. Accepted risk, recorded in `09-handoff.md`.
- No photograph of the inhabitant exists; the portrait section uses the commissioned
  "shadow self" still instead. Accepted.
- The quest board stores its lit state in `localStorage` only; it is illustrative and says so.

## Do's and Don'ts

### Do
- Set *Codex* at 16vw and let the dragons and the moon stay visible above it.
- Keep brass to the hero word, lit states, links and focus; nothing else may glow.
- Let each path hand off to the next (crossfade) instead of fading out and in.
- Quote interpretations as interpretations ("the profile reads this as …").
- Put the scrim under the words, not over the picture.
- Theme the parts the browser draws: selection (brass on ground), scrollbar (surface track,
  figure-3 thumb), caret, focus ring.

### Don't
- Don't add a second hero moment, a marquee, a particle field, or a cursor trail.
- Don't put a small uppercase label above a heading.
- Don't use gradient text, glass panels, neon, HUD chrome, or card grids with icons.
- Don't shrink the hero below 16vw to "make room"; move the sub-line instead.
- Don't invent a fact: no progress bars for the thesis, no client logos, no XP totals that
  claim to be real.
- Don't let the red moon colour appear as a UI colour; it is the closing line and the imagery.
