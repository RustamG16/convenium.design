---
name: mobile-app-shell
description: Rebuild a site's phone experience when mobile pages are too long, unoptimized or below current standards. Owns per-page screen budgets, the 2026 standards floor (fluid type, container queries, svh/dvh, touch targets, INP), phone-sized scroll-scrub runways and frame sets, a thumb-zone tab bar, safe areas on all four sides, cheap phone motion, and the verification rules that catch what emulated tests miss. Use when asked to rebuild or optimize a site's mobile resolution, when a site must work as the primary phone experience (360–430 px wide), when scroll-driven video is soft or stutters on phones, or before sharing a concept most visitors will open on a phone.
---

# Mobile app shell

Most hospitality and editorial traffic arrives on a phone. Treat the 360–430 px band as the
primary layout, not a fallback, and judge it by numbers you can test.

This skill owns the phone-specific decisions. It points out for the rest:
the scrub pattern itself is `scroll-scrubbed-visual-sequence`; layout and safe-area rules are
`better-layout`; touch gestures are `gesture-patterns`; native conventions are
`mobile-ios-design` and `apple-design`; worked container-query and fluid-type patterns are in
`responsive-design` (unrouted — load its references only when needed); GSAP mechanics are the
`gsap-*` skills. A project's committed design system (palette, type, corners, shadows) always
overrides any example here.

## 0. Measure before touching anything

Run per route at 390×844 (plus one 320-wide pass for overflow), in the console or the
project's own QA scripts:

```js
(() => { const d = document.documentElement; return {
  screens: +(d.scrollHeight / innerHeight).toFixed(1),
  overflowX: d.scrollWidth > innerWidth,
  under24: [...document.querySelectorAll('a,button,input,select,[role=button]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24); }).length,
  smallInputs: [...document.querySelectorAll('input,select,textarea')]
    .filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length } })()
```

Route from the numbers: pages over budget → §1; soft or stuttering scrub media → §2; no app
shell → §3; janky motion → §4; everything else is the floor in §5. A dedicated retrofit pass
on an existing site runs from `templates/prompts/mobile-app-grade-pass.md` with §6 as its
measurement list.

## 1. Set a screen budget per page

Measure page height in phone screens at 390×844 (`scrollHeight / innerHeight`).

| Page | Budget |
|---|---|
| Home (carries the signature film) | ≤ 16 screens |
| Every other route | ≤ 12 screens |

Enforce it with a test, not by eye. When a page is over budget, change layout before cutting
content:

- Card lists → a horizontal snap rail (`scroll-snap-type: x mandatory`) with the next card
  peeking 16–32 px. Native scrolling, keyboard reachable, no JS carousel.
- Day-by-day schedules, spec tables, logs → native `<details>`, first item open.
- Grids of media → first ~12 items, then a "Show all N" button with `aria-expanded`.
- Two-month calendars → one month with previous/next on phones.

Never trim the page's one signature moment to meet a budget; report the gap instead.

## 2. Size scroll-scrubbed media for phones

Same story, shorter journey. Desktop runways do not transfer.

- **Runway:** about 3 screens per sequence on phones (hero ~300vh, secondary scrubs ~250vh).
  Engines that read the runway's `offsetHeight` need no code change — only CSS.
- **Frame set:** a separate phone set at about half the desktop frame count, sampled evenly so
  timing matches. Fewer frames over a shorter runway feels the same per swipe and downloads
  about half.
- **Resolution ceiling:** a 9:16 crop of a W×H master is at most `H × 9/16` px wide. Compute it
  before promising sharpness. Re-cut from the highest-resolution master you have (often the
  original video, not the exported desktop frames); if even that is soft, the fix is new
  portrait footage, which is an asset decision, not a code one.
- **Warm the cache cheaply:** prefetch the phone set at low priority after the first frame paints,
  back off while the engine has requests in flight, skip Save-Data and 2G. A cache warmer only
  works on a host that allows caching — check the production `Cache-Control`.
- **Reduced motion:** no canvas, no frame requests, one static frame, and the hero's own heading
  visible.

## 3. Build the app shell (≤ 767 px)

- **Tab bar** in the thumb zone: 4–5 cells, each ≥ 44×44 px, labels ≥ 11 px, one primary cell
  (the booking action) in the accent. Active tab marked with `aria-current="page"`. Hidden under
  full-screen overlays (menu drawer, gallery canvas); absent on pages that own a bottom dock.
- **Bottom-anchored overlays** (skip chips, fact labels, release copy) add the tab bar height.
- **Viewport:** `viewport-fit=cover`, then pad with `env(safe-area-inset-*)` on **all four sides**:
  top on the nav, bottom on the tab bar and docks, and left/right as
  `max(var(--margin), env(safe-area-inset-left))` so landscape phones keep text out of the notch.
- **Heights:** sticky stages at `100dvh`; runways stay in `vh` so scroll distance does not jump
  when the toolbar hides.
- **Forms:** inputs at 16 px (no iOS focus-zoom), controls ≥ 44 px.
- **Installable:** manifest with `start_url`/`scope` relative to the deployed base, 192/512/maskable
  icons, `apple-touch-icon`.

