# ARCHITECTURE — Folio

Allowed to be long. `ARCHITECTURE-ESSENTIALS.md` is derived from this file; change this one
first.

## 1. Shape of the system

Four parts, deliberately separated:

1. **Questionnaire** — a prompt and a JSON schema. Lives in the open (public repo folder,
   public URL). The user's LLM does the interview. We own the schema, nothing else runs there.
2. **App** — account, import, review, DNA sliders, preview, publish, billing, edits. A
   Next.js app. Thin; it never renders portfolios itself.
3. **Engine** — pure functions: `classify(profile) → role`, `deriveDNA(profile, role, sliders)
   → dna`, `compose(profile, role, dna) → sectionPlan`, `render(sectionPlan, dna, media) →
   static bundle`. Deterministic where possible; LLM calls isolated behind one interface.
4. **Publisher** — takes a bundle, puts it on the edge under a hostname, manages TLS.

The engine is a library (`packages/engine`) that the worker calls. The app never imports it
except for the validator and the DNA preview, so a bad render can never take the app down.

## 2. Stack and why

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router), TypeScript, Tailwind for the dashboard only | Team knows it; Convenium starter already uses it; server actions keep the surface small |
| Auth | Clerk | Fastest path to email + OAuth + orgs later; swap cost is one adapter |
| DB | Postgres (Neon) + Drizzle | Same as `convenium-design-starter/db/schema.ts`; branching DBs for previews |
| Jobs | Inngest | Same as the starter's `workflows/run.ts`; step functions with retries, exactly what a 7-step pipeline needs |
| Object storage | Cloudflare R2 | Cheap egress for site bundles and media; same provider as hosting |
| Site hosting | Cloudflare Pages per site, or Workers Static Assets with a hostname router | Wildcard `*.folio.site` + Custom Hostnames (Cloudflare for SaaS) gives managed TLS for user domains |
| Render | Astro (static output) with island components for motion, GSAP + ScrollTrigger, self-hosted fonts | Static HTML is the only way to hit the performance budget on every site; Astro renders the section components to zero-JS HTML and ships JS only for motion islands |
| LLM | Claude API via one `LLMGateway` interface: `claude-sonnet-5-5` for extraction, copy and classification; `claude-fable-5-1` only for DNA rationale text if used at all | One place to swap models, log tokens, cache by input hash |
| Media | Upload (R2) + optional generation (Higgsfield or similar through an `ImageProvider` interface); never required for a site to render | Sites must render with zero media, so media is additive |
| Billing | Stripe Checkout + Customer Portal | Standard |
| Email | Resend | Transactional only |
| Observability | Sentry + structured logs; per-run `run.json` like Convenium's `.olympus/run.json` | Every generated site keeps its own evidence trail |

Rejected: a visual editor (scope), a headless CMS (users edit fields in our dashboard), Vercel
for site hosting (per-site projects do not scale to thousands of tenants cheaply),
LLM-generated HTML (non-deterministic, unverifiable, slow; the LLM writes copy and
classifies, it never writes layout).

## 3. Source layout (monorepo)

```
folio/
  apps/web/              Next.js app: marketing, auth, import, review, dashboard, billing
  packages/schema/       profile.schema.json, dna.schema.json, section-plan.schema.json, zod types
  packages/taxonomy/     roles.json, section requirements per role
  packages/dna/          deriveDNA(): mapping tables, doctrines.json, token math
  packages/engine/       classify(), compose(), copy(), QA checks; LLMGateway
  packages/templates/    Astro project: section components, motion islands, themes from tokens
  packages/publisher/    bundle → R2 → hostname routing → TLS
  workers/build/         Inngest functions: the 7-step pipeline
  data/                  Drizzle schema + migrations
  questionnaire/         the public prompt, schema copy, examples (source of truth is packages/schema)
  taxonomy/ design-dna/ pipeline/   human-readable specs the packages implement
```

Boundaries: `packages/engine` and `packages/dna` have no network access except through
`LLMGateway` and `ImageProvider`. `packages/templates` has no access to the database. The app
reads `sites.status` and never calls the engine on the request path.

## 4. Data model

See `data/schema.ts`. Summary:

- `users` (authId, email, plan), `profiles` (userId, version, json, schemaVersion, source,
  importedAt), `dna` (profileId, version, json, sliders), `sites` (userId, slug, customDomain,
  status, currentBuildId), `builds` (siteId, profileVersion, dnaVersion, sectionPlan json,
  bundleKey, qaReport json, status, tokensUsed, startedAt, finishedAt), `media` (userId,
  siteId, key, kind, source: upload|generated, licence, width, height, alt), `edits` (siteId,
  path, value, updatedAt) — field-level overrides layered over the profile at compose time,
  `credits` (append-only ledger), `domains` (siteId, hostname, cfHostnameId, status).
- Profiles, DNA and builds are **immutable and versioned**. A site points at a build. Rollback
  is a pointer change.
- `edits` is keyed by JSON path into the profile (`experience[2].summary`). On re-import an
  edit survives if the imported value at that path equals the value the edit was made against;
  otherwise it is marked stale and shown to the user.

## 5. The profile file

`questionnaire/profile.schema.json`. Principles:

- Flat where possible, arrays of typed entries for the rest (`experience`, `projects`, `work`
  (portfolio pieces), `education`, `publications`, `talks`, `skills`, `links`, `testimonials`).
