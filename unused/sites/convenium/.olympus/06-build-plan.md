# The Rustam Codex — The Codex, a private universe for one inhabitant

**This document is the design, not a task list.** Written before implementation, after
`00-brief.md` and `05-asset-manifest.md`, from the 21 approved assets (inspected as contact
sheets on 2026-10-21) and `PROFILE.md` v1.0. `DESIGN.md` beside the site carries the tokens
as numbers; this file carries the page.

## Outcome

A cinematic single page that is the entrance to the personal universe `PROFILE.md` proposes:
one inhabitant, six paths, five campaigns, a companion, an illustrative quest board and an
oath. It is for the inhabitant first (the page keeps the profile's "you") and for the few he
shows it to. The visitor should feel they have walked into a private observatory at night:
stone, brass, one red moon, and a single enormous italic word.

- **Primary action:** scroll the whole page to the oath.
- **Secondary action:** light quests on the board (illustrative, labelled as such).
- **Direction policy:** the brief grants explicit creative freedom; the intake was cancelled
  and one direction was resolved by the director (`00-brief.md`). No alternatives are
  produced. This is an acceptance criterion below.

## Creative system

- **Art direction:** a private observatory at night — weathered stone, aged brass, one
  controlled luminous accent, one red moon. It is *not* cyberpunk, *not* a HUD, *not* a
  dashboard, *not* a space-launch film, and *not* a "dark mode template" with purple glows.
- **Palette** (hex and role, see `DESIGN.md` for measured ratios):
  - `#0D0B10` ground — ambient, the whole page.
  - `#17131D` surface — board tiles, nav scrim when scrolled.
  - `#EDE6D8` figure — all type. `#A89F91` figure-2 — secondary, interpretations.
  - `#6E675E` figure-3 — hairlines and decorative numerals only.
  - `#D4A24C` brass — **the event colour**: the hero word, a lit quest, links, focus.
  - `#8A6A2F` brass-deep — rules at rest.
  - `#C2301C` moon — never a UI colour; inside the imagery, and the closing line.
- **Type:** Bodoni Moda italic for the mythic register (hero word, path names, campaign
  titles, pull quotes), Bodoni Moda roman for section displays, Instrument Sans for reading.
  **Hero = 16vw** (234px at 1440; doctrine `--display-max` 12–18vw, recorded in `run.json`),
  24vw under 640px. Scale 1.5 from 18px: 18 / 27 / 40 / 61 / 91 / 137.
- **Material:** matte near-black with a faint topographic relief only under the board
  (`textures/topographic-lines-01.png` at 14%); hairline rules in `line`; no radius, no
  shadow at rest; one glow in the whole page (the lit quest marker). Edges are hard.
  Depth comes from the pictures and from scale jumps, not from layering.
- **Composition:** a 12-column grid inside `clamp(20px, 5vw, 80px)` gutters. Reading
  columns are 5–6 of 12 and never centred; media bleeds or sits in the other half. Type
  crosses media only in the hero, the two video sections and the closing, always with the
  scrim under the type. The one rule: **every section has one picture and one idea.**

## Page sequence and media map

### 0. Index (fixed header) — 72px

- Assets: `images/sigil-tree-dragons-moon.png` (mark, 44px, `mix-blend-mode: screen` so the
  black stone square of the source disappears into the ground).
- Mark + wordmark "The Codex" left; five anchors right (Inhabitant · Paths · Campaigns ·
  Companion · Board · Oath → six, "Oath" included). Transparent over the hero; after 80px of
  scroll it gains a `surface` scrim at 85% with a bottom hairline. On ≤1024 the anchors
  collapse behind an "Index" disclosure button that opens a full-height list.
- Copy: the section names only.

### 1. Hero — 100vh, hands off over the next 100vh

- Assets: `images/observatory-app-08-wide.png` (full-bleed, `object-position: 50% 42%`).
- The poster fills the viewport. Bottom-left, inside the gutter, the h1: a small italic
  line "The Rustam" (headline size) set as the first line of the h1, then **Codex** at 16vw
  in brass. Below it, in figure, a 44ch lede: "An evolving map of identity, mastery, creation
  and contribution. The private universe of one inhabitant." Right-bottom, a label:
  "Klagenfurt · Version 1.0 · October 2026" (the profile's own version line). On load the
  word rises out of a clip and the poster settles from 1.06 to 1. On scroll the poster drifts
  up and the title lifts and fades (hero-handoff) into section 2.
- Copy intent: the name and the one-sentence definition of the universe, both verbatim from
  the profile's concept block. Nothing else.

### 2. The inhabitant — ~120vh

- Assets: `images/shadow-self-mirror.png` contained, 4:5 crop of its right half (figure and
  golden reflection), in columns 7–12; opens with `portrait-wipe`.
- Left column (1–6): the pull quote first, at display size in italic: "Which part of me
  wants this, and why?" — the question the profile says he keeps returning to. Then the
  facts in body: born 16 May 2000 in Baku, Azerbaijan, Tsakhur heritage with roots in the
  Caucasus; based in Klagenfurt, Austria; Azerbaijani, Russian, English, German, Turkish;
  bachelor's in Information Technologies and master's studies in Game Studies & Engineering
  at the University of Klagenfurt from 2021; digitalisation and quality-management
  engineering at Infineon Technologies, since left for independent business development.
  One interpretation, marked: "The profile reads this as a cultural identity that combines
  Caucasian heritage, European technical education, technological ambition and symbolism
  drawn from several civilisations."
- Copy intent: establish the person in facts; the one `[I]` line is attributed to the
  profile. No adjectives the profile did not use.

### 3. The six paths — 600vh pinned (desktop) / six 100vh blocks (mobile, reduced motion)

- Assets, in order:
  I Architect `images/observatory-app-05.png` (The Systems Forge);
  II Seeker `images/observatory-app-02.png` (The Underlying Order);
  III Creator `images/observatory-app-07.png` (The Dream Foundry);
  IV Builder `images/observatory-app-04.png` (Convenium);
  V Alchemist `images/observatory-app-03.png` (The Inner Observatory);
  VI Humanitarian `images/observatory-app-06.png` (The Aid Network).
- Section h2 "Six paths" sits above the pin. Inside the pin: a sticky 3:2 frame on the right
  (columns 7–12 on desktop, full width above the text on mobile) and a reading column on the
  left. For each path: a roman numeral in figure-3 (the sequence carries meaning: six
  complementary paths around one core), the path name at `path-name` size in italic, the
  world name from the asset prompt as a headline ("The Systems Forge"), the `[F]` fact as
  body, the `[I]` line as figure-2 prefixed "Read as:", and the skill-tree domains as a
  one-line list (e.g. "Systems design · architecture · automation · engineering").
  As the reader scrolls, each path's block scrolls through the column while the frame
  crossfades to the next image (`paths-pin`); a small "I — VI" counter under the frame ticks.
- Copy intent: the six paths exactly as the profile names them, each with its fact, its
  interpretation and its skill tree. The closing line of the section, body, figure-2: "These
  are proposed archetypal categories, not psychological diagnoses or fixed personality
  types." (profile).

### 4. The underlying order — 100vh video

- Assets: `videos/higgs-field-symbolic-12s.mp4` (muted loop, `aria-hidden`, pauses
  off-screen), poster `images/sacred-geometry-observatory.png`.
- Full-bleed video behind a left-aligned copy block with the scrim under the type. h2 "The
  underlying order". Lede: "An endless visual canvas connecting physics, consciousness, Jung,
  Theosophy, Kabbalah, world religions, myths and philosophical models." Body: the objective
  is comparison and synthesis, not collecting facts; specialised agents representing
  traditions that challenge or defend their perspectives. Then a five-item row set in
  headline italic, the profile's own epistemic distinction: scientific evidence / philosophical
  arguments / historical teachings / subjective experiences / symbolic analogies — with the
  line "Connections between fields can be valuable without implying that they prove one
  another."
- Below the video, on ground, a typographic list of the eight knowledge domains with the
  profile's prominence as weight: "Very prominent" domains in figure at headline size,
  "Prominent" in figure-2 at lede size. This is data from the profile, not decoration.
- Copy intent: the knowledge map and the epistemic rule, verbatim where possible.

### 5. Campaigns — ~140vh

- Assets (hover frames, 3:2, 36vw, follow the cursor on desktop; stacked thumbnails on
  touch): thesis `images/observatory-personal-universe-06.png`; Convenium
  `images/observatory-personal-universe-02.png`; Arkhetos
  `images/observatory-personal-universe-07.png`; technical mastery
  `images/observatory-personal-universe-04.png`; the knowledge map
  `images/astrolabe-notebook-knowledge-graph.png`; boss encounters
  `images/observatory-personal-universe-08.png`.
- h2 "Major campaigns" with the profile's framing as lede: main story "The Integrated Self"
  — "a life where intellectual curiosity, creativity, practical independence, relationships,
  wellbeing and commitment to others can coexist." Then five editorial rows (hairline above
  each, no cards): campaign title in Bodoni at display-minus-one (61px), one factual line in
  body: thesis — automated quality assurance of gamified tutorials in a quality-management web
  application using LLM-driven end-to-end testing and mutation testing; Playwright, Stryker;
  supervised by Martin Pinzger. Convenium — agency brand; websites, branding, marketing, AI
  automation, customer acquisition, field sales, process improvement; started in hair & beauty.
  Arkhetos / Caelum / Oracle — AI ecosystem centred on identity, self-exploration,
  companionship and intelligent connections; "not a generic chatbot". Technical mastery —
  become exceptional at full-stack development and immersive, animation-rich 3D web
  experiences. The knowledge map — see §4. A sixth row, smaller, "Boss encounters": thesis
  submission, first completed client deals, successful product launches, difficult
  negotiations, public releases.
- Copy intent: the five campaigns and the boss encounters as the profile lists them. No
  status, no progress, no dates of completion (the profile marks thesis progress `[U]`).

### 6. The companion — 100vh video

- Assets: `videos/companion-armillary-8s.mp4` (muted loop, `aria-hidden`), poster
  `images/ai-companion-violet-room.png`.
- Full-bleed video, copy block right-aligned this time (the seated figure is on the left of
  the frame; the words sit where the light-line companion is not). h2 "The companion". Body:
  identity kernel, adaptive AI companion, mythological onboarding, Jungian questions, the
  Nexus connection network, an Aid Network, an interconnected agent system — "a deeply
  personal experience that should not become a generic chatbot or shallow gamification
  product." Then the profile's own guard, as a pull quote: "Psychological development is not a
  supernatural rank. Evidence of progress is observable change in behaviour, reflection,
  relationships and decision-making."
- Copy intent: Arkhetos as the profile describes it, including its own refusal.

### 7. The board — ~120vh

- Assets: `textures/topographic-lines-01.png` as the section ground at 14% opacity.
- h2 "Daily quest board", with "Illustrative" beside it in a label and the sentence "An
  interactive example, not a saved or connected tracker. XP values are design placeholders,
  not measurements of personal worth." as the lede. The XP figure "0 / 140" at display size
  in brass (counts up as quests light), "0 / 6 quests" beside it. Six tiles in a 3×2 grid
  (2×3 on tablet, 1×6 on mobile), each a `<button aria-pressed>`: Deep Work +30 — one focused
  60–90-minute session; Knowledge Integration +20 — investigate one question and record
  evidence and competing explanations; Physical Foundation +15 — planned movement, nutrition
  or recovery; Creation +35 — a concrete project deliverable; Individuation Journal +15 —
  reflect on an emotional reaction, motivation or dream; Service +25 — one useful action that
  benefits someone else. A lit tile gets a brass border and a brass disc with the page's one
  glow; its marker text reads "Lit". A ghost "Reset sample quests" button. State in
  `localStorage` (try/catch).
- Copy intent: the quest board verbatim from the profile, and the profile's own caveat about
  rest: "Rest, health and relationships are protected rather than sacrificed for more XP."

### 8. The oath — 100vh closing

- Assets: `images/red-moon-alpine-lake.png` full-bleed (21:9, `object-position: 50% 60%`).
- The closing line, the phrase the profile records as his: **"If not now, then when."** set
  in Bodoni italic at display size in `moon` (the one time the colour is spoken). Under it, in
  figure: "The main story is the integrated self." Footer below on ground: the sigil, "The
  Rustam Codex · built from Profile v1.0, October 2026 · imagery commissioned by the
  inhabitant", and the six path names as plain anchors back to §3.
- Copy intent: his phrase, the profile's main-story line, provenance.

### Unused assets

Named with reasons in `05-asset-manifest.md`: the Cyberpunk Athens set, the cherry-red
space set, the alpine daylight plates, the Lindwurm photograph, the concrete shaft set, the
character footage, the three tonal-duplicate observatory frames, `observatory-app-01.png`
(Nexus; held in reserve), `tree-of-life-circuit.png` and `two-dragons-red-moon.png` (the hero
already carries tree, dragons and moon), the marble texture and two spare topographic
textures.

## Motion and interaction choreography

Beat sheet (kinetic doctrine's required first output):

| Beat | Trigger | What moves | Duration | Hands off to |
|---|---|---|---|---|
| hero-reveal | load, fonts ready | *Codex* rises from `clip-path: inset(0 0 100% 0)`; poster 1.06 → 1; lede fades in | 800ms word, 1600ms poster, +300ms lede | hero-handoff |
| hero-handoff | scroll 0 → 100vh, scrub 1 | poster translates −12vh; title block translates −40vh and fades to 0 | scroll-linked | portrait-wipe |
| portrait-wipe | portrait 20% in view, once | portrait clip opens top→bottom | 800ms ease-out | paths-pin |
| paths-pin | paths section top hits top; pin 600vh; scrub 1 | reading blocks scroll through; frame crossfades (opacity + scale 1.04→1) at each fifth; counter ticks | scroll-linked | video 1 |
| video-play | section 30% in view | video plays; leaves view → pauses | — | — |
| rows-rise | campaign rows / board tiles 15% in view, once, batched | translateY 24 → 0, opacity 0 → 1 | 400ms, 60ms stagger, ≤ 8 | — |
| campaign-hover | pointer over a row (fine pointer, ≥1280px) | the row's frame fades in at the right gutter beside the row, level with the cursor, and follows it vertically with ~350ms lag; inline thumbnails below 1280px | 150ms | — |
| board-count | quest toggled | XP figure counts to new value | 400ms | — |

- Library: GSAP 3.13 + ScrollTrigger from `assets/vendor/`, registered once; `gsap.matchMedia`
  gates everything on `(prefers-reduced-motion: no-preference)` and the pin on `(min-width:
  1025px)`.
- Hover and focus: links get a brass 1px underline at 0.3em offset; tiles lift their border
  to brass; nothing moves more than 4px on hover. Cursor stays the system cursor.
- Touch: no hover frames (thumbnails are inline instead); no pin; the video sections still
  autoplay muted inline.
- Keyboard: every anchor, tile and button is focusable in DOM order; the pinned section
  does not trap focus (it is ordinary flow with a sticky frame).
- Reduced motion: no ScrollTrigger, no load timeline; videos replaced by posters; all
  elements at final state; XP updates instantly.

## Implementation notes

- Files: `index.html`, `css/site.css`, `js/site.js`, `README.md`; assets referenced by CDN
  URL from the manifest; fonts via `assets/fonts/fonts.css`; GSAP via `assets/vendor/`.
- All paths relative (GitHub Pages subpath). No build step. No dependencies beyond the two
  vendored files.
- Tokens as CSS custom properties on `:root`, named exactly as in `DESIGN.md`.
- Loading: hero poster `fetchpriority="high"`, `decoding="async"` elsewhere, `loading="lazy"`
  on everything below the fold; videos `preload="metadata"`; every media element sits on a
  `surface` background so a slow CDN leaves composed rectangles.
- The browser's own surfaces are themed: `::selection` brass/ground, scrollbar surface/figure-3,
  caret brass, focus ring brass.

## Responsive behavior

- **1440 (designed):** 12 columns; reading columns 5–6 wide; paths pinned with sticky frame
  on the right; campaign hover frames; nav inline.
- **1025–1439:** same composition, gutters and type fluid.
- **641–1024 (tablet):** nav collapses to the Index disclosure; paths unpinned — each path is
  its own 100vh block with the image above the text (the sticky frame is only worth it with
  room beside it); campaign frames become inline thumbnails; board 2×3.
- **≤640 (phone, 390 designed):** hero word 24vw; lede 20px; portrait above the facts; board
  1×6; closing line 44px; gutters 20px.

## Performance guardrails (targets, not results)

- LCP: the hero poster; target < 2.5s on a fast connection, CDN permitting. Measured in QA
  only as "paint happened", since the CDN is blocked in the verification browser.
- INP < 200ms: no work on scroll beyond GSAP's scrub; hover frame uses `transform` only.
- Frame budget: pinned section animates opacity and transform only; `will-change` on the
  frame images during the pin and nowhere else.
- Payload ceiling for the page's own code: < 60 KB HTML+CSS+JS, plus GSAP (~95 KB) and the
  fonts (4 files). Media is the CDN's.

## Build order

1. Static HTML with all copy and all media references; tokens in CSS; verify hierarchy in
   the browser at 1440 and 390 with the CDN blocked.
2. Layout per section; responsive change points; nav disclosure; board interaction.
3. Motion: hero-reveal and hero-handoff; then paths-pin; then rows-rise and video play/pause.
4. Reduced-motion path verified; keyboard pass; console clean.
5. Author QA (`07-qa.md`), then the independent finish review (`10-finish-review.md`), one
   fix round, re-review.

## Acceptance criteria

- One direction only; no alternatives were produced (brief policy).
- The hero word measures 16vw ± 0.5 at 1440 and 24vw at 390 (checked in the browser).
- Every section in the media map uses exactly the named files; no other media appears.
- All eight sections present; the oath reachable by scrolling; the board lights and resets
  by mouse and keyboard; XP figure is a live region.
- No sentence that is not traceable to `PROFILE.md`; `[I]` lines are attributed.
- Reduced motion: no pin, no load animation, posters instead of video, identical content.
- Console clean at 1440 and 390 with the CDN host blocked; no horizontal overflow.
- Body text contrast ≥ 4.5:1 for every pairing used; the `moon` colour appears only in the
  closing line.
- All references relative; no `node_modules`; no file outside `sites/convenium` edited.

## Research basis

Not opened: the brief asks for nothing "current" or "trending"; the direction is derived
from the supplied media and the profile.
