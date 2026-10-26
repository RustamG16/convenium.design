# Product

<!-- impeccable:product-schema 1 -->

Durable product truth for the Convenium.Design build of the Rustam universe site. Director-resolved
from `PROMPT.md` (explicit creative freedom), `PROFILE.md` v1.0 and `assets/manifest.json`;
no interview was held because the brief cancels it.

## Platform

web

## Stack

delegated: static HTML, CSS and vanilla JavaScript, no bundler, no build step. GSAP 3 and
ScrollTrigger are self-hosted in `assets/vendor/` (already supplied); Bodoni Moda and
Instrument Sans are self-hosted in `assets/fonts/` (SIL OFL 1.1). The deploy target is GitHub
Pages at a subpath, so every reference is relative and the folder is copied as-is by
`scripts/build-pages.sh`.

## Users

- **The inhabitant** — Rustam Gurbanov, the person `PROFILE.md` describes, reading his own
  universe on a laptop or a phone, usually late, usually alone. The profile addresses him as
  "you" and the site keeps that address.
- **The few he chooses to show it to** — collaborators (the profile names Marcel and Sammy),
  friends, a supervisor. They should be able to name the six paths after one pass.

## Product Purpose

The entrance page to "The Rustam Codex", the private, gamified personal universe that
`PROFILE.md` §9–10 proposes: an evolving map of identity, mastery, creation and contribution.
It is a cinematic single page, not an app. Success is observable: a visitor scrolls to the
closing line, and can name the six paths and the five campaigns afterwards.

## Positioning

One person's universe, built from his own stated facts and his own commissioned imagery
(a stone-and-brass observatory world under a red moon). No neighbouring site can truthfully
copy it because its content is a single life and its media is a single commissioned set.

## Operating Context

- Viewed at desktop 1440 and mobile 390 first; everything between must hold.
- Media is served from Higgsfield's CDN by absolute URL (this build container cannot
  download it); the page must survive media that is slow or missing, so layout never
  depends on an image having loaded.
- Published at `https://rustamg16.github.io/Convenium.Design/convenium/`.

## Capabilities and Constraints

- One route: `/`. Primary action: scroll the whole page to the oath. Secondary action: light
  the quests on the illustrative board.
- The quest board is a prototype and says so on screen: "illustrative; XP values are design
  placeholders, not measurements of personal worth" (the profile's own wording).
- Copy is limited to `[F]` facts and the profile's own proposals. `[I]` inferences are
  quoted as interpretations. `[U]` unknowns are not filled in. No metrics, testimonials,
  clients, dates of completion or progress figures are invented.
- Required, not optional: `prefers-reduced-motion` ends every animation at its final state
  and swaps video for its poster; keyboard reach to every control; headings in order; body
  contrast ≥ 4.5:1.
- Autoplaying video is muted, loops, and is decorative (`aria-hidden`).

## Brand Commitments

- Name: **The Rustam Codex** (the profile's own name for the concept). Short form: The Codex.
- Mark: `images/sigil-tree-dragons-moon.png` — tree of life, two dragons, crescent moon (his
  stated personal motifs). The subject is real; the universe is a proposal and the page says
  "proposed" where the profile does.
- Binding direction from the brief: cinematic, motion, atmosphere, strong typography, dark
  and elegant, nothing generic. Binding from the profile: ancient × futuristic, symbolic
  geometry, dark or elegant compositions, dislike of results that look generic or obviously
  AI-generated.
- Media world: the observatory set (stone, aged brass, one controlled luminous accent, one
  red moon). The Cyberpunk Athens and cherry-red launch-film sets are a different world and
  are excluded.

## Evidence on Hand

- `PROFILE.md` v1.0 (October 2026): facts, inferences, unknowns, the six paths, the quest
  board, the progression framework.
- `assets/manifest.json`: 67 media entries with URL, type, aspect and generating prompt.
  21 are used; the rest are excluded with reasons in `.olympus/05-asset-manifest.md`.
- Absent, and not to be fabricated: a photograph of the inhabitant, analytics, any live
  tracker data, thesis progress, client names, revenue.

## Product Principles

1. **His words or none.** Every sentence traces to the profile.
2. **The media is the argument.** One world, used at full strength; type crosses it only
   with a scrim that belongs to the type.
3. **One hero moment, then reading.** Motion carries meaning (paths handing off to each
   other); everything else is state feedback.
4. **Honest about what is proposed.** The board is illustrative and labelled; interpretations
   are marked as such.
5. **Rest is protected.** The page ends on the profile's own rule that rest, health and
   relationships are not sacrificed for XP.

## Accessibility & Inclusion

Reduced-motion end state identical in content to the animated one; focus visible on every
control over dark and over imagery; no information carried by colour alone; video never
carries meaning.
