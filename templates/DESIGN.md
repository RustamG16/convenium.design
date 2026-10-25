---
# ============================================================================================
# THE TOKEN BLOCK IS WRITTEN BEFORE ANY LAYOUT CODE, AND IT IS WRITTEN AS NUMBERS.
#
# This is the single highest-leverage artifact in the run. A type ramp that is decided here,
# in writing, comes out decisive. A type ramp left to emerge while writing CSS comes out
# timid every time — the observed failure mode is a hero set two to three times smaller than
# the chosen doctrine calls for, after which every other decision is compromised to make the
# small type look deliberate.
#
# Fill every value. "TBD" here means the decision has not been made yet, and implementation
# must not start.
# ============================================================================================
name:
description:                 # one sentence: the visual world, not the product
northStar:                   # the direction's name, from 04-decision.md

colors:
  # Every colour the interface may use, with its hex. Nothing is composed at build time.
  # Record the legal foreground/background pairings and their MEASURED ratios in the prose
  # below; a pairing that is not written down is not permitted.

typography:
  # One entry per role. Every role carries fontFamily, fontSize, fontWeight, lineHeight.
  # Fluid sizes must include a rem term alongside any vw term so the scale still responds to
  # text zoom (WCAG 1.4.4).
  #
  # Check the hero against the chosen doctrine's --display-max before moving on:
  #   convenium-design-kinetic  12-18vw       convenium-design-atelier  a fixed step from the scale, never fluid
  #   convenium-design-instrument  11-28px    convenium-design-cyberpunk-athens  per that doctrine's tokens
  hero:
    fontFamily:
    fontSize:
    fontWeight:
    lineHeight:
    letterSpacing:
  display:
  body:
  label:

spacing:
  scale:
  gutter:
  measure:

motion:
  micro:                     # state feedback
  move:                      # element transitions
  scene:                     # section handoffs
  ease-out:
  ease-in-out:

breakpoints:
  target:                    # the designed viewport(s). name them, do not imply them

components:
  # Each interactive component with its exact colours, type role, and contrast ratio.
---

# [Project] — [direction name]

## Visual World

What the page is made of, in a paragraph. Name the ground, the type, the media treatment and
what the visitor is looking at. Written so that someone who has not read the brief could pick
this page out of ten others.

## Type

Why these faces, what each one is confined to, and how the scale behaves. State the hero size
in vw and say why it is that number.

## Colour

The legal pairings, each with its **measured** ratio. State the banned pairings and their
measured ratios too, so they cannot be rediscovered by accident.

## Media

How photography, video and illustration are treated: bleed or contained, full strength or
scrimmed, and where type is allowed to cross an image. If type crosses media anywhere, say
whether the scrim belongs to the type or to the picture — it should belong to the type.

## Motion

Which library earns its place and for exactly what. Every scroll-linked or timeline animation
named, with its owner. State the reduced-motion end state.

## Accessibility

Focus treatment, landmark and heading structure, the widget patterns in use, and any place
where a token changes with context (a focus ring over a light field, for instance).

## Known Deployment Debt

What is unfinished, unsupplied or accepted as a trade. Each item also appears in
`09-handoff.md` as a launch blocker or an accepted risk.

## Do's and Don'ts

### Do
- Six or so, specific to this project. Not general design advice.

### Don't
- Six or so. Include the failure modes this direction is most likely to drift into.
