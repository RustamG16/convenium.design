---
id: brief-001
skill: canvas-design
source: divyannshisharma carousel, slide 6 — https://www.instagram.com/p/Db0wyP_Ev1G/
upstream: github.com/anthropics/skills/tree/main/skills/canvas-design
local_status: AVAILABLE as `anthropic-skills:canvas-design`
filed: '2026-08-28'
---

# canvas-design

**Already available locally as `anthropic-skills:canvas-design`. Nothing to install.**

## The misconception it corrects

> "Most AI image tools generate pictures."

## What the skill actually does

Produces **design deliverables**, not images:

- Posters
- Covers
- Infographics
- PDFs
- Social graphics

The slide's own annotation on the examples: *"Not image generation. Designed outputs."*

## The mechanism

Before creating anything, Claude defines a **design philosophy** — "like a named creative
movement, with its own rules and principles" — and then executes against that framework.

That ordering is the whole point and it is worth stating plainly: **the constraint is
authored before the artefact.** An image model asked for a poster samples from an average
of all posters. A skill that first commits to a named philosophy, then renders within it,
produces something with internal logic — the same reason the three design setups in
[../../doctrines/](../../doctrines/) each begin with a doctrine rather than a
component list.

## The claim

> "Art with logic behind it. Not a random pretty image. A designed piece."
>
> "AI can generate pictures. Design creates systems."

## Where it sits locally

`anthropic-skills:canvas-design` is listed and available. It is convenium-design's tool for static
deliverables — posters, covers, one-page graphics — as distinct from `frontend-design`
(app UI) and `web-design-pro` (site audit). The `design` skill covers multi-artboard
canvases published as Artifacts; `canvas-design` covers single rendered pieces.
