# Section library — what the composer can place

Each section is an Astro component in `packages/templates/src/sections/` with a typed props
contract. Data sources are listed in `taxonomy/roles.json → sectionDataSources`. A section
renders only when its source has at least one public entry. Every section has a
zero-media state and a reduced-motion end state.

## Hero variants (one per site, chosen by DNA)

- **type-statement** — name small, headline as the display line at the family's hero size,
  call to action, optional location line. Zero-media native.
- **split-portrait** — type left, portrait or ambient media right; falls back to a
  typographic monogram block when no portrait exists.
- **full-bleed-media** — one media behind the statement; scrim owned by the type. Requires a
  media slot; removed by DNA when none exists.
- **work-reveal** — the first three work pieces animate in behind or beside the name
  (kinetic/gallery). Requires work media.
- **editorial-lead** — magazine opening: kicker, headline, standfirst, byline-style meta.
- **code-ambient** — type statement over a slow generative-CSS grid (engineers, instrument).
- **ambient** — type statement over generated or CSS ambient texture from the DNA palette.

## Proof sections

- **proof-grid** — 2–3 column cards: name, one line, tags, link. Engineers, students.
- **case-studies** — alternating wide rows: media, title, role, outcome. Designers.
- **projects** — simpler list-with-media. Students, founders.
- **ventures** — large rows with organization, period, one paragraph, outcome. Founders.
- **gallery** — masonry or strict grid by DNA density; lightbox; captions. Visual creatives.
- **series** — groups `work` by year or by tag into titled sets. Visual.
- **selected-writing** — list of titles, venue, year, link. Writers.
- **research** — project cards with a one-paragraph abstract. Researchers.
- **publications** — citation-style list grouped by year. Researchers, writers.

## Story sections

- **about** — summary, location, languages, availability; optional portrait.
- **experience-timeline** — vertical timeline; highlights as a short list.
- **education** — compact list.
- **skills** — grouped chips or a two-column list by density.
- **offer** — what I help with (from skills groups) + call to action. Consultants.
- **process** — three to five numbered steps derived from the summary (user confirms copy).
- **topics** — the beats a writer covers (skills groups). Writers.
- **teaching** — courses from experience entries matching teaching titles.

## Social proof

- **testimonials** — one at a time (calm) or a quiet grid.
- **clients** — organization names as a text row; no logos unless uploaded.
- **recognition** — awards, shortlists.
- **talks** — list with event and year.

## Closing

- **contact** — form (Turnstile) or email button per `contact`; links row; small print with
  the Folio badge on Free.

## Card mode

When a profile is below its role's minimum viable set: `hero(type-statement)` + `about` +
the one proof section that has data + `contact`, all on one viewport-height page with flow
rhythm. The dashboard says why and what would unlock the full page.
