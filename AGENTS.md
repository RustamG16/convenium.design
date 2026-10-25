# Olympus operating instructions

These instructions apply whenever this folder is attached as context for a project's design
work — a website, a brand identity, or whatever the business's Brand DNA says it needs.

## Source of truth

- Start with `START-HERE.md`; it defines the gated workflow.
- Treat this repository as reusable and read-only during project work.
- Write project evidence and decisions only under `<website-project>/.olympus/`.
- Existing user work is not disposable. Preserve unrelated changes and the project’s established framework, conventions, and component system.

## Required behavior

- Ask the intake questions before auditing or editing (see loop bound 2).
- Obtain Gate A before concepts, Gate B before implementation, and Gate C before calling the work final.
- Follow the direction rule below: resolve one direction at intake; do not generate alternatives by default.
- Prefer evidence from the actual page, source, supplied references, analytics, and browser behavior over stylistic claims.
- State what media the user should provide before proposing generation.
- Make new dependencies, WebGL, heavy scroll animation, and external generation opt-in decisions with explicit value and fallback.
- Verify desktop, mobile, interaction states, reduced motion, console/runtime health, accessibility basics, and performance risks.
- Keep an audit trail in `.olympus/` using the templates in this repository.
- Do not begin a new project without the six root context files in
  `templates/project-context/`; run `scripts/validate-project-context.ps1` before Gate A.
- Use progressive disclosure: read Architecture Essentials first, then only the product,
  architecture, agent, or history file needed for the current decision.

## Reading the brief

The brief is read as written. These rules exist because each was violated at least once by a
run that meant well.

1. **Explicit creative freedom cancels the intake round.** "Full freedom", "no need to ask",
   "just make the best you can from what you have" — resolve the intake fields from the brief
   and the supplied material, record them in `00-brief.md` as *director-resolved*, and get on
   with it. Asking anyway is not diligence; it is ignoring the instruction.

2. **A refusal is not a request.** "No need for three directions" means produce one. So does
   "don't give me options". Read the sentence for what it rejects and encode that rejection
   as an acceptance criterion in `06-build-plan.md`, so the build cannot quietly reintroduce
   what the brief threw out.

3. **"Current", "trending", or a named year opens a research lane.** The run may not assert
   what is current from memory. Fetch it, and cite it under *Research basis* in
   `06-build-plan.md` with live URLs.

4. **An ambition word is a floor, not a flourish.** "Awwwards-level", "high-end", "premium"
   binds the craft slot and the type scale. It never excuses unclear hierarchy, inaccessible
   interaction, or invented facts — but a timid result against that brief is a failure to
   deliver, not a safe choice.

5. **Supplied media is the direction's evidence.** When a brief says "from the imagery it
   got", the media set is the reference; `reference-deconstruction` carries the evidence
   phase and no external references are introduced.

## The build plan is the design

`06-build-plan.md` is a creative document — art direction, palette, type scale as numbers,
a page sequence with an explicit per-section media map, and motion choreography — not a task
list. Write it before implementation, and where the host has a plan mode, write it there.

**Implement from it in a fresh session.** The conversation that produced a plan is dead
weight during the build, and a build that starts from a complete design document beats one
that discovers the design while typing. This is the single largest observed difference
between a run that produced award-level work and one that did not.

## The design-system rule

The design system is committed as numbers before any layout code exists. `PRODUCT.md` and
`DESIGN.md` are written into the website project after Gate B and before implementation, and
`DESIGN.md`'s token block carries real values — type ramp, colour, spacing, motion — not
placeholders. Nothing in it may read "TBD" when the build starts.

This exists because the failure it prevents is systematic rather than occasional: a type scale
left to emerge while writing CSS comes out timid, and once the hero is set two to three times
smaller than the chosen doctrine calls for, every later decision bends to make the small type
look deliberate — media gets boxed to match, ground gets darkened to compensate, and the page
reads as cautious. Deciding the number in writing, first, is what prevents it.

The committed hero size is checked against the chosen doctrine's `--display-max` and both are
recorded in `run.json` under `design_system`. The doctrine wins unless the disagreement is
argued in writing.

## The direction rule

Direction is decided at intake, not by generating alternatives. The questionnaire and taste
profile must resolve direction before Gate A. The default output is **one** direction.
Produce more only when the user asks for alternatives, and state how many and why.

The Brand DNA is load-bearing. Every project gets one before Gate A: the `brand-strategist`
specialist analyses the business (its site, socials, reviews, competitors and media, or an
interview when there is no public presence) and writes `.olympus/brand-dna.json` plus
`BRAND.md` in the project — business, audience, voice, taste, doctrine match and the ranked
products it needs. The taste part comes from `$convenium-design-taste-interview` or
`$convenium-design-style-picker` rather than guessing. Client DNA lives with the client project, never in
this repository; a user's personal default taste may live in `~/.apollo/taste.json`.

Greenfield work has an entry: with no existing page the run starts at the questionnaire,
`$ux-evidence-audit` stays dormant, and `$reference-deconstruction` carries the evidence phase.

## Delegation policy

The default is a single Design Director using focused skills. Optional custom agents in `.codex/agents/` are specialists, not a hierarchy.

- Delegate only a bounded phase with a written output contract.
- Never launch all specialists.
- Never let a specialist delegate further.
- Run authors and critics sequentially when both may touch the same files.
- Use parallel work only for independent read-only evidence gathering, with at most two workers.
- The Design Director integrates the result and owns user communication.

## Token control — two-stage skill loading

- Route from `library/registry/ROUTING-DIGEST.md` — one line per pipeline-active skill.
- Load a `SKILL.md` body only after the routing decision is made.
- Never load more than one `SKILL.md` body per phase.
- Share file paths and concise phase packets, not the whole conversation.
- A critic identifies defects and scores work; it does not secretly redesign it.
- Stop and ask when a missing choice would materially alter direction, cost, rights, or technical risk.

## Loop bounds

These bounds are stated here and nowhere else; every other file refers to "the loop bounds
in `AGENTS.md`" rather than restating a number.

1. **QA repair** stops after two author-fix / critic-review cycles; after the second cycle the
   director presents remaining defects and tradeoffs to the user instead of looping. Verification
   is two passes, not one: the author's own (`07-qa.md`) and an independent scored finish review
   (`10-finish-review.md`) written by a specialist that did not build the thing. The reviewer
   scores against `DESIGN.md`, not against taste, and does not fix what it finds.
2. **Intake** is asked once, in one concise message; a question already answered by attached
   material or an earlier reply is never asked again.
3. **An audit is never re-run against unchanged evidence** — the `.olympus/` artifact from the
   previous run is the cache; regenerate it only when the target or evidence changed.
4. **One direction by default** (see the direction rule); more only on explicit request.
5. **Anti-loop:** if a phase's output is byte-identical to the previous attempt, stop and
   escalate — two identical outputs mean the model is not converging and a third attempt will
   not either.

## Cost feedback

Record per-run phase counts in `<website-project>/.olympus/run.json` under `phase_counts`
(increment the phase key each time a phase runs, including repeats). This is the only place
Convenium.Design measures its own loop cost, so the bounds above can be tuned against real data.

## Safety and quality

- Do not copy another site’s distinctive expression. Extract transferable principles and document the transformation.
- Do not invent analytics data, user research, asset rights, or browser verification.
- Do not place secrets in this repository or generated project documents.
- Respect reduced motion and provide non-WebGL fallbacks.
- An “Awwwards-level” ambition does not excuse unclear hierarchy, inaccessible interaction, poor mobile behavior, or unacceptable loading cost.
