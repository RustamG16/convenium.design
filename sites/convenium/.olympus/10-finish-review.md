# 10 — Finish review

The second, **independent** pass over the implementation. Written by the `independent-critic`
specialist (read-only; award-rubric + visual-qa), not by the build author. Two rounds were run,
as the loop bound in `AGENTS.md` allows: round one on commit `27b3171`, the author's fix round,
then round two on commit `617be59`. Both reports are reproduced below as returned.

## Scope

- Route(s) reviewed: `/` (`sites/convenium/index.html`, `css/site.css`, `js/site.js`)
- Viewport(s): 1440×900, 390×844; reduced motion at 1440; round two also measured 1025, 1280, 1920
- Evidence read: `.olympus/evidence/*` (CDN blocked, placeholders), the author's Playwright
  measurements, `DESIGN.md`, `06-build-plan.md`, `00-brief.md`, `05-asset-manifest.md`,
  `assets/manifest.json`, `PROFILE.md` §1–2, 4–6, 8–10; round two re-rendered the committed
  files in its own headless Chromium
- Reviewer: independent-critic (award-rubric + visual-qa)
- Date: 2026-10-21

## Score — round two (final)

| Axis | Score | Note |
|---|---:|---|
| Design /40 | 34 | Hero ramp, scale, palette and media map exactly as committed; scrim now belongs to the copy block |
| Usability /30 | 25 | All text at or above AA; real buttons, live region, skip link, header focus halo, reduced motion honoured |
| Creativity /20 | 16 | One italic word over the observatory, the pinned six-path sequence, the brass event colour |
| Content /10 | 9 | Copy traceable; `[I]` lines attributed; quotes verbatim |
| **Total /100** | **84** | round one: 82 |

**Verdict:** PASS WITH NOTES

