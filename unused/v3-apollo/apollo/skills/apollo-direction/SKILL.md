---
name: apollo-direction
description: Set the visual direction for something that does not exist yet — a new site, landing page, hero, or screen — working from a brief and optional reference URLs. Mines real tokens from references rather than inventing from memory, then proposes 2–3 distinct directions with concept, tokens, type pairing, and a named signature moment. Use for "design this page", "make it premium / high-end / award-winning", "make it look like [site]", or any new-build brief. For critiquing something that already exists, see `apollo-audit`.
---

# Apollo — Direction

Set the visual direction for a `NEW` job. Work from **evidence, not memory**.
When there is a reference, mine it for real values before proposing anything.

You produce direction. You do not implement it — no GSAP, no framework wiring,
no production code. The comp comes later (Stage 4) and the implementation is the
user's, guided by `apollo-handoff`.

## Why this skill exists

The untrained default for "design me a page" is safe and generic: a centered
max-width container, a three-column card grid, a stock gradient, default type
scale, fade-in on scroll. Competent, and completely forgettable.

Worse, current AI design clusters around three recognisable looks:

1. warm cream background (~`#F4F1EA`), high-contrast serif display, terracotta accent
2. near-black background, one acid-green or vermilion accent
3. broadsheet layout, hairline rules, zero radius, dense columns

All three are legitimate *for some briefs*. But they show up regardless of
subject, which makes them defaults rather than choices. Where the brief pins a
direction, follow it exactly — the brief's own words always win, including when
it asks for one of these. Where the brief leaves an axis free, do not spend that
freedom on a default.

## Ground it in the subject

If the brief does not pin down what the thing actually is, pin it yourself before
designing: name the subject, its audience, and the page's single job, then state
your choice so the user can correct it.

Distinctive choices come from the subject's own world — its materials,
instruments, artifacts, vernacular. A page about freight has freight's visual
language available to it. Reaching past the subject for a generic "premium" look
is how you land on one of the three defaults above.

## Phase 1 — Extract evidence

**With a reference:** read `references/reference-extraction.md` and follow it. It
covers capturing screenshots, pulling computed tokens (color, type, spacing,
radii, button treatments) from the live DOM, reading section ordering and nav
behavior, and detecting motion cues.

You are recovering the *grammar* — the rules the designer followed — so you can
apply those rules to different content. Not the pixels.

**Without a reference:** skip to Phase 2, but "no reference" is never licence to
default. Invent a deliberate direction and say what it is grounded in.

Write findings to `_apollo/evidence/extracted-tokens.json`.

## Phase 2 — Propose 2–3 directions

Not one. The user's judgement enters here, before comp work, where changing
course is still cheap.

Each direction is compact and complete enough to choose between:

```
## Direction [N] — [one-word name]
- Concept:    one sentence. The bold idea. If it fits any other brief, it's not it.
- Mood:       the adjective stack (e.g. "austere, editorial, high-contrast, kinetic")
- Type:       display face + weight + tracking; body face; utility face if needed;
              the scale ratio between H1/H2/body
- Color:      4–6 named tokens with hex + role (bg, ink, accent…). State the
              accent's rule — where it is allowed to appear and where it is not.
- Layout:     the archetype (bento / asymmetric editorial / brutalist grid /
              split-screen) plus an ASCII wireframe of the hero
- Surface:    grain, glass, blend-mode, none
- Motion:     2–4 signature interactions, described with intent and timing.
              Named, never coded.
- Signature:  the single thing this page is remembered by
- Costs:      what this direction is bad at, and who should not pick it
```

The `Costs` line is not optional. Three directions with no stated downsides is
three ways of saying the same thing.

Make the directions genuinely different — different concepts, not one concept in
three palettes. If two of them could be swapped by changing a hex value, you have
produced one direction.

## Phase 3 — Self-check before showing

Before the user sees anything, work through the brief a second time as if you
had never seen your own answer. If you arrive somewhere similar, that part is a
default rather than a choice — revise it, and say what you changed and why.

Then, on the direction the user picks:

- **Spend boldness in one place.** The signature is the memorable thing;
  everything around it stays quiet and disciplined. Two signatures is none.
- **Match complexity to the vision.** Maximalist needs elaborate execution;
  minimal needs precision in spacing, type, and detail. Elegance is executing
  the chosen vision well, not choosing a safe vision.
- **Structure is information.** Numbering, eyebrows, dividers, and labels should
  encode something true about the content. `01 / 02 / 03` is right only when the
  content is genuinely a sequence.
- **Take one real risk you can justify.** Not taking a risk is itself a risk —
  it is how work reads as templated.
- **Then remove one thing.** Before showing it, look again and cut the weakest
  accessory.

## Quality floor — designed in, not audited later

Every direction must be viable at 375 / 768 / 1024 / 1440 / **1920** / 2560.
1920 is the primary target and gets composed deliberately: a direction that is
really a 1440 layout with wider margins is not finished. Say what the extra
space is *for*.

Contrast, visible keyboard focus, and a complete `prefers-reduced-motion`
experience are constraints on the direction, not findings against it later. A
direction whose accent fails contrast on its own background is not a direction.

## Handing off

Motion is **described** here — effect, trigger, duration, easing intent — and
implemented elsewhere. Name the effect precisely enough that an implementer does
not have to guess, and note which tool or specialist owns it (GSAP/ScrollTrigger,
Three.js, Remotion). Writing the animation code is out of scope for this skill.

Once a direction is chosen, the token set goes to `apollo-tokens` and the spec to
`apollo-handoff`.
