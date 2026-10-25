# apps/web — the Folio app (stub)

Next.js 15, App Router, TypeScript. Thin: it never renders portfolios and never imports the
engine on a request path; it enqueues Inngest jobs and reads build rows.

Routes (v1): `/` marketing · `/prompt` the questionnaire page · `/sign-in` `/sign-up` (Clerk)
· `/import` paste or upload · `/review` what we understood, gaps, visibility, role override
· `/dna` three sentences + two sliders + live token preview · `/site` status, preview, publish,
edits, media, domain · `/billing` (Stripe portal) · `/api/inngest` · `/api/contact/[site]`.

Non-goals: visual editing, multi-site per user (v1), org management.
