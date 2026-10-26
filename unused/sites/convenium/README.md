# The Rustam Codex

A cinematic single page: the entrance to the private personal universe proposed in
`PROFILE.md`. Built by the Convenium.Design system from the brief in `PROMPT.md` and the
media in `assets/manifest.json`.

## Run it

It is a static site with no build step.

```sh
cd sites/convenium
npx http-server . -p 8080      # or: python3 -m http.server 8080
```

Open <http://localhost:8080/>. Opening `index.html` directly from disk also works, but the
self-hosted fonts load more reliably over http.

Published by GitHub Pages at `https://rustamg16.github.io/Convenium.Design/convenium/`; every path is
relative, so the folder can be served from any subpath.

## What is in here

| Path | What |
|---|---|
| `index.html` | the page: index, hero, the inhabitant, six paths, the underlying order, campaigns, the companion, the board, the oath |
| `css/site.css` | tokens (the numbers in `DESIGN.md`) and layout |
| `js/site.js` | hero reveal and handoff, the six-path crossfade, video play/pause, hover frames, the illustrative quest board |
| `assets/fonts/` | Bodoni Moda and Instrument Sans, self-hosted (SIL OFL 1.1) |
| `assets/vendor/` | GSAP 3.13 and ScrollTrigger |
| `assets/manifest.json` | the 67 supplied media entries; 21 are used, by URL |
| `PRODUCT.md`, `DESIGN.md`, `design.json` | product truth and the committed design system |
| `.olympus/` | the run's evidence trail: brief, asset manifest, build plan, QA, finish review, handoff |

## Notes

- Media is referenced from Higgsfield's CDN by URL (this build environment could not
  download it). `assets/download.sh` pulls everything locally if you want to self-host; then
  replace the URLs in `index.html` and `css/site.css` with the local paths.
- `prefers-reduced-motion` turns off every animation, unpins the paths and shows the video
  posters instead of the videos. The content is identical.
- The quest board is illustrative, as the profile labels it; its lit state lives only in
  your browser's `localStorage`.
