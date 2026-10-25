# Prompt — app-grade mobile pass (reusable)

For any client website whose phone experience must hold up as the primary one: hospitality,
editorial, product launch. Paste the block below into a session opened on the project, with Apollo
attached (`python library/tools/apollo.py attach <PROJECT>`). Replace the angle-bracket fields.

It assumes the direction is settled (abridged trail). This is an engineering and finish pass,
not a redesign. For an open brief, run the normal kickoff from `USAGE.md` first.

**Worked example:** The Meridian (`lab/003-meridian-mvp`, Oct 2026). Home went from 25.6 to 15.9
phone screens. Phone heroes went from about 1.1 to about 2 source pixels per CSS pixel. A fast
first scroll on 4G went from 12 frames behind to 0. Its `.olympus/07-qa.md` cycle 2 has the
before/after table.

---

> Read Apollo's `ARCHITECTURE-ESSENTIALS.md`, `AGENTS.md` and `START-HERE.md` completely before
> acting, then the project's own `CLAUDE.md`/`AGENTS.md` and context documents. Act as the Apollo
> Design Director for `<BUSINESS / PROJECT>` on the **abridged trail**: the direction is fixed
> (`<where the design system lives>`), so `00-brief.md` records it as director-resolved, and
> `gate_a` / `gate_b` are `approved-in-plan`.
>
> Goal: make the phone journey (360–430 px wide) app-grade without changing the direction. That
> means sharp media on 3x screens, no page longer than it needs to be, and no scroll animation
> that freezes or lags.
>
> 1. **Audit** with `ux-evidence-audit`, then `mobile-app-shell` §6 as the measurement list (its §0
>    snippet is the quick per-route read). Record numbers, not
>    impressions, in `01-audit.md`, at 360x780, 390x844 and 430x932 plus an iPhone WebKit pass:
>    - page length in screens, per route, with lazy images forced to load
>    - source pixels per CSS pixel for every visible image, using the real file's pixels (not
>      `naturalWidth`, which `srcset` scales) and accounting for `object-fit: cover`
>    - scroll-film frame lag on 4G (9 Mbps / 150 ms), served with the production Cache-Control
>    - frame timing and long tasks on a 4x-throttled phone, scrolling every route
>    - reduced motion checked by computed opacity
>    - safe areas in portrait and landscape (CDP `Emulation.setSafeAreaInsetsOverride`)
>    - which effects run per scroll frame: `backdrop-filter`, fixed full-viewport overlays,
>      blurred canvases, scrubbed parallax and reveals
> 2. **Plan** in `06-build-plan.md`, using `mobile-app-shell` for the rules:
>    - screen budgets: home ≤ 16, other routes ≤ 12 at 390x844
>    - for scroll films: ~3-screen phone runways and phone frame sets at about half the frames,
>      cut from the best master, checked against the resolution ceiling (height × 9/16)
>    - full-height phone crops from originals for cover-cropped photographs
>    - snap rails and phone-only disclosures before cutting content
>    - play-once reveals, and no blur, grain or parallax on phones
>    - the 2026 standards floor (`mobile-app-shell` §5): clamp() type between the committed ramp
>      numbers, container queries for shared components, 100svh heroes / 100dvh stages, ≥ 44 px
>      primary targets (24 px hard floor), 16 px inputs, INP ≤ 200 ms, no overflow from 320 px
>
>    Bring the plan to the user before code.
> 3. **Build in slices.** After each slice, run the project's test gate on the production-like
>    artefact with nothing else using the CPU. Never touch engines the project marks frozen;
>    additive hooks, new asset sets alongside existing ones and overlay layout are fair game.
>    Encode every budget and measurement from step 1 as a test, so it cannot regress silently.
> 4. **QA** (`07-qa.md`) with a before/after table, then hand the **finish review** to a different
>    session, using `better-interface`, `visual-qa` and `mobile-app-shell`. The builder never writes
>    `10-finish-review.md`.
>
> Respect the loop bounds in `AGENTS.md`. Report anything you could not verify on a real device
> as not verified. Do not commit, push or deploy without the user's word.
