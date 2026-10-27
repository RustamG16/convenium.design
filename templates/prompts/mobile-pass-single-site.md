# Prompt — mobile pass, one site (paste-ready)

Universal retrofit: bring one built site's phone experience (360–430 px) up to the current
standards floor without changing its direction. Works on any stack (static HTML, Vite/React,
Next, a generated template). Fill the three `<…>` fields, open Claude Code **inside the site
folder** with Convenium.Design visible (`claude --add-dir <Convenium.Design>`), paste the block.

Fields: `<CD>` = absolute path of Convenium.Design on this machine · `<SITE>` = absolute path of
the site folder · `<URL>` = the live URL (or `http://localhost:…` after the site's dev server).

---

> Read `<CD>/ARCHITECTURE-ESSENTIALS.md`, `<CD>/AGENTS.md` and
> `<CD>/library/skills/02-web-build/mobile-app-shell/SKILL.md` completely. Then this site's own
> `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` and `README.md` where they exist. You are the
> Convenium.Design Design Director (main session) running the **single-site mobile pass** for
> `<SITE>` (live: `<URL>`) on the abridged trail: direction, palette and the committed type ramp
> are fixed; `gate_a`/`gate_b` are approved-in-plan. No intake round. No new concepts. The only
> skill body in this run is `mobile-app-shell`, plus `visual-qa` for the finish review.
>
> **Goal.** The phone journey becomes app-grade: a thumb-zone tab bar with one primary action,
> no page longer than it needs to be, no section floating in empty space, every control
> tappable, nothing that stutters. Desktop stays byte-for-byte the same in behaviour.
>
> **0. Run plan.** Create `.olympus/` if missing (`python <CD>/library/tools/apollo.py attach
> <SITE>` if `.olympus/APOLLO.md` is absent). Write `.olympus/00-run-plan.md` from
> `<CD>/templates/00-run-plan.md` with exactly these phases — measure (fleet-measurer, skill
> `mobile-app-shell`), build (design-engineer, skill `mobile-app-shell`), review
> (independent-critic, skill `visual-qa`) — and check it:
> `python <CD>/library/tools/verify.py --plan .olympus/00-run-plan.md`. Copy
> `<CD>/templates/run.json` to `.olympus/run.json`. Work on a branch `mobile-pass`; never
> commit to main, never push.
>
> **1. Measure before touching anything.** Find every route (sitemap, nav, `app/` or
> `pages/`, locale folders like `en/`). Run
> `node <CD>/library/skills/02-web-build/mobile-app-shell/reference/shell/measure.mjs --all <every route URL>`
> (install Playwright locally first if needed: `npm i -D playwright && npx playwright install
> chromium`). Also take a 390×844 full-page screenshot per route and list each section's
> height in screens. Write `.olympus/01-audit.md`: one table — route × {screens, overflowX,
> targets < 24 px, inputs < 16 px, tab bar y/n, body font}, plus the per-section heights of
> the home route. Numbers only; no opinions in this file.
>
> **2. Budgets.** Home ≤ 10 screens at 390×844 (≤ 16 only if the home carries a scroll film),
> every other route ≤ 8, 0 targets under 24 px, inputs ≥ 16 px, no horizontal overflow from
> 320 px, tab bar present, reduced motion leaves the h1 at computed opacity ≥ 0.95. Write
> them into `.olympus/06-build-plan.md` together with the treatment per over-budget section,
> chosen in this order and never the reverse: **merge** (a heading + one paragraph joins its
> neighbour) → **rail** (card lists become a horizontal snap rail, next card peeking) →
> **fold** (tables, price lists, FAQs, extras, hours become `<details>`, first open) →
> **show-all** (grids beyond ~8 items) → **density** (section padding ≤ 48 px, headings
> `clamp()`ed, decorative spacers and decorative full-screen media removed on phones) →
> only then **content**, each cut logged. Never remove the page's one signature moment; if
> the budget is impossible without it, the plan says so. Show me the plan and stop. **Gate 1.**
>
> **3. Build, from the kit.** Port
> `<CD>/library/skills/02-web-build/mobile-app-shell/reference/shell/` per its `PORTING.md`:
> `mobile.css` linked after the site's CSS, `mobile.js`, `tab-bar.html` before `</body>` with
> 4–5 cells (`data-tab` = section ids, last cell = the primary action: book / call / WhatsApp
> / inquiry), `viewport-fit=cover`, `<details class="m-fold" open>` on the folds, `m-rail` on
> the rails, `m-hide-phone` on decorative media. Map the kit's `:root` tokens to this site's
> own custom properties — never hardcode a colour. Hide the header CTA on phones (it moved to
> the tab bar). Same treatment for every locale copy (`en/index.html` etc.). For React/Next the
> tab bar is a component in the root layout and `mobile.js` logic goes in an effect; for a
> generated template fix `template/`, not the children. Do not touch the site's existing
> stylesheet, motion engine or anything it marks frozen; this layer is additive. No new
> dependencies without asking. No paid media generation.
>
> **4. Verify, in numbers.** Re-run `measure.mjs --all` on every route; check desktop at 1280
> renders unchanged (tab bar `display: none`, folds open, summaries hidden); run the site's
> own build, lint and QA scripts; check reduced motion and the keyboard path through the tab
> bar. Encode the budgets as a test in the site's QA (`qa/mobile.test.mjs` or the stack's
> equivalent) so they cannot regress silently. Write `.olympus/07-qa.md` (before/after table
> per route, every cut, the remaining gap with its reason) and `.olympus/07-qa.json` from
> `<CD>/templates/07-qa.json`. Hand the finish review to a fresh `independent-critic` that
> loads `visual-qa` only and scores against the budgets, not against taste; it writes
> `.olympus/10-finish-review.md` with PASS / PASS WITH NOTES / FAIL. Apply the loop bounds in
> `<CD>/AGENTS.md`: at most two fix/review cycles, then the remaining defects come to me.
> **Gate C**: show me the before/after table and the screenshots; I test on a real phone and
> say `deploy`. Only then merge `mobile-pass` into main. Anything you could not verify on a
> device is reported as "not verified", never as done.

---

**After `deploy`:** `git checkout main && git merge --ff-only mobile-pass && git push origin main`
from your own terminal (the agent never pushes). GitHub Pages / Netlify redeploys on the push.

**Worked example** (Hair & Beauty landing, Oct 2026): 17.8 → 11.1 screens, 13 → 0 small targets,
three files added, no content removed, desktop unchanged. The 1.1-screen gap was reported, not
hidden; the remaining cuts were content and therefore the owner's call.
