# The Rustam Codex

A cinematic one-page site built from `PROFILE.md`: a private personal universe drawn as an
ancient observatory with restrained futuristic instruments. It is written for Rustam himself and
for anyone he chooses to walk through it. The site presents the Codex described in the profile:
the mission, the recurring question ("Which part of me wants this, and why?"), the six paths, the
five campaigns, a playable sample quest board, the epistemic rule that a connection is not a proof,
the personal motifs, the origin, and the rule that rest is protected.

## Run it

No build step, no dependencies.

```bash
cd sites/plain
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly in a browser also works.

Requirements: a modern browser and an internet connection. All images and videos are loaded
directly from the CDN URLs in `assets/manifest.json` (nothing is downloaded into the folder), and
the three typefaces (Cormorant Garamond, Inter Tight, IBM Plex Mono) come from Google Fonts with
serif/sans fallbacks.

## What is in it

| File | Purpose |
| --- | --- |
| `index.html` | All content and markup, with media referenced by manifest URL |
| `css/style.css` | Design tokens, layout, motion, responsive and reduced-motion rules |
| `js/main.js` | Vanilla JS: scroll choreography, the wheel of six paths, quest board, starfield |
| `assets/` | `manifest.json` (media list), `MANIFEST.md`, `download.sh` (untouched) |

## Experience map

1. Hero: opening curtain, the cherry-red world, masked title reveal, drifting starfield.
2. Mission: a pinned scroll sequence of four statements over the red-sun station film.
3. The question: full-bleed mirror scene with a split-word reveal.
4. Six paths: an interactive wheel (hover, click, arrow keys, or auto-turn). Each node swaps the
   world image, accent colour, text and skills.
5. Campaigns: a pinned horizontal scroll of five campaign cards with their boss encounters.
6. Working principle, then a playable daily quest board (illustrative and not saved, as the
   profile specifies).
7. Underlying Order: the five registers of knowing, over the Higgs-field film.
8. Atlas of symbols, origin (Baku to Klagenfurt), the protected-rest scene, and the finale.

## Notes

- `prefers-reduced-motion` is respected: the curtain, grain, pinned scrolling and parallax are
  switched off and the content reads statically.
- Below 960px wide the horizontal campaign scroll becomes a native swipe carousel.
- Content follows the profile's own cautions: interpretations are labelled as analogies, the quest
  board is not presented as a real tracker, XP are placeholders, and no private psychological
  detail is shown.
