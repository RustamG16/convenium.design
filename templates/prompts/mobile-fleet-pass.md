# Prompt — mobile fleet pass (many sites, one standard, one take)

For an agency with several built sites that all need the same app-grade phone experience.
One orchestrator, one measurement, one shell built once, then one bounded agent per site in
parallel. It is the `ss-mobile-fleet` ship in the console; the single-site version is
`mobile-app-grade-pass.md` (`ss-mobile-retrofit`).

**Worked example:** Convenium, 14 sites, Oct 2026. Hair & Beauty landing went from 17.8 to
11.1 phone screens and 13 to 0 sub-24 px targets with three added files and no content
removed. The shell it produced is `library/skills/02-web-build/mobile-app-shell/reference/shell/`.

## Before you start (the human, once per machine)

1. `git clone` (or `pull`) Convenium.Design; `python library/tools/verify.py` must pass.
2. Write `fleet.json` from the template at the bottom into the folder you will run from
   (an agency repo's `docs/mobile-fleet/` is the convention). Local paths, live URLs, nothing else.
3. Open Claude Code from a folder that contains every site, or add the others:
   `claude --add-dir <Convenium.Design> --add-dir <other site roots>`.
4. Paste the orchestrator block. Answer the four gates with one word each.

## Orchestrator block (paste as the first message)

> Read Convenium.Design's `ARCHITECTURE-ESSENTIALS.md`, `AGENTS.md` (the activation protocol
> and the model rule in particular) and `templates/prompts/mobile-fleet-pass.md` completely.
> Read `<path>/fleet.json`. Act as the Convenium.Design Design Director running the
> **mobile fleet pass** on the abridged trail: direction is fixed per site, `gate_a`/`gate_b`
> are approved-in-plan. Sites marked `skip` are out of scope.
>
> You are the orchestrator. You do not edit site code. Plan first, in writing, before any
> agent exists: `00-run-plan.md` next to `fleet.json` names each phase, which agent it
> activates, the one skill body that agent may load, and its output contract. Agents not in
> that plan do not run. Then:
>
> **Phase 0 — measure.** One read-only agent (`visual-analyst`, model tier *reader*) runs
> `reference/shell/measure.mjs --all` on every route of every site, fills `fleet.json`
> (`stack`, `routes`, `build`, `baseline`) and writes `01-audit.md`: a table of numbers per
> site. Stop at **Gate 0**: I confirm the reference site and the budgets.
>
> **Phase 1 — shell.** One agent (`design-engineer`, tier *builder*) ports
> `reference/shell/` onto the reference site, or extracts the reference site's own shell
> into that shape if it already has one. Output: the kit in `<run folder>/shell/` with
> `PORTING.md` adjusted to this fleet's tokens. Stop at **Gate 1**: I open it on a phone.
>
> **Phase 2 — per-site, parallel.** Dispatch one `design-engineer` agent per site per wave
> (`superpowers-dispatching-parallel-agents`, each in its own git worktree, branch
> `mobile-pass`) with the per-site brief below and nothing else from this conversation.
> Each agent loads the `mobile-app-shell` skill body **only**. Collect every
> `.olympus/07-qa.md` into `02-results.md`; sites still over budget are listed with the
> reason, never hidden. Stop at **Gate 2**.
>
> **Phase 3 — finish review.** One fresh `independent-critic` (tier *planner*) that built
> nothing scores every site against the reference with `visual-qa`; writes
> `03-finish-review.md`. **Gate C**: I say `deploy <site>` per site; nothing is merged to
> main or pushed before that word.
>
> Numbers, never impressions. Anything not verified on a real device is "not verified".
> Respect the loop bounds in `AGENTS.md`.

## Per-site brief (the orchestrator fills the brackets and passes it verbatim)

> Site: `<name>` at `<path>` (live `<url>`). Worktree on branch `mobile-pass`. Read the
> site's own `CLAUDE.md`/`AGENTS.md`/`DESIGN.md` if present; if `.olympus/APOLLO.md` is
> missing run `python <Convenium.Design>/library/tools/apollo.py attach <path>`. Load the
> `mobile-app-shell` skill body and no other. Port `<run folder>/shell/` per its
> `PORTING.md`; do not redesign it.
>
> Goal at 390×844: home ≤ `<budget>` screens, other routes ≤ 8, tab bar with one primary
> action (`<book/call/whatsapp/inquiry>`), 0 targets under 24 px, inputs 16 px, no overflow
> from 320 px, reveals play once, reduced motion leaves the h1 visible. Cut length by layout
> first (merge → rail → `<details>` → show-all → density), content last, and log every cut.
> Keep the site's signature moment; if the budget is impossible without it, report the gap.
>
> Encode the budgets as a test with `measure.mjs`. Run the site's own build and QA, then
> `measure.mjs --all` on every route, and check desktop at 1280 is unchanged. Write
> `.olympus/07-qa.md` with a before/after table from `fleet.json`'s baseline. Do not commit
> to main, do not push, do not touch anything the project marks frozen, do not spend paid
> media credits.

## `fleet.json` template

```json
{
  "reference": { "shell": "<site id>", "film": "<site id or null>" },
  "budgets": { "home_screens": 10, "home_screens_with_film": 16, "other_route_screens": 8,
               "under24_targets": 0, "small_inputs": 0, "overflow_x": false, "tab_bar": true },
  "sites": [
    { "id": "<kebab>", "name": "<Name>", "url": "https://…/", "path": "<absolute local path>",
      "role": "reference | fix | shell only | skip", "wave": 1,
      "stack": "", "routes": [], "build": "", "baseline": {} }
  ]
}
```

Waves: 1 = worst length, 2 = client and scroll-film sites, 3 = shell-only sites and any
template other sites are generated from (fix the template, not its children).
