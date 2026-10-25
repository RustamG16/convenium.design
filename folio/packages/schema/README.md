# packages/schema (stub)

Owns every JSON shape: `profile.schema.json` (v1 draft is in `../../questionnaire/`; moves
here at M0), `dna.schema.json` (draft in `../../design-dna/`), `section-plan.schema.json`
(to write at M2), and the generated zod types.

Exports: `validateProfile(text) → { profile | errors[] }` including the paste extractor and
the LLM-mistake repair pass (trailing commas, smart quotes, prose around the block,
truncated arrays → actionable error). Tests in `__tests__/` cover the five broken-paste cases
in `PLAN.md` M0.
