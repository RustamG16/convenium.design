# HANDOFF — /contact-v2 · "The Call Panel"

## Context

Apollo's first real job: design a new `/contact-v2` page for Convenium Studio,
locked to the existing palette and type stack, otherwise free. You implement from
this document with Claude Code.

The existing `/contact` is competent and generic — three stacked sections, cotton
→ cotton → noir, a conventional left-info / right-form split. Its real gap is
conceptual: **the site's organizing metaphor is the elevator, and the contact page
is the one screen where a visitor is literally at a threshold deciding whether to
step in — and it doesn't use that at all.** That gap is what v2 exploits.

Two alternatives were designed and rejected. *Threshold* (split cotton/noir panels
parting at a cherry seam) reads well at 1920 but the metaphor dies at 375, where
contact forms are most used. *Floor Directory* (numbered hairline board + inset
form) is the safe option and structurally closest to the page that already exists,
so it differentiates least.

**Content is not locked** — but every string below is specified, and the existing
`content/contact.ts` values are reused verbatim rather than rewritten.

---

## The design

A single full-bleed noir field. The form is an elevator call panel: six numbered
rows that light cherry as they complete. Submitting runs the sequence floor by
floor, the panel dims, and **GOING UP.** lands — the same statement the homepage
uses when the doors close.

**Signature moment:** the panel lighting row by row on submit, resolving to
GOING UP. One bold thing; everything else stays quiet.

Numbering is used because the content genuinely is a sequence — six floors, in
order, with a completion state. It is not decoration.

### Composition at 1920 (primary target)

The panel is 640px. The remaining width is used deliberately, not left empty:

```
+----------------------------------------------------------------------+
|  [noir #1b1717 · grain overlay from interior layout]                  |
|                                                                       |
|   |  CURRENTLY BOOKING PROJECTS STARTING Q4 2026                      |
|   |                                                                   |
|   C   ALL PROGRESS STARTS                            C O N V E N I U M|
|   A   WITH A CONVERSATION.                          (ghost wordmark,  |
|   L   Archivo Black 88px / 0.9 / cotton              --color-wordmark,|
|   L                                                  aria-hidden,     |
|   |   +--------------------------------------+      parallax 0.3)    |
|   P   | 01  NAME                             |                       |
|   A   | ____________________________________ |<- hairline fills      |
|   N   | 02  EMAIL                            |   cherry, left to     |
|   E   | ____________________________________ |   right, on focus     |
|   L   | 03  COMPANY            OPTIONAL      |                       |
|   |   | ____________________________________ |                       |
|   |   | 04  PROJECT TYPE              [ v ]  |                       |
|   |   | ____________________________________ |                       |
|   |   | 05  BUDGET             OPTIONAL [v]  |                       |
|   |   | ____________________________________ |                       |
|   |   | 06  MESSAGE                          |                       |
|   |   | ____________________________________ |                       |
|   |   |                                      |                       |
|   |   | [ ] I agree to be contacted...       |                       |
|   |   |                                      |                       |
|   |   |    [    CALL THE LIFT    ]           |                       |
|   |   +--------------------------------------+                       |
|                                                                       |
|   ------------------------------------------------------------------  |
|   RESPONSE TIME              |  PROJECT FIT                           |
|   We reply within two...     |  Convenium is the right fit for...     |
+----------------------------------------------------------------------+
```

Left rail: the word `CALL PANEL` set vertically (`writing-mode: vertical-rl`) in
Inter 12px uppercase, `--color-gray-on-noir`, beside a 1px cherry rule running the
panel's height. Right: the ghosted wordmark. Both are decorative and
`aria-hidden`.

---

## Files

Follows the `about-v2` precedent exactly — a named concept in its own folder.

| path | what |
|---|---|
| `app/(interior)/contact-v2/page.tsx` | route + metadata, renders the scene |
| `components/sections/contact-v2/call-panel/CallPanelScene.tsx` | layout shell, rails, wordmark, footer band |
| `components/sections/contact-v2/call-panel/CallPanelForm.tsx` | `"use client"` — the six rows |
| `components/sections/contact-v2/call-panel/callPanel.ts` | row definitions and copy |
| `components/sections/contact-v2/call-panel/*.module.css` | one module per component |

**Reuse, do not rebuild:**

- `components/chrome/HeaderZone` — wrap the scene in `<HeaderZone theme="dark">`.
  This is what inverts the site header; without it the header renders wrong.
- `content/contact.ts` — `projectTypes`, `budgetRanges`, `availability`,
  `responseStatement`, `fitStatement`. All used verbatim.
- `content/site.ts` — `site.email`.
- `app/(interior)/layout.tsx` already mounts `SmoothScroll` (Lenis), `Grain`,
  `Cursor`, `InteriorReveals`. Do not mount them again.
- `components/sections/contact/ContactForm.tsx` — copy the validation shape,
  `useId` pattern, error wiring, and the client-only 600ms pending → success
  behaviour. **Do not import it**; the field rendering is entirely different.
