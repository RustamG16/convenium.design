# Design DNA — how a profile becomes a design

Design DNA is the complete set of design decisions for one site, derived from the profile,
the role and two sliders, without the user choosing anything visual. It is deterministic:
`deriveDNA(profile, role, sliders)` with every "pick one of N" seeded by `hash(profileId)`.

Output shape: `dna.schema.json`. Families: `doctrines.json`.

## Step 1 — Family (doctrine)

Score each family from the inputs below; take the highest; ties break by seed.

| Signal | Source | Effect |
|---|---|---|
| Role prior | `role.primary` | engineer → instrument +2, atelier +1 · designer → atelier +2, kinetic +1 · visual → gallery +2, kinetic +1 · writer → editorial +2, atelier +1 · founder → kinetic +1, atelier +1, instrument +1 · consultant → warm +2, atelier +1 · researcher → editorial +2, instrument +1 · student → warm +1, instrument +1, kinetic +1 |
| Vibe words | `preferences.vibe` | keyword table: quiet/calm/minimal → atelier +2 · bold/cinematic/epic → kinetic +2 · precise/technical/systematic → instrument +2 · warm/friendly/human → warm +2 · editorial/literary/classic → editorial +2 · raw/visual/immersive → gallery +2 · ancient/mythic/futuristic → cyberpunk-athens +2 |
| References | `preferences.references` | known-brand table (Kinfolk → atelier/editorial, Apple → atelier, Nike → kinetic, Linear/Vercel → instrument, Stripe → instrument/atelier, A24 → kinetic/editorial, Aesop → atelier/warm …); unknown names ignored |
| Motion appetite | `preferences.motionAppetite` | lively → kinetic +2, gallery +1 · none → atelier +1, editorial +1, instrument +1 |
| Tone | `preferences.tone` | formal → atelier +1, editorial +1 · warm → warm +2 · bold → kinetic +1 · plain → instrument +1 |
| Goal | `intent.goal` | academic → editorial +2 · press → kinetic +1 · clients → warm +1 |
| Avoid list | `preferences.avoid` | "animations"/"movement" → kinetic −3 · "dark" → kinetic −1, cyberpunk −2 · "minimal"/"boring" → atelier −2 |

Families and what they are: see `doctrines.json`. Four come from Convenium.Design
(`atelier`, `kinetic`, `instrument`, `cyberpunk-athens`), two are new (`editorial`,
`warm`, `gallery` — three new, one is `gallery`). Each family fixes: type pairings allowed,
scale, display size range, density, ground (dark/light/both), motion ceiling, hero variants.

## Step 2 — Ground and palette

- Ground: `colorFeeling` wins (dark/light). `none` → family default. A family that forbids the
  requested ground (instrument is light-first; kinetic is dark-first) keeps its default and
  records the override in `dna.notes`.
- Hue: the family defines an allowed hue range for the accent (kinetic: any luminous hue;
  atelier: muted, 0–60 or 180–240; warm: 10–50; editorial: 350–20 or neutral; instrument:
  200–260; gallery: neutral, accent from media later; cyberpunk-athens: fixed brass/cyan).
  The hue inside the range is `seed % rangeWidth` and then shifted by the **warm ↔ cold
  slider** (±30°).
- Lightness and chroma: from the family; the **quiet ↔ loud slider** scales chroma (0.6× to
  1.4×) and display size within the family's range.
- Every pairing (text on ground, text on surface, accent on ground, ground on accent) is
  computed with its contrast ratio and must pass AA (4.5:1 body, 3:1 large). If a derived
  accent fails, lightness is nudged in 2% steps until it passes; the nudge is recorded.

## Step 3 — Type

- Each family lists 3–4 pairings (display + text) from the curated self-hosted set of ~12
  pairings. Pick by seed, then filter: `tone: formal` removes playful pairings;
  `language` non-Latin forces pairings with coverage.
- Scale: family ratio (atelier 1.25, editorial 1.333, instrument 1.2, warm 1.25, kinetic 1.5,
  gallery 1.414, cyberpunk 1.333). Hero size: family range, position in range from the loud
  slider. Always written as `clamp(rem, vw, rem)`.

## Step 4 — Density, rhythm, motion

- Density: family default, adjusted by how much proof exists (more than 8 proof items → one
  step denser).
- Section rhythm: viewport-height sections (kinetic, gallery) vs. flow (others).
- Motion level: `min(family.motionCeiling, preferences.motionAppetite)`; `lively` only if the
  page has ≤ 8 sections; reduced-motion always has an end state.

## Step 5 — Hero variant and media treatment

- Hero variant: from `roles.json[role].heroVariants ∩ family.heroVariants`, by seed. If the
  profile has no media descriptions at all, `full-bleed-media` and `work-reveal` are removed.
- Media treatment: family rule (bleed vs. contained, scrim belongs to type).

## Step 6 — The three sentences

Templated, not generated:
"Your site is **{family.name}**: {family.oneLine}. It is {ground} with {accentName} as the one
accent, set in {display} and {text}. {motionSentence}"

## Distinctness guarantee

CI renders every fixture and asserts that no two fixtures with different primary roles share
all three of (family, accent hue bucket of 30°, hero variant). If a new family or role breaks
it, the mapping gets a new signal, not a random factor.
