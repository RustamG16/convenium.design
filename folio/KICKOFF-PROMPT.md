# Kickoff prompt for the next chat

Paste this as the first message of a new Claude Code session on this repository.

---

Continue the Folio project in `folio/`. Read `folio/README.md`, then
`folio/ARCHITECTURE-ESSENTIALS.md`, `folio/PRD.md`, `folio/AGENTS.md`,
`folio/ADVERSARIAL-TURN.md` and `folio/PLAN.md`. Open `folio/ARCHITECTURE.md` only when you
need the reasoning behind a decision.

Then run milestone M0 from `folio/PLAN.md`:

1. Start with the adversarial turn for M0 and append the answers to
   `folio/ADVERSARIAL-TURN.md` with today's date.
2. Freeze `profile.schema.json` v1 in `folio/packages/schema/` (move the draft from
   `folio/questionnaire/`, keep `questionnaire/` as the published copy), generate zod types.
3. Finalise `folio/questionnaire/PROMPT-FOR-YOUR-LLM.md`. Test it by running it yourself as
   the interviewing LLM against three realistic people of different roles; save the resulting
   profiles under `folio/questionnaire/examples/`. Aim for eight fixtures, one per role in
   `folio/taxonomy/roles.json`.
4. Build the import parser in `folio/packages/schema/` (extract the JSON block from a paste,
   repair common LLM mistakes, validate, return field-level errors) with tests covering the
   five broken-paste cases listed in M0.
5. End with a dated entry in `folio/PROGRESS-AND-DECISIONS.md`, commit, and push.

Work on a feature branch, commit per step, and do not touch anything outside `folio/`.