## 4. Keep phone motion cheap

Scroll-linked motion is the expensive kind; keep it for content that explains something.

- Text and element reveals **play once** on phones (`once: true` or
  `toggleActions: 'play none none none'`), not `scrub`.
- No parallax on `(pointer: coarse)`.
- No `backdrop-filter` blur over moving media; use a solid plate of the base colour at ~94 %.
- Blur on canvases in whole-pixel steps, written only on change, lower ceiling on phones.
- One smooth-scroll instance per page. Two instances fight for the same scroll.
- Target 60 fps on a mid-range Android phone, not a flagship.

## 5. Hold the 2026 standards floor

The norms a phone page is judged against now; each one is checkable, none is taste.

- **Fluid type:** every ramp step is `clamp(min, fluid, max)` between the committed `DESIGN.md`
  numbers; body ≥ 16 px. A heading that only changes size at breakpoints reads as a desktop
  site squeezed down.
- **Container queries** (`container-type: inline-size`) for any component that lives in more
  than one column width; viewport media queries only for the page scaffold. Safe in every
  evergreen browser since 2023.
- **Viewport units by job:** first-screen hero `100svh` (no jump while the URL bar is up),
  sticky stages `100dvh`, runways plain `vh` (§2).
- **Touch targets:** primary controls ≥ 44×44 px; nothing interactive under 24×24 px
  (WCAG 2.2 AA, 2.5.8) unless it has 8 px clearance on all sides; inputs at 16 px (§3).
- **Responsiveness as a metric:** INP ≤ 200 ms on a mid-range Android phone — the Core Web
  Vital for interaction since March 2024; long tasks during scroll are what break it.
- **No horizontal overflow** at any width from 320 px up. Find the culprit with the §0
  snippet; fix with `min-width: 0` on flex/grid children and `max-width: 100%` on media,
  never with `overflow-x: hidden`.
- **Image sharpness:** `srcset`/`sizes` matched to the rendered slot; ≥ 2 source pixels per
  CSS pixel on hero media, computed from the delivered file, not `naturalWidth`.
- **Text wrapping:** `text-wrap: balance` on headings, `text-wrap: pretty` on short body
  blocks — free polish where supported, harmless where not.

## 6. Verify what emulation hides

Each of these has shipped a defect that a green test suite missed.

| Check | How | Why |
|---|---|---|
| Reduced motion | computed `opacity` of the h1 and above-the-fold copy ≥ 0.95 | Playwright's `toBeVisible()` ignores opacity |
| Live-scroll lag | 4 s pass on 4G emulation (9 Mbps / 150 ms), cold cache, sample `target − nearestLoaded` every frame: p95 ≤ 5, max ≤ 15 | "lag after settle" passes while a real flick freezes |
| Cache headers | serve the test build with the production `Cache-Control` | a `no-cache` preview server downloads every prefetched frame twice |
| Perf budget | long-task count judged on the median of 3 runs | one run is noise |
| Safe areas | emulate insets (CDP `Emulation.setSafeAreaInsetsOverride`), portrait and landscape | insets are 0 in plain emulation |
| Budget | screen count per route on every phone viewport | pages grow silently |

Device matrix: 360×780, 360×800, 375×667, 384×832, 390×844, 393×873, 414×896, 430×932,
plus one WebKit iPhone pass. Re-check pinned runways at 390 and 1920 after any runway change.

## 7. Fleet mode and the reference shell

`reference/shell/` is the shell built once and ported per site: `mobile.css` (one media-query
layer with a token map), `mobile.js` (tab state, phone-only `<details>` folds, overlay
awareness), `tab-bar.html`, `measure.mjs` (the §0/§6 numbers for a list of URLs) and
`PORTING.md` (the three HTML edits, per stack). Port it; do not redesign it per site.

Many sites at once run from `templates/prompts/mobile-fleet-pass.md` (`ss-mobile-fleet`):
measure all → Gate 0 → shell on the reference → Gate 1 → one agent per site per wave,
each loading this skill body only → Gate 2 → independent review → deploy per site on the
user's word. A single site runs from `mobile-app-grade-pass.md`.

## Before you finish

| Symptom | Fix |
|---|---|
| Phone page over budget | Rail, disclosure or "Show all" — layout first, content last |
| Desktop runway length on phones | Phone runway ~3 screens per sequence |
| Phone frames cropped from a smaller master than exists | Re-cut from the best master; state the ceiling |
| `env(safe-area-inset-*)` on top/bottom only | Add left/right with `max()` against the margin |
| `scrub` reveals on phones | Play-once reveals |
| Backdrop blur over video | Solid plate |
| Reduced-motion check uses `toBeVisible()` | Assert computed opacity |
| Test server sends `no-cache` | Serve with production cache headers |
| Tap target under 24×24 px | ≥ 44 px primary; 24 px hard floor with 8 px clearance |
| Hero at `100vh` jumps on load | `100svh` first screen; `100dvh` sticky stages |
| Fixed-px type that steps at breakpoints | `clamp()` between the committed ramp numbers |
| Viewport query styling a component inside a variable column | Container query |
