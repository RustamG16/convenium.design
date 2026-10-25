# PLAN — Folio

Milestones, each with deliverables and acceptance checks. Work them in order; each one is
small enough for a few sessions. Repeat the adversarial turn at the start of each.

## M0 — Lock the input (questionnaire + schema)

Deliverables
- `packages/schema/profile.schema.json` v1 frozen; zod types generated.
- `questionnaire/PROMPT-FOR-YOUR-LLM.md` v1.
- Eight fixture profiles in `questionnaire/examples/` (one per role), produced by actually
  running the prompt in at least three different LLMs (ChatGPT, Claude, Gemini) with real or
  realistic people.
- Import parser: paste → extract JSON block → repair → validate → error list.

Acceptance
- All eight fixtures validate. Five deliberately broken pastes (prose around JSON, trailing
  commas, smart quotes, truncated array, invented keys) produce field-level errors a
  non-technical user can act on.
- The prompt run in three LLMs produces valid JSON on first try ≥ 4 of 5 attempts each.

## M1 — Classify and DNA (engine, no UI)

Deliverables
- `packages/taxonomy` from `taxonomy/roles.json`.
- `classify()` rule-based with LLM tie-break behind `LLMGateway`.
- `packages/dna`: `deriveDNA()` implementing `design-dna/mapping.md`; `doctrines.json` with
  the six families; type pairings table; palette derivation with measured contrast.
- Determinism and distinctness tests.

Acceptance
- Every fixture classifies to the intended role with confidence ≥ 0.7.
- Same profile → byte-identical DNA across 100 runs. Sliders change DNA monotonically.
- Pairwise test: no two fixtures share (doctrine, hue bucket, hero variant).

## M2 — Compose and render (first sites)

Deliverables
- `packages/engine/compose()` with the section library; copy step with source paths.
- `packages/templates`: Astro project, section components for the v1 section library, two
  doctrine themes fully built (atelier, kinetic), tokens from DNA, motion islands with
  reduced-motion end states.
- `pnpm render:fixtures` and the QA gate script (Playwright + Lighthouse).

Acceptance
- All fixtures render and pass the QA gate. Screenshots at 390 and 1440 reviewed by a human
  and by the independent critic flow from Convenium.Design (`award-rubric`) scoring ≥ 75.
- Zero-media render of every fixture is presentable.

## M3 — App: import → review → preview → publish

Deliverables
- Next.js app: auth, import screen, review screen (what we understood, gaps, visibility
  toggles, role override), DNA screen (three sentences + two sliders + live token preview),
  build status, preview, publish to subdomain.
- Inngest pipeline wired end to end; R2 bundles; hostname router Worker; `*.folio.site`.
- Field edits with stale-edit handling; re-import.

Acceptance
- A new user goes from paste to live subdomain in under 10 minutes without help, three
  times with three different fixture profiles.
- Rollback works; a failed QA build never replaces a live site.

## M4 — Doctrines, media, polish

Deliverables
- Remaining four doctrine themes with fixtures passing QA.
- Media slots: uploads with rights checkbox; `ImageProvider` for ambient generated media
  (Pro); typographic fallbacks for every slot.
- OG image generation per site; SEO basics; contact form with Turnstile and Resend relay.

Acceptance
- Distinctness test still passes with six families. Lighthouse ≥ 90 on every fixture with
  generated media present.

## M5 — Billing, domains, launch

Deliverables
- Stripe: Free, Pro; credits ledger; badge and `noindex` rules.
- Custom domains via Cloudflare for SaaS; status machine; registrar instructions.
- Landing page (built with Convenium.Design, from its own PRODUCT.md/DESIGN.md), docs page
  with the prompt, privacy and terms, report link.
- Beta: 20 users, feedback loop, the "looks like me" prompt.

Acceptance
- Five paying users. Support tickets per published site < 0.4.

## M6 — After launch

RTL and additional languages; role packs (role-specific prompt variants); Studio tier (teams,
organizations table); analytics for site owners; export of the static bundle.

## Session plan

Each milestone is 2–6 Claude Code sessions. Start every session by reading
`ARCHITECTURE-ESSENTIALS.md` and the milestone's acceptance checks; end every session with a
dated entry in `PROGRESS-AND-DECISIONS.md`.