- Utility classes `wrap` and `eyebrow` from `styles/globals.css`.

**No new tokens, no new dependencies.**

---

## Tokens

All from `styles/tokens.css`. Ratios computed, not estimated.

| role | token | value | on | ratio |
|---|---|---|---|---|
| page ground | `--color-noir` | `#1b1717` | — | — |
| display + input text | `--color-cotton` | `#edebdd` | noir | **14.84:1** |
| labels, numbers, eyebrows | `--color-gray-on-noir` | `#a8a29a` | noir | **7.02:1** |
| active row number, errors | `--color-accent-on-noir` | `#e5595c` | noir | **5.01:1** |
| hairline fill, focus ring, rules | `--color-accent-graphic` | `#d73b3e` | noir | **3.88:1** |
| submit fill | `--color-accent` | `#810100` | cotton text | **9.05:1** |
| submit hover fill | `--color-accent-deep` | `#630000` | cotton text | **11.45:1** |
| ghost wordmark | `--color-wordmark` | `#2a2424` | noir | 1.16:1 — decorative |

Three rules that are load-bearing:

1. **`--color-accent-graphic` (chili) is never text below 24px.** It passes 3:1 as
   a graphic and fails 4.5:1 as body text. Hairlines, rules, and focus rings only.
   For any accent *text* on noir use `--color-accent-on-noir`.
2. **The ghost wordmark carries no information.** At 1.16:1 it is texture. It must
   be `aria-hidden="true"` and must never be the only place a word appears.
3. **`chili` on cotton is 3.82:1 and also fails** — noted because `tokens.css`
   documents chili's limits on noir but is silent about cotton. Not used here;
   flagged for whoever owns that file.

Type — all existing scale tokens:

| element | family | size | treatment |
|---|---|---|---|
| H1 | `--font-family-display` | `--font-hero` (88px @1920) | uppercase, `line-height: 0.9`, `text-wrap: balance`, 3 lines |
| row number | `--font-family-ui` | `--font-label` | uppercase, `letter-spacing: .08em`, tabular-nums |
| row label | `--font-family-ui` | `--font-label` | uppercase, `letter-spacing: .08em` |
| input / textarea / select | `--font-family-serif` | `--font-body` (22px) | matches existing form treatment |
| availability eyebrow | `--font-family-ui` | `--font-eyebrow` | uppercase, `.08em` |
| footer band copy | `--font-family-serif` | `--font-body` | — |
| GOING UP. | `--font-family-display` | `--font-manifesto` | uppercase |

Spacing uses `--space-1..7` and `--space-container` only. No raw pixel gaps.

---

## The six rows

From `content/contact.ts`. Field names and validation match the existing form so
the data shape is unchanged.

| # | field | required | control | error copy |
|---|---|---|---|---|
| 01 | name | yes | text, `autocomplete="name"` | Enter your name. |
| 02 | email | yes | email, `autocomplete="email"` | Enter a valid email address. |
| 03 | company | no | text, `autocomplete="organization"` | — |
| 04 | projectType | yes | select, `projectTypes` | Select a project type. |
| 05 | budget | no | select, `budgetRanges` | — |
| 06 | message | yes | textarea, 5 rows | Tell us a little about the project. |

Consent checkbox sits below row 06, outside the numbered sequence — it is a
condition, not a floor. Error: *Consent is required to send this inquiry.*

Optional fields carry a right-aligned `OPTIONAL` marker in
`--color-gray-on-noir`, not a parenthetical.

---

## Row states

Every row is a grid: `[number] [label] [control]` with a 1px baseline rule.
Minimum row height **56px** (exceeds the 44px touch target).

| state | number | baseline rule | control |
|---|---|---|---|
| default | `--color-gray-on-noir` | 1px `rgba(237,235,221,.14)` | cotton text, transparent field |
| hover | cotton | unchanged | cursor text |
| focus | `--color-accent-on-noir` | **2px chili, scaleX 0→1 from left, 260ms** | cotton text |
| filled + valid | `--color-accent-on-noir` | 1px chili, held | cotton text |
| error | `--color-accent-on-noir` | 2px chili | message below in `--color-accent-on-noir`, `--font-label` |
| disabled (during submit) | dimmed to 40% | unchanged | `pointer-events: none` |

The focus ring **is** the baseline rule thickening to 2px chili — 3.88:1 against
noir, which passes 1.4.11. Do not add a browser default outline on top; do not
remove focus visibility. Use `:focus-visible`.

Submit button: cotton on cherry, min-height 48px, `--radius-control`, label
`CALL THE LIFT` in Inter uppercase `.08em`. Hover → maroon. Pending → `CALLING…`,
`aria-busy="true"`, disabled.

---

## Responsive

