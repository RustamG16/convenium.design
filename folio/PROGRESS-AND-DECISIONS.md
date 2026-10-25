# PROGRESS AND DECISIONS — Folio

Append dated entries. Correct earlier entries with later ones; never rewrite them.

## 2026-10-22 — Project initialized

- Context pack written: six files, adversarial turn, plan, questionnaire prompt + schema +
  example, role taxonomy, design-DNA mapping, pipeline spec, section library, data schema
  stub, scaffold pass, business notes, kickoff prompt.
- Decisions taken:
  - Interview happens in the user's own LLM; Folio owns only the schema and the prompt.
  - Design decisions are deterministic from profile + role + two sliders. The LLM never
    chooses layout, colour or type.
  - Sites are static Astro bundles with GSAP islands, hosted on Cloudflare with a hostname
    router; one template system, many doctrine themes.
  - Stack aligned with `convenium-design-starter` (Next.js, Drizzle, Inngest, Postgres).
  - v1 ships eight roles (see `taxonomy/roles.json`) and four doctrine families inherited from
    Convenium.Design plus two new ones (see `design-dna/doctrines.json`); new families need a
    passing fixture before they are enabled.
- Rejected: visual editor, LLM-generated HTML, multi-page sites, LinkedIn/PDF import in v1.
- Open questions moved to `ADVERSARIAL-TURN.md` § Open.
