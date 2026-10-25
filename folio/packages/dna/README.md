# packages/dna (stub)

`deriveDNA(profile, role, sliders, { mappingVersion }) → DNA` implementing
`../../design-dna/mapping.md` with `../../design-dna/doctrines.json`.

Contract: pure, deterministic, no I/O. Seed = sha256(profileId) → xorshift PRNG; every
"pick one of N" draws from it in a fixed order. Contrast is measured with WCAG 2.x relative
luminance; failing accents are nudged in 2% lightness steps (max 10) and the nudge is
recorded in `dna.notes`.

Tests: determinism (100 runs), slider monotonicity, every family produces AA pairings,
pairwise distinctness across the fixture profiles.
