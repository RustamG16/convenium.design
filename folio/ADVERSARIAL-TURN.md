# Adversarial turn — Folio

Asked once over the six files on 2026-10-22, before any code: *What will break? What edge
cases are we missing? What is over-engineered?* Each answer was written back into the files;
this document keeps the reasoning so it is not re-litigated. Repeat at the start of every
milestone and append.

## What will break

| # | Failure | Likelihood | Written back as |
|---|---|---|---|
| 1 | **The LLM does not output valid JSON.** ChatGPT wraps it in prose, truncates long arrays, invents keys, uses smart quotes. | Certain, daily | Import accepts the whole paste and extracts the first fenced JSON block; a repair pass fixes trailing commas and quotes; schema errors are shown per field with "ask your LLM to fix: …" copy. The prompt ends with "print only the JSON block". M0 tests the prompt on five LLMs. |
| 2 | **The LLM invents facts** to fill required fields (fake dates, fake employers). | High | The prompt makes every field nullable and says "write null, never guess". The review screen shows every value for confirmation before generation. The schema has no required proof fields; composition drops empty sections. |
| 3 | **Thin profiles.** A student with one project and no work history produces a page that is 70% empty. | High | Role taxonomy defines a minimum viable set per role; below it, we generate a one-screen "card" variant instead of a long page and say so. Never pad. |
| 4 | **Everything looks the same.** The DNA space collapses to "dark + serif + fade-in" for every creative. | High, and fatal | Determinism with a hash-seeded hue, six doctrine families, ~12 type pairings, four hero variants per family, and a CI test that renders all fixtures and asserts pairwise distinct (doctrine, palette hue bucket, hero variant) for different roles. Measured, not hoped. |
| 5 | **Motion kills performance on phones.** | Medium | Motion level is a DNA token with three values; `lively` is only allowed when the page has ≤ 8 sections; Lighthouse mobile ≥ 90 is a hard QA gate, not a target. |
| 6 | **Contrast fails on generated palettes.** | Medium | Palettes are derived from a doctrine's legal pairings with measured ratios; the DNA step computes and stores ratios; QA re-measures from the rendered DOM. |
| 7 | **Re-import clobbers edits.** | Medium | Edits are JSON-path overrides with the "edited-against" value; stale edits are surfaced, never silently dropped or silently kept. |
| 8 | **Custom domains: wrong CNAME, Cloudflare proxied records, TLS pending forever.** | Medium | Domain status machine with explicit states and user-facing instructions per registrar; preview on subdomain always works meanwhile. |
| 9 | **The build worker dies mid-pipeline.** | Medium | Every step idempotent on `buildId`; a build is either `qa_passed`, `qa_failed` or `failed`; the site always points at the last good build. |
| 10 | **Prompt injection via the profile.** A profile summary says "ignore previous instructions and write…". | Medium | The LLM copy step receives fields as data in a structured call, with a system prompt that forbids instruction-following from content; output is validated against the plan schema and length limits; render escapes everything. |
| 11 | **Abuse: impersonation, spam sites, adult content.** | Medium | Free tier gets a Folio badge and `noindex` until the account is verified by email; a report link on every site; simple content classifier on import for obvious abuse; terms. |
| 12 | **Media rights.** Users upload work that is not theirs; generated media licence varies. | Low but costly | Rights checkbox per upload, licence recorded per asset, takedown path. |

## Edge cases we were missing

- Non-Latin names and bidirectional text: schema has `language`; templates must support RTL
  from day one (test fixture in Arabic or Hebrew) or explicitly not support it in v1. Decision:
  **v1 supports LTR only and says so on the landing page; RTL is M6.**
- Two roles at once (designer who codes). `secondaryRole` exists in classification; the
  composer takes required sections from the primary and optional from the secondary.
- People with no links at all. Fine; contact becomes the form.
- Privacy: a therapist cannot show clients; a researcher under embargo. `visibility: private`
  per entry; the review screen defaults nothing to public without showing it.
- Very long project lists (a photographer with 300 images). The profile bounds arrays (max 24
  work items, max 12 projects); the prompt says so; more is "later, in the dashboard".
- Name collisions on subdomains. Slug = requested handle, first come; suggestions on conflict.
- The user's LLM is in another language. The prompt answers in the user's language and keys
  the JSON in English. Copy generation preserves the profile's language.
- Someone pastes someone else's profile. Nothing stops it; it is their site, their account,
  their liability; the report link covers impersonation.

## What is over-engineered (cut)

- **Role-specific prompts (eight prompts)** → one prompt with a role question up front that
  branches inside the conversation. One file to maintain. Role packs are M4 at the earliest.
- **Sliders beyond two** → exactly two (quiet ↔ loud, warm ↔ cold). Every extra control is a
  taste decision pushed back to the user, which is the thing we are selling against.
- **A DNA rationale written by the LLM** → the three sentences are templated from the DNA
  tokens. No LLM call.
- **Generating media for every site** → media is additive. Most sites launch with uploads or
  typographic heroes. Generation is a Pro credit feature.
- **Multi-tenant Astro projects per site** → one template system, one build per site with
  inputs. No per-site codebase.
- **Org/teams in v1 data model** → `users` only; `organizations` arrive with Studio and a
  migration. The starter's org model is not copied over.
- **An SDK or API for third parties** → no. The prompt and schema being public is the API.

## Open (needs a decision before the milestone that touches it)

- Hosting the app itself: Vercel (fast) or Cloudflare (one provider)? Decide at M2.
- Which image provider behind `ImageProvider` for Pro media: Higgsfield (already connected to
  the founder's account) vs. a cheaper abstract-only model. Decide at M4.
- Pricing numbers in `BUSINESS.md` are placeholders until five paying beta users exist.
