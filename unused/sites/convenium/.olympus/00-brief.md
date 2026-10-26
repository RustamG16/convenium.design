# Brief — director-resolved

The brief (`PROMPT.md`) grants explicit creative freedom ("pick the topic yourself", "be
creative"). Per the brief-reading rules in `AGENTS.md`, the intake round is cancelled; every
field below is resolved by the director from `PROMPT.md`, `PROFILE.md` and
`assets/manifest.json`. Trail: **abridged**.

## Target

- Project: `sites/convenium` (greenfield, no existing page)
- Route/page: `/` — one cinematic single page
- Mode: concept + implementation

## Outcome

- Topic chosen: **The Codex — a private universe for one inhabitant.** The entrance page to
  the "personal universe" that `PROFILE.md` proposes (section 9, "THE RUSTAM CODEX"): six paths
  (Architect, Seeker, Creator, Builder, Alchemist, Humanitarian), the campaigns, the
  companion question, an illustrative quest board, the oath.
- Why this topic: 15 of the 67 supplied assets are one coherent commissioned set — "ancient
  observatory craftsmanship fused with restrained futuristic instruments" — and six of them
  are literally captioned as the world headers for the six paths; one is the "universe poster"
  (tree of life, two dragons, red moon — the inhabitant's own motifs). The media already *is*
  this site. Every other set (Cyberpunk Athens, the cherry-red space launch film, the alpine
  plates) belongs to a different world and is excluded for that reason.
- Primary audience: the inhabitant himself (the profile is written to "you"; the site keeps
  that address), and the few people he chooses to show it to.
- Primary visitor action: scroll the whole page to the oath; secondary: light the quests on
  the illustrative board.
- Success signal: the page reads as *his* universe in the first viewport, not as a generic
  dark template; a visitor can name the six paths after one pass.

## Constraints

- Must preserve: facts as stated in `PROFILE.md` (only `[F]` facts and the profile's own
  proposals are used as copy; `[I]` inferences are quoted as interpretations; `[U]` unknowns
  are not filled in). The quest board is labelled illustrative, as the profile labels it.
- May change: everything visual.
- Stack: static HTML/CSS/JS, no bundler, no build step. Runs with any static server.
- Media: referenced by CDN `url` from `assets/manifest.json` (container cannot download).
- Generation budget: at most 10 Higgsfield credits; target 0 — the set is complete.

## Taste references

| Reference | Specifically liked | Do not copy / avoid |
|---|---|---|
| The supplied observatory set (14 images) | stone + brass + one controlled luminous accent; large negative space; believable materials | stock sci-fi HUD, neon excess (the prompts ban these too) |
| `PROFILE.md` §6 creative preferences | ancient × futuristic, symbolic geometry, psychological surrealism, dark and elegant | anything that looks generic or obviously AI-generated |

## Direction

- Chosen doctrine: `convenium-design-kinetic` (the brief says "cinematic: motion, atmosphere,
  strong typography, dark and elegant") with Atelier's type discipline borrowed for the
  reading sections.
- Structural posture: cinematic
- Motion posture: scroll-narrative (one hero moment; six-path pinned sequence; everything
  else is state feedback)
- Type logic: a high-contrast didone display face carries the mythic register at 16vw in the
  hero; a neutral sans carries the reading; nothing else.
- Colour logic: warm near-black ground with a violet-brass cast; brass is the one luminous
  accent; the red moon appears only inside imagery and once, in the closing line.
- Explicitly ruled out: three directions; neon; HUD chrome; gradient text; card grids;
  eyebrow labels over headings; invented facts, metrics, testimonials.
- Alternatives requested: no.

## Available assets and access

- Brand: none supplied; the sigil asset (`images/sigil-tree-dragons-moon.png`) is used as the mark.
- Fonts/licenses: Bodoni Moda + Instrument Sans (SIL Open Font License, self-hosted).
- Images/video: 67 entries in `assets/manifest.json`, all on Higgsfield's CDN.
- Figma / analytics: none.
- Missing: nothing required.

## Gate A / Gate B

- Status: approved-in-plan (abridged trail; creative freedom granted in the brief)
- Date: 2026-10-21
