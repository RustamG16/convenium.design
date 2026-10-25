# PRD — Folio

## Problem and goal

Most people who need a personal site never make one. Builders (Framer, Webflow, Carrd) ask them
to design; profile tools (Linktree, Bento, Read.cv) give everyone the same card. The result is
either a weekend lost or a page that looks like everyone else's.

Folio's bet: the hard part is **getting the person to say who they are and what they have
done**, and that is now easy because everyone already talks to an LLM. So we move the interview
out of our product and into the LLM the user already trusts, take back one structured file, and
do the design decisions ourselves, deterministically, from a design-DNA model.

Goal: from "I pasted the prompt into ChatGPT" to "my site is live on my domain" in under one
hour, with a result the person is proud to send.

## Audience

Primary (launch): people who are judged by what they have done and need to be found or hired.

- Software engineers and designers (job search, freelancing)
- Freelance creatives: photographers, illustrators, 3D and motion artists, writers
- Founders and consultants (credibility page, speaking, press)
- Researchers and students (thesis, publications, applications)

Secondary (later): coaches and therapists, musicians, athletes, small studios (team pages).

Who decides: the person themselves. Where: at a laptop, usually at night, after an LLM session.
They have a profile file and 20 minutes of patience.

## The user journey

1. **Get the prompt.** On the landing page, without an account, they copy
   `questionnaire/PROMPT-FOR-YOUR-LLM.md` (role-specific variants later).
2. **Interview in their LLM.** The prompt makes the LLM ask only the questions whose answers
   are missing, in order, and finish by printing one `profile.json` block that validates
   against `questionnaire/profile.schema.json`.
3. **Register and import.** They create an account, paste or upload the file. We validate it,
   show what we understood (role, headline, the proof we found), and flag gaps.
4. **Design DNA.** We derive a doctrine, a palette, type, density, motion level, and a tone from
   the profile (`design-dna/mapping.md`). They see three sentences describing their site's
   world and can nudge two sliders (quiet ↔ loud, warm ↔ cold). No colour pickers.
5. **Generate.** The composer picks sections for their role, writes copy from their own words,
   requests or selects media, renders the site, runs QA, and shows a live preview.
6. **Publish.** On `name.folio.site` for free, on their own domain on a paid plan. Updates: edit
   fields in the dashboard or re-import a new profile; the site rebuilds.

## What it must do (v1)

- Accept a profile file that validates against the published schema; show clear, fixable
  errors when it does not.
- Classify the person into one of the taxonomy roles with a confidence; let them override.
- Derive a design DNA deterministically from the profile (same profile → same DNA), with two
  user-adjustable sliders.
- Compose a section plan from the role's required and optional sections; never render an
  empty section; never invent facts not in the profile.
- Render a single-page, animated, responsive site: Lighthouse performance ≥ 90 on mobile,
  WCAG AA contrast, reduced-motion honoured, OpenGraph and SEO basics.
- Publish to a subdomain in under 60 seconds after generation; custom domains with managed TLS.
- Let the user edit any text field and any media slot without regenerating the design.
- Let the user re-import a newer profile; preserve manual edits where the field did not change.
- Billing: free tier (subdomain, Folio badge), Pro (custom domain, no badge, media generation
  credits), Studio later.

## What it must not do

- Never invent employers, dates, awards, numbers or quotes. Missing is shown as missing or the
  section is dropped.
- Never store the raw LLM conversation; only the profile file the user chose to upload.
- Never publish anything the user has not clicked "Publish" on.
- Never ship an identical-looking site to two users with different DNAs; the DNA space must be
  wide enough that role + answers produce visibly different pages.
- Never require the user to pick fonts, colours or layouts. Taste decisions are ours.

## Success criteria

- Time from import to live preview: p50 < 3 minutes, p95 < 8 minutes.
- ≥ 60% of imported profiles are published without a support ticket.
- Generated sites pass the QA gate (`pipeline/PIPELINE.md` step 7) on first try ≥ 80%.
- Two profiles with different roles never share the same doctrine + palette + hero section.
- Users rate "this looks like me" ≥ 4/5 in the post-publish prompt.

## Data and publication boundary

- Stored: account, profile file (versioned), DNA, section plan, generated site bundle, media
  the user uploaded or we generated for them, billing state.
- Not stored: the LLM chat, anything from the user's clipboard other than the file.
- Published: only the rendered site bundle, only after explicit publish, only fields the
  profile marks `visibility: public` (default) rather than `private`.
- Deletion: account deletion removes the site, the bundle, media and the profile within 24 h.
- Media rights: user-uploaded media is theirs; generated media licence follows the provider's
  terms and is recorded per asset.

## Out of scope (v1)

- Multi-page sites, blogs, CMS, e-commerce, booking.
- Team or agency pages (Studio tier, later).
- A visual editor. Field edits only.
- Importing from LinkedIn, GitHub or PDFs directly (the LLM interview is the import path;
  users can paste those into their LLM themselves).
- Native apps.