Delivery risk: low (static, ~58 KB own code, vendored GSAP, all 21 media ids resolve to the
manifest's approved files; the hot-linked CDN remains the recorded accepted risk).

## Against the committed design system (round one table, drift column updated after the fixes)

| Token / rule | Committed | Built | Drift |
|---|---|---|---|
| Hero size | 16vw ±0.5 at 1440; 24vw+0.25rem at 390 | 234.4px = 16.28vw; 97.6px | none |
| Display | 96px at 1440 | 96px | none |
| Path names | 115px | 115px | none |
| Body | 18px, 1.55 | 18px, 1.55 | none |
| Fonts | Bodoni Moda + Instrument Sans only | 4 woff2, nothing else | none |
| Palette | 9 tokens | same 9 hex values; no off-palette colour | none |
| Moon colour | closing line only | `.oath-line` only | none |
| Brass | hero word, lit states, links, focus, counter | those only (Illustrative tag moved to figure-2) | none after fix |
| figure-3 | hairlines and decorative numerals, never text | only the aria-hidden path numeral | none after fix |
| Eyebrow label above heading | none | none | none |
| Gradient text / neon / HUD / icon card grid | none | none | none |
| Scrim | belongs to the copy block | feathered `::before` on each copy block | none after fix |
| Nav scrim | surface at 85% after 80px | 85% | none after fix |
| Quest hover | border lifts to brass | brass | none after fix |
| `will-change` | during the pin / hover only | only under `.is-hover` | none after fix |
| Media map | exactly the 21 named files | 21 unique ids, all map to A01–A21 | none |
| Reduced motion | no pin, posters, final state, instant XP | confirmed by capture and measurement | none |
| Section count | DESIGN.md said six | eight sections, seven h2 (doc corrected) | none after fix |

## Round one — defects as returned (commit 27b3171, score 82, PASS WITH NOTES)

| # | Severity | Defect | Expected vs actual |
|---|---|---|---|
| 1 | major | figure-3 `#6E675E` used for text (3.51:1 on ground, 3.28:1 on surface): `.quest-state` "Lit/Unlit", `.path-tree`, caption, counter, "/ 140 XP". | Expected figure-2 (7.49:1) or figure for all text; figure-3 for rules/numerals only. |
| 2 | major | Scrim section-wide: 64vh × 100vw on hero, both scenes, oath; on the companion scene the gradient darkened the seated figure on the left while the copy sat right. | Expected a gradient scoped to the copy block (DESIGN.md "Media"). |
| 3 | minor | `[I]` inference rendered as fact: "The knowledge system keeps five kinds of claim apart". | Expected "Read as:" attribution like every other `[I]` line. |
| 4 | minor | Paraphrase inside quotation marks (companion guard quote; board foot modal "should" dropped; "Verifiable milestones, nothing else." added; Path II "may be" dropped). | Expected verbatim inside quote marks; proposals kept as proposals. |
| 5 | minor | "Illustrative" tag set in brass inside the `<h2>`, so the heading read "Daily quest board Illustrative". | Expected label in figure-2, outside the heading. |
| 6 | minor | Quest marker centred on multi-line titles. | Expected marker aligned to the first line. |
| 7 | minor | Focus halo selectors never matched the fixed header. | Expected `.index :focus-visible` included. |
| 8 | minor | Quest hover border figure-3; nav scrim 92%; permanent `will-change` on six fixed frames. | Build plan: brass hover, 85%, `will-change` only while needed. |
| 9 | low | Cursor-following campaign frame (36vw) covered the next row's title. | Consider capping or offsetting the frame. |
| 10 | low | DESIGN.md "six sections" disagreed with the built seven h2. | Update the document. |

## Round two — verification of the fixes (commit 617be59, score 84, PASS WITH NOTES)

| # | Status | Evidence (reviewer's own render) |
|---|---|---|
| 1 | fixed | only figure-3 text is `.path-numeral` (aria-hidden); state, tree, caption, counter, XP suffix are figure-2 |
| 2 | fixed | `::before` scrim on `.hero-copy/.scene-copy/.oath-copy`, feathered mask; hero/order/companion/oath captures confirm |
| 3 | fixed | `<em>Read as:</em>` added, matches PROFILE.md `[I]` |
| 4 | fixed | guard quote verbatim; "should" restored; milestones unquoted; "may be" restored |
| 5 | fixed | tag is a sibling `<p class="label board-tag">`, figure-2 |
| 6 | fixed | flex title, marker `margin-top: calc(.525em - 5px)`; captures show marker on line 1 |
| 7 | fixed | `.index :focus-visible` halo measured on a nav link |
| 8 | fixed | brass inset on hover; nav 85%; `will-change` only under `.is-hover` |
| 9 | partially fixed | right-gutter anchor clean at 1440 (gap 70px) but overlapped copy by 109px at 1025 and by 1px at 1280 |
| 10 | fixed | DESIGN.md corrected |

Round-two new notes: **medium** — hover frame overlapped body copy between 1025 and ~1275px;
**low** — DESIGN.md still described the frame as 36vw / cursor-following and the campaign
measure as 62ch; **low** — the hover evidence capture was from an intermediate build.

## After round two (author, outside the review loop, verified by measurement only)

The three round-two notes were closed without a third review, because each is a one-line
change: the hover media query and its JS mirror were raised to `min-width: 1280px` (below that
the inline 3:2 thumbnail layout applies, measured gap frame-to-copy 112px at 1025 and 131px at
1279, `position: static`; at 1280 the fixed frame clears the copy by 1px, at 1440 by 70px, at
1920 by 374px; `scrollWidth` equals the viewport at every width); DESIGN.md now describes the
22vw right-gutter frame and the 38ch campaign measure; the hover capture was regenerated from
the committed code. The loop bound in `AGENTS.md` is respected: two cycles, no third review.

## What the author must not do with this document

The QA repair loop is closed. The one remaining judgement for the user is recorded in
`09-handoff.md`: media is hot-linked from Higgsfield's CDN at source resolution.
