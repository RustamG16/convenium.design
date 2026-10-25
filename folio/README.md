# Folio — design-DNA portfolio sites from one profile file

Working name: **Folio** (by Convenium). Rename freely; nothing below depends on the name.

A person answers a questionnaire **inside the LLM they already use** (ChatGPT, Claude, Gemini,
whatever). The LLM fills a structured profile file with them. They upload that file here. Folio
classifies them by role, derives a **design DNA**, composes a section plan, renders an animated
single-page portfolio, and publishes it on their own subdomain or domain.

This folder is the complete context pack for building it. It follows Convenium.Design's
**six-files-before-code** rule (`library/knowledge/00-rules/six-files-before-code.md`) plus the
scaffold pass, and it was written before any product code.

## Read order

1. `ARCHITECTURE-ESSENTIALS.md` — one screen. Read first, every session.
2. `PRD.md` — what, for whom, what it must do, what it must not do.
3. `ARCHITECTURE.md` — the full stack, data model, pipeline, and why.
4. `AGENTS.md` — how agents work in this folder. `CLAUDE.md` points here.
5. `ADVERSARIAL-TURN.md` — what will break, what is missing, what is over-engineered. Already
   applied to the files above; read it so you do not re-add what it cut.
6. `PLAN.md` — milestones M0–M6 with deliverables and acceptance checks.
7. Then only what the task needs:
   - `questionnaire/` — the prompt users paste into their LLM, the profile schema, an example.
   - `taxonomy/` — role categories and what each role must show.
   - `design-dna/` — how profile answers become a doctrine and tokens.
   - `pipeline/` — import → classify → DNA → compose → render → QA → publish, and the section
     library the composer picks from.
   - `data/` — the Drizzle schema stub.
   - `apps/`, `packages/`, `workers/` — the scaffold pass (stubs only).
   - `BUSINESS.md` — pricing, positioning, go-to-market, competitors.
8. `KICKOFF-PROMPT.md` — paste this into a new chat to continue.

## Status

Six files + adversarial turn + scaffold: done (2026-10-22). No product code yet. Next step is
M0 in `PLAN.md`: lock the profile schema and the questionnaire prompt against five real test
profiles.
