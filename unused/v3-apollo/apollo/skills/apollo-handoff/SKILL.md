---
name: apollo-handoff
description: Turn a finished design into an implementation spec someone can build from without asking questions — tokens, layout with real numbers, every component state, responsive rules per breakpoint, motion described, microcopy, and an ordered build sequence with acceptance criteria per step. Use when a design is settled and needs to become code, or when the user says "write the handoff", "spec this out", "implementation plan", or "what do I tell Claude Code". Runs as the final stage of every Apollo job.
---

# Apollo — Handoff

Write `HANDOFF.md`: the document the user feeds to Claude Code to build the
thing. This runs at Stage 6 on every job type, and it is the deliverable that
actually determines whether Apollo was worth running.

## The bar

**An implementer with no other context builds this without asking a single
question.** That is the measurable target, and it is how this skill is scored.

Every question they have to ask is a defect in this document. Before you finish,
reread it as someone who has never seen the design, has not read the brief, and
cannot see your screen. Each time you think "they'll figure that out from
context" — they will not. There is no context. Specify it.

## Principles

1. **Don't assume.** If it is not specified, the implementer guesses, and their
   guess is the generic default. Unspecified is worse than wrong, because wrong
   gets corrected and unspecified ships.
2. **Tokens, not values.** Reference `space-md`, not `16px` — but define the
   token table so `space-md` resolves. Both, in the right places.
3. **Every state.** Default, hover, focus, active, disabled, loading, empty,
   error. Missing states are where implementations diverge from designs.
4. **Say why for anything non-obvious.** "This collapses at 768 because the
   right rail holds secondary info" lets the implementer make good calls on the
   cases you did not foresee — and there are always cases you did not foresee.
5. **Describe motion, never code it.** Effect, trigger, duration, easing,
   reduced-motion fallback. Name the library or specialist that owns it. Code in
   a handoff spec goes stale and gets copy-pasted past its context.

## Structure

```markdown
# Handoff: [name]

## Overview
What this is, who it's for, the one job the page does. 3–5 lines.

## Design tokens
| token | value | role | rule |
Every token, with its usage rule. Contrast ratios already computed and passing.

## Layout
Grid, container widths, and the vertical rhythm — with real numbers.
Per section: its job, its structure, its measurements.

## Components
| component | variant | props | notes |

## States and interactions
| element | state | appearance | behavior |
All eight states where they apply. No gaps.

## Responsive
| breakpoint | what changes |
| 375 | … |
| 768 | … |
| 1024 | … |
| 1440 | … |
| 1920 | … ← primary target, specified not extrapolated |
| 2560 | … |

## Motion
| element | trigger | effect | duration | easing | reduced-motion |
Described. Not implemented. Note who owns each (GSAP/ScrollTrigger, CSS, etc.).

## Microcopy
Every string, in place. See below.

## Edge cases
Empty, long text, missing data, slow connection, longest plausible string,
smallest plausible content.

## Assets
| asset | dimensions | format | where it comes from |

## Build sequence
The ordered steps, each with its acceptance criterion. See below.

## Out of scope
What this spec deliberately does not cover, so nobody builds it by accident.
```

## The build sequence

This is what separates a spec from a plan, and it is the part implementers
actually work from. Order the build so each step produces something checkable,
and give every step an acceptance criterion that can be verified without taste.

```markdown
### Step 3 — Hero section
Build: the hero at 1920, static, no motion yet.
Done when: headline renders at the clamp max (5rem) with -0.03em tracking;
the CTA is 44px minimum in both dimensions; contrast of ink-on-bg computes
to ≥ 4.5:1; nothing overflows at 375 or 2560.
```

Sequence rules:

- **Structure before motion.** Every section static and correct first. Motion
  layered after, so a broken animation never hides a broken layout.
- **One breakpoint first, then the rest.** Build 1920 correct, then work down.
  Do not build "responsive" as a single step — it is not one.
- **Each step independently verifiable.** If a step's acceptance criterion needs
  the next step to be true, merge them.
- **State the checkable thing, not the feeling.** "Headline is impactful" is not
  an acceptance criterion. "Headline is 5rem at 1920, tracking -0.03em, single
  line above 1440" is.

## Microcopy

Copy is design material, not decoration — bring the same intent to it as to
spacing. Specify every string; do not leave the implementer writing them.

- **Write from the user's side of the screen.** Name things by what people
  control, not by how the system is built. "Notifications", not "webhook config".
- **Active voice, and say what happens.** "Save changes", not "Submit".
- **Keep a name constant through a flow.** The button that says "Publish"
  produces a toast that says "Published". Vocabulary is signposting.
- **Errors don't apologize and are never vague.** Say what happened and how to
  fix it, in the interface's voice.
- **Empty states are an invitation to act,** not a shrug.
- **One job per element.** A label labels; an example demonstrates. Nothing does
  double duty quietly.

Where a string is a genuine judgement call, give 2–3 options with when each
fits, and mark which you recommend. Do not silently pick for the user on copy
that carries brand voice.

If the source content is locked (a redesign that must preserve existing copy),
say so at the top of this section and reproduce the strings verbatim — including
any `[FILL]` placeholders, which stay as placeholders.

## Accessibility

Not a section at the end — it is inside every other section. Focus order in
Layout, contrast in Tokens, keyboard behavior in States, alt text in Assets,
reduced-motion in Motion. If it has collapsed into a single appendix, the spec
is treating it as optional and the implementation will too.

## Before you finish

- [ ] Every token in the table is used somewhere in the spec, and everything in
      the spec resolves to a token.
- [ ] All six breakpoints have explicit rules; 1920 is specified, not implied.
- [ ] Every interactive element has all applicable states.
- [ ] Every acceptance criterion is checkable without taste.
- [ ] Every string is written.
- [ ] Contrast ratios are computed values, not estimates.
- [ ] Reread as a stranger. Count your remaining questions. That count is the
      score — write it at the bottom of the document honestly, along with what
      each open question is.
