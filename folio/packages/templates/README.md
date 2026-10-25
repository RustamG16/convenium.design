# packages/templates (stub)

The Astro project that turns `(sectionPlan, dna, media)` into a static bundle.

- `src/sections/*.astro` — one component per entry in `../../pipeline/section-library.md`,
  typed props, zero-media state, reduced-motion end state.
- `src/themes/<family>.css` — per-family theme consuming DNA tokens as CSS custom properties.
- `src/islands/` — GSAP + ScrollTrigger motion islands, loaded only when `dna.motion.level`
  is `lively` or `calm`.
- `fonts/` — subsetted self-hosted pairings from `doctrines.json`.
- `scripts/render.ts` — CLI: `render --plan plan.json --dna dna.json --out dist/`.
- `scripts/qa.ts` — the QA gate from `../../pipeline/PIPELINE.md` (Playwright + Lighthouse).

Versioned; every build records `templatesVersion` so old sites rebuild identically.
