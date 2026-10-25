# AGENTS — Folio

## Read order

`ARCHITECTURE-ESSENTIALS.md` first, every session. Then only the document the task needs
(`README.md` lists them). Open `ARCHITECTURE.md` for reasoning, not for routine work.

## Ownership and boundaries

- `packages/schema` owns every JSON shape. A change there is a schema version bump and a note
  in `PROGRESS-AND-DECISIONS.md`. The copies in `questionnaire/` are published artefacts
  regenerated from it, never edited by hand.
- `taxonomy/`, `design-dna/`, `pipeline/` are specs. Change the spec, then the package, in the
  same change.
- `packages/templates` is the only place that knows about HTML, CSS and motion. The engine
  produces a section plan and tokens; it never emits markup.
- `apps/web` never imports `packages/engine` on a request path. It enqueues jobs.
- The parent repository's `library/` (doctrines, taste-profile schema, skills) is read-only
  from here. Reference by path.

## Working rules

- Six files before code applies to every new package: a `README.md` with purpose, contract,
  and non-goals before the first `.ts`.
- Determinism is a test. Any function in `packages/dna` or `packages/engine` that chooses
  among options must take a seed derived from the profile id, and must have a test asserting
  identical output for identical input.
- Copy produced by the LLM carries its `source` path (`"source": "projects[1].summary"`). A
  copy field without a source is a bug.
- No fact without a profile path. Headline, numbers, employers, dates: all traceable.
- Fixture-driven: `questionnaire/examples/` holds one profile per role. Every change to
  classify, DNA or compose runs the fixtures and reviews the diff.
- The adversarial turn is repeated at the start of each milestone: "What will break? What is
  missing? What is over-engineered?" Answers go into `ADVERSARIAL-TURN.md` with the date.

## Evidence and safety

- User data is only the uploaded profile file and what they add in the dashboard. Never log
  profile contents. Never send account data to the LLM.
- Generated media never depicts the person or fake work. Abstract, ambient, typographic only.
- Record every LLM and image call with model, tokens, cost and input hash on the build row.

## Verification before handoff

- `pnpm test` green; `pnpm render:fixtures` green (every fixture passes the QA gate).
- For template or DNA changes: screenshots of three fixtures at 390 and 1440 attached to the
  PR, before and after.
- `PROGRESS-AND-DECISIONS.md` has a dated entry.

## Design doctrine

The generated sites follow Convenium.Design's doctrines (`../library/doctrines/`). The DNA
mapping may produce new families (see `design-dna/doctrines.json`); each must state its tokens
as numbers the way `../templates/DESIGN.md` demands, and each ships with a fixture site that
passed the QA gate.