- Every entry has `visibility: public | private` (default public).
- Free text is bounded (`summary` ≤ 600 chars) so the composer never needs to summarise.
- `preferences` block carries the design-relevant answers: `vibe` (3 words), `references`
  (sites or brands they admire, optional), `avoid` (things they hate), `colorFeeling`,
  `motionAppetite` (none|calm|lively), `tone` (plain|warm|bold|formal), `audience` (who the
  site is for), `goal` (hired|clients|collaborators|press|academic|personal).
- `meta` carries `schemaVersion`, `generatedBy` (free text, which LLM), `language`.
- No field for colours or fonts. Taste is derived, not requested.

The prompt (`questionnaire/PROMPT-FOR-YOUR-LLM.md`) instructs the LLM to: ask only for missing
fields, one topic at a time, in the user's language; never invent; mark unknown as null; keep
the user's own phrasing; end with exactly one fenced JSON block and nothing after it.

## 6. The pipeline (worker)

Inngest function `site/build.requested` with steps, each idempotent and retried:

1. **validate** — JSON schema + semantic checks (dates parse, URLs resolve shape, ≥ 1 of
   experience|projects|work|publications). Fails fast with a user-facing error list.
2. **classify** — rule-based first (keywords, which arrays are populated, `goal`), LLM only to
   break ties; output `role`, `confidence`, `secondaryRole`.
3. **dna** — `deriveDNA(profile, role, sliders)`: picks a doctrine family from
   `design-dna/doctrines.json`, then derives tokens (palette from `colorFeeling` + role + a
   hash-seeded hue within the doctrine's allowed range; type pairing from the doctrine's pairs
   table; scale; density; motion level; section rhythm). Deterministic: hash(profileId) seeds
   every "pick one of N".
4. **compose** — from `taxonomy/roles.json`, take required sections, add optional ones whose
   data exists, order by the role's narrative order, choose a hero variant from the DNA. Copy
   step: the LLM rewrites nothing structural; it produces the headline (from `headline` or
   derived from role + one proof), section intros ≤ 2 sentences each, and alt text from the
   user's own text. All copy is traceable to a profile path (stored in the plan).
5. **media** — resolve slots: user media first; otherwise generated abstract/ambient media
   from the DNA (never faces, never fake work); otherwise a typographic or generative-CSS
   fallback. A site must render with zero media.
6. **render** — `packages/templates` Astro build with the section plan and tokens as input;
   output a static bundle; upload to R2 under `builds/<buildId>/`.
7. **qa** — headless Chromium: 390 and 1440 widths, full scroll, no console errors, no
   overflow, contrast check on every text/background pair from the DNA, reduced-motion
   render, Lighthouse mobile performance ≥ 90, all internal links resolve, OG image present.
   Fail → the build is marked `qa_failed` with the report; the user sees the previous build.
8. **preview** — publish to `preview-<buildId>.folio.site`; notify the user.

`publish` is a separate, user-triggered function: point the site's hostname at the build.

## 7. Rendering model

- One Astro project is the template system. Sections are components with a typed `props`
  contract (`packages/schema/section-plan.schema.json`). Tokens are injected as CSS custom
  properties from the DNA; no component hard-codes a colour or a size.
- Motion: GSAP core + ScrollTrigger per Convenium's kinetic doctrine where DNA motion level is
  `lively`; CSS-only transitions when `calm`; nothing when `none` or `prefers-reduced-motion`.
- Each doctrine family contributes a `theme` (CSS) and may override section variants (an
  atelier hero is not a kinetic hero).
- Fonts: a curated set of ~12 pairings, self-hosted, subsetted. The DNA picks a pairing; the
  user never does.
- The bundle is fully static; the only runtime JS is motion islands and the contact form
  handler (Cloudflare Worker endpoint, rate-limited, Turnstile).

## 8. Publishing

- `*.folio.site` wildcard on Cloudflare; a Worker routes `host → siteId → current build key`
  and serves from R2 with cache headers. Custom domains via Cloudflare for SaaS custom
  hostnames (user adds a CNAME; we validate and issue TLS).
- Publish = write `sites.currentBuildId`, purge cache for that host. Rollback = same.

## 9. Security and privacy

- The profile file is user data; encrypt at rest (Neon is encrypted; media in R2 with private
  buckets, served through the Worker only for published builds).
- The import parser accepts JSON only, max 256 KB, schema-validated, HTML-escaped at render.
  Markdown is not accepted in v1.
- Contact forms: Turnstile, rate limit per host, email relay through Resend with the user's
  address never exposed in HTML.
- LLM calls send only the profile, never account data; prompts pinned and versioned.

## 10. Build, verify, deploy

- `pnpm -w` workspace. `pnpm test` runs engine unit tests (classification fixtures, DNA
  determinism: same input → same output, section composition against every role fixture).
- `pnpm render:fixtures` renders every example profile and runs the QA gate locally; CI blocks
  on it.
- App deploys on Vercel or Cloudflare; workers on Inngest Cloud; templates version is pinned
  per build so old sites can be rebuilt identically.

## 11. Decisions and costs

- **Interview outside the product.** Saves building a chat UI and the LLM cost of the
  interview; costs us control over quality. Mitigation: the schema is strict and the review
  screen shows gaps.
- **Deterministic DNA, LLM only for copy.** Costs variety ceiling; buys reproducibility,
  testability, and a design we can defend. Variety comes from a wide, well-tested token space,
  not from randomness.
- **Static sites.** Costs: no server features on the site. Buys performance and near-zero
  hosting cost per tenant.
- **One template system, many doctrines.** A new doctrine is a theme + a few section
  variants, not a new codebase.
