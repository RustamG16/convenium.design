# ARCHITECTURE ESSENTIALS — Folio

Derived from `ARCHITECTURE.md`. One screen. If this stops fitting, the architecture is too
complicated.

**What it is.** The user interviews themselves in their own LLM using our prompt, uploads one
`profile.json`, and we classify → derive design DNA → compose sections → render a static
animated site → QA → publish on `name.folio.site` or their domain.

**Four parts.** Questionnaire (prompt + schema, public) · App (Next.js, thin) · Engine (pure
TypeScript library: classify, deriveDNA, compose, render; LLM only behind `LLMGateway`) ·
Publisher (R2 + Cloudflare Worker hostname router + managed TLS).

**Source of truth.** `packages/schema` for every JSON shape. `taxonomy/`, `design-dna/`,
`pipeline/` are the human specs the packages implement; keep them in sync, specs first.

**Stack.** Next.js 15 · Clerk · Postgres (Neon) + Drizzle · Inngest · R2 · Astro static output
+ GSAP islands · Claude API (`claude-sonnet-5-5` for extraction/copy; one gateway) · Stripe ·
Resend · Sentry.

**Data rules.** Profiles, DNA and builds are immutable and versioned; a site points at a build.
Field edits are JSON-path overrides that survive re-import only when the underlying value is
unchanged. Credits are an append-only ledger.

**Hard rules.**
1. The LLM never writes layout, colours or fonts. It extracts, classifies on ties, and writes
   short copy that is traceable to a profile path.
2. Never invent facts. Missing data drops the section.
3. Same profile + same sliders → same DNA → same site. Hash-seeded choices only.
4. A site must render with zero media.
5. Nothing is published without an explicit publish action.
6. Every generated site keeps its own `run.json` + QA report.

**Gates.** Build QA: 390 and 1440 widths, no console errors, no overflow, AA contrast on every
DNA pair, reduced-motion render, Lighthouse mobile perf ≥ 90, OG image present. CI: engine
tests + render every fixture profile through the QA gate.

**Commands (once scaffolded).** `pnpm dev` · `pnpm test` · `pnpm render:fixtures` ·
`pnpm db:migrate` · `pnpm build`.

**Secrets.** Only in the hosting provider's env; never in the repo; LLM and image providers
behind interfaces with per-call token logging.
