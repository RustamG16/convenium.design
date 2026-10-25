---
id: ds-000
title: Three design setups
created: '2026-08-28'
---

# Three design setups

Three agents, three doctrines, three token systems. Give any of them the same brief and
you get three genuinely different high-quality results — not three colour variations of
the same layout.

| Setup | Doctrine | Reach for it when |
|---|---|---|
| [**atelier**](convenium-design-atelier.md) | Editorial restraint. Type carries everything. Motion is nearly absent. | Brand sites, editorial, portfolios, anything that should feel considered and expensive |
| [**kinetic**](convenium-design-kinetic.md) | Motion-first cinema. The scroll is the narrative device. | Launches, campaigns, product stories, anything meant to be *experienced* |
| [**instrument**](convenium-design-instrument.md) | Dense and systematic. Information per pixel is the metric. | Dashboards, maps, tools, docs — including the [system map](../04-ui-references/system-map-ui.md) |

## Why three and not one

An unguided model converges on the same look regardless of brief: centred hero, rounded
cards, indigo gradient, fade-up on scroll. `tastemaker` calls this "AI-slop defaults" and
tries to fix it by constraining toward *your* taste — but a single taste profile makes
everything look the same too, just more pleasantly.

These three fix it differently: each carries a **doctrine that forbids things the other
two require**. Atelier bans the scroll choreography Kinetic is built on. Kinetic bans the
stillness Atelier depends on. Instrument bans the whitespace both of them spend freely.
The constraints are what make the outputs diverge.

## How to use them

Invoke one by name:

```
Use convenium-design-kinetic to design the landing page for X
```

Or ask for all three when you want options:

```
Design the landing page for X three ways — convenium-design-atelier, convenium-design-kinetic, convenium-design-instrument
```

Each returns a static comp plus its token set. Then run `themis` over the results — the
setups build, they do not grade themselves.

## Rules that bind all three

Inherited from `~/.claude/skill-index/_common-design.md`:

- **Direction before implementation.** These agents set direction and build comps.
  `hephaestus` implements motion; `zeus` writes application code.
- **Judgement is themis's.** No self-grading, no pre-empting an accessibility pass.
- **Accessibility is a constraint during the work, not a finding after it.**
- **Every motion decision needs a `prefers-reduced-motion` answer** — including
  atelier's decision not to animate.
- **`anthropic-skills:brand-guidelines` applies Anthropic's own brand.** Never on client
  work.

## One thing to know before running these

`anthropic-skills:awwwards-web-design` — convenium-design's documented routing choice #1 — **is not
loaded outside the `005-agency` project**. None of these three setups route to it. They
are built only on skills that are actually available. See
[../06-health/installed-skills-check.md](../06-health/installed-skills-check.md).

## Installed

All three are live in `~/.claude/agents/`. They are additive — `convenium-design` and `convenium-design-run`
are untouched.