| width | layout |
|---|---|
| **2560** | container caps at 1600px; panel stays 640px; rails move outward, wordmark scales with viewport |
| **1920** | primary. Panel 640px centred; left rail 200px; ghost wordmark visible |
| **1440** | panel 600px; left rail narrows to 120px; wordmark clipped at the right edge |
| **1024** | ghost wordmark hidden; left rail becomes a horizontal strip above the H1; panel 560px |
| **768** | panel fills `wrap` width; number and label share one line above the control |
| **375** | single column; row height ≥64px; H1 drops to the `--font-hero` clamp minimum (48px); footer band stacks |

1920 is specified, not extrapolated from 1440 — the rails and wordmark exist
*because* of the space at that width. At 1024 and below they are removed rather
than shrunk.

---

## Motion — GSAP, described not implemented

You implement this. Use `useGSAP` scoped to a ref so triggers tear down on unmount.
Lenis is already running from the interior layout — do not initialise it again.

| moment | effect | duration | easing |
|---|---|---|---|
| page enter | rows stagger `y: 16 → 0`, `opacity: 0 → 1` | 420ms, 60ms stagger | `--ease-out-sharp` |
| field focus | baseline rule `scaleX: 0 → 1`, origin left | 260ms | `--ease-out-sharp` |
| field valid | number colour → `--color-accent-on-noir` | 180ms | linear |
| submit | six rules light in sequence, then panel `opacity → 0.15` | 80ms stagger, 300ms fade | `--ease-out-sharp` |
| GOING UP. | scales `0.92 → 1` with `opacity 0 → 1` after the sequence | 420ms | `--ease-out-sharp` |
| scroll | ghost wordmark `translateY` at 0.3 rate via ScrollTrigger | scrubbed | — |

**`prefers-reduced-motion: reduce`:** rows are visible immediately with no
stagger; the baseline rule changes colour without scaling; submit goes straight to
the success state with no sequence; the wordmark does not parallax. The page must
be complete and calm, not broken — verify by toggling the OS setting, not by
reading the CSS.

---

## Edge cases

- **Long strings** — a 60-character company name must not overflow the control;
  `text-overflow: clip`, field scrolls horizontally.
- **Message at 2000 characters** — textarea scrolls internally, panel height fixed.
- **All errors at once** — six error messages must not push the submit button
  below the fold at 375. Reserve the space or scroll to the first error.
- **Success state** — replaces the panel in place; must be focusable and announced
  (`role="status"`). Reuse the existing copy: *Inquiry received.* / *Thank you,
  {firstName}. We read every inquiry personally and reply within two business days.*
- **JS disabled** — the form is client-only, same as the existing page. Acceptable
  parity; the mailto link in the footer band is the fallback and must be present.

---

## Build sequence

Each step is independently verifiable. Do them in order — structure before motion,
so a broken animation never hides a broken layout.

**1 — Route and shell**
Create the route and a `CallPanelScene` rendering only the noir ground and H1.
*Done when:* `/contact-v2` returns 200, the site header renders in dark theme
(proving `HeaderZone theme="dark"` is wired), and the H1 is Archivo Black 88px
uppercase at 1920 with `line-height: 0.9`, on three lines.

**2 — Panel structure, static**
Six rows as a grid, no styling beyond layout. Real controls, real content from
`content/contact.ts`.
*Done when:* all six rows render with correct labels and options; every row is
≥56px; tab order runs 01→06→consent→submit with no traps.

**3 — Row states**
Default / hover / focus / filled / error, per the table above.
*Done when:* focus is visible on every control with `:focus-visible`; the focus
rule computes to chili `#d73b3e`; no default outline is doubled or removed.

**4 — Validation**
Port the logic from `ContactForm.tsx`. Client-only, 600ms pending, success state.
*Done when:* submitting empty shows all five errors; a valid submit reaches the
success state; `aria-invalid` and `aria-describedby` are set on every errored
control.

**5 — Rails, wordmark, footer band**
Left vertical rail, ghost wordmark, two-column reassurance band.
*Done when:* both decorative elements are `aria-hidden="true"`; the band uses
`responseStatement` and `fitStatement` verbatim; `hello@convenium.studio` is a
live `mailto:`.

**6 — Responsive**
Work down from 1920 through 375.
*Done when:* nothing overflows horizontally at any of the six widths; the
wordmark and rail are *absent* below 1024, not shrunk; at 375 the H1 is 48px and
rows are ≥64px.

**7 — Motion**
The GSAP timeline, last.
*Done when:* the submit sequence runs floor by floor and lands on GOING UP.; no
ScrollTrigger or listener survives unmount (navigate away and back, check the
console); with reduced motion on, the page is complete and static.

**8 — Verify**
*Done when:* `npm run lint` and `npm run build` both pass; no console errors at
any width; keyboard-only completion of the whole form is possible; every contrast
pair in the token table measures as stated.

---

## Out of scope

- Touching `/contact`. It stays exactly as it is; this is a parallel route.
- A backend. The form stays client-only, matching current behaviour.
- Changing `tokens.css`, adding fonts, or adding dependencies.
- Nav or sitemap entries for `/contact-v2` — it is unlisted, like `about-v2`.

## Open questions

**None.** If you hit one while building, it is a defect in this document — tell me
what it was.

---

