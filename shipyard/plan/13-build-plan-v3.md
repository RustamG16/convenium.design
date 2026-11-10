# 13 — Build plan v3: Space Regatta Arcade

**Owner direction, 2026-11-09:**

- Use Regatta Arcade, set in space with spaceships and an alien crew.
- "MAKE SURE YOU MATCH REFERENCE ARCADE UI EXACTLY AS IT IS."

**The references are the spec.** The four screens in `plan/concepts-v3/space/`:

- `hangar-space-arcade.png`
- `regatta-space-arcade.png`
- `bridge-space-arcade.png`
- `forge-space-arcade.png`

Every screen is built to match its reference in four things:

- composition: panel order, column split and proportions;
- chrome: chamfered HUD panels, skewed tabs and buttons, neon red rims, gold laurels;
- type: heavy condensed italic caps;
- art: space plates, ship cutouts, alien crew.

The QA step puts a 1440-wide screenshot next to each reference.

## What is matched as drawn, and what is not

The references are generated images: they draw the layout, but the content in them is not true. They invent ships, numbers and titles. For example:

- ships: SS Promptline and SS Drydock;
- numbers: the SPEED/RIGOR/COST and INTELLECT/CREATIVITY stats;
- titles: "The Harmonic Synthesist";
- several role labels are shuffled.

Shipyard's honesty rules still apply (PRODUCT.md: every number carries a truth label). So **the layout and chrome are matched as drawn, and every slot holds the knowledge base's real value**:

| Reference slot | Filled with |
|---|---|
| Hangar fleet cards: crew, stages, status | Real `ship.crew.length`, the count of stage steps, and `preflight()` ("READY" or "N OF M CHECKS PASS") |
| Hangar ticker | One line per library ship's pre-flight state, the Armory skill count, the Regatta, and the Forge (dev only) |
| Regatta lanes, podium, table | The real dry-run entrants, criteria, totals and Best marks |
| Bridge "Agent stats" | Real measures for the member: skills on route, artifacts worn of sockets, tier (Haiku 1, Sonnet 2, Opus 3 bars), each labelled Verified |
| Bridge subtitle and chips | The agent's real role, access and model tier |
| Forge "Crew stats" | The draft agent's routes, priority, tier and access, as typed in the form |

**One product rule changes to match the Hangar reference.** It shows every library ship as a card in the Fleet row. That replaces v1 acceptance 1, which allowed only one library card. The drydock ships follow the library ships in the same row.

## Shell (every screen)

- **Header:**
  - Logo: the red three-slash mark, with small spaced "CONVENIUM" above "SHIPYARD" in 900 italic.
  - Nav: Hangar · Armory · Regatta · Logbook · Forge. This follows three of the four references; the Forge stays dev only.
  - The current page's tab is a filled red parallelogram with a glow.
- **Type:**
  - Archivo is the arcade face, using the wdth italic axis, weight 900, wdth 80, uppercase.
  - Labels use Archivo italic 600–700, tracked 0.04em.
  - Body and data use Inter.
  - Newsreader is retired from arcade surfaces.
- **Colour:**

  | Token | Value |
  |---|---|
  | Ground | #0B0809 |
  | Panel | rgba(22, 15, 16, 0.86) |
  | Rim | rgba(229, 57, 61, 0.45) |
  | Neon | #FF3B3F, glow 0 0 18px rgba(255, 59, 63, 0.55) |
  | Signal red | #D73B3E, kept |
  | Gold | #E8B04A |
  | Ready | #8FDDB0 |
  | Warn | #F4B740 |
  | Info | #A9C8FF |

  Ship colours come from the art: full-run red, abridged yellow, retrofit green, fleet purple, site-pass blue.
- **Chrome:**
  - Panels: 14 px chamfered corners via `clip-path`, a 1 px rim drawn with an inset shadow, and an optional hot rim (`data-hot`).
  - Buttons and tabs: parallelograms (`clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)`).
  - Primary buttons: red gradient with a glow.
  - Truth labels: outlined pills in Archivo italic.
- **Ground:** a fixed starfield and nebula built from CSS gradients on `body`, with no image cost.

## Art: `public/media/arcade/` (WebP; sources in `plan/concepts-v3/`)

| File | From | Used by |
|---|---|---|
| `plate-dock.webp` 2400w | `space/decor/bg-orbital-dock-21x9.png` | Hangar hero, Forge backdrop |
| `plate-race.webp` 2400w | `space/decor/bg-race-circuit-21x9.png` | Regatta hero |
| `plate-bridge.webp` 2400w | `space/decor/bg-bridge-21x9.png` | Bridge backdrop |
| `ship-<id>.webp` 960w, alpha | `space/ships/ss-*.png` | Hangar hero and cards, Regatta lanes, podium and table heads |
| `crew-<id>.webp` 768, alpha | `space/crew/*.png`; Wren is cropped from the lineup with a feathered mask | Bridge and Forge pedestal |
| `card-<id>.webp` 360×480 | Crops from `space/crew/lineup-21x9.png` | Bridge crew cards |
| `laurel.webp` | `decor/laurel.png` | Hangar score badge, podium 1st |
| `gate.webp` (animated) | `space/decor/holo-gate.gif` | Not used: lane rings are drawn in SVG, coloured per lane |
| `thruster.webp` (animated) | `space/decor/thruster.gif` | Engine plume behind the Regatta lane ships |

Art for a ship: the library id when the ship is a library ship or a copy of one (`origin.from`); otherwise by hull (ship-a → full-run … ship-e → site-pass).

Art for a crew member: the agent id (captain…gauge).

No new paid generation. All of the art above comes from the approved 160-credit rounds.

## Screens

### Hangar (`#/`)

1. **Hero band**, about 470 px at 1440, over `plate-dock`:
   - left: the "SHIPYARD" wordmark (900 italic, about 132 px) with a checkered flag in SVG, the lede in italic caps, and the "How it works" parallelogram;
   - right: up to five numbered launch pads (glowing ellipses, 01–05) with the fleet's ship art. The focused ship is large in the foreground with its engine glow.
2. **Ticker strip:** a red "SHIPYARD TICKER »" tab, then the real status lines separated by `//`. It scrolls with CSS; under reduced motion it is static.
3. **FLEET heading** with an "N SHIPS" tag. Below it, a horizontal row of cards with arrow buttons that scroll it. Each card:
   - ship art on a nebula;
   - name;
   - "Commissioned · Template" (or "Drydock · yours");
   - CREW and STAGES big numerals;
   - a status bar: green READY, or amber/blue "N OF M CHECKS PASS".

   The flagship card has the hot rim and a "Flagship" crown tab. Hover or focus focuses a card. Each card's actions (Open, Pre-flight, and Rename/Reset/Delete for drydock ships) are kept, inside the card under the status bar.
4. **Footer bar:**
   - a laurel badge with the focused ship's integrity;
   - "Hull integrity …" with a Verified pill, then the next step;
   - a divider, then the stat line with its Verified pill;
   - the "COMMISSION A SHIP »" big red parallelogram.
5. Drydock empty state, On-the-blocks and the skill count stay below, restyled.

### Regatta (`#/regatta`)

1. **Hero over `plate-race`:**
   - left: the "REGATTA" wordmark plus checkers, the lede in italic caps, and Race/Leaderboard parallelogram tabs;
   - right: the "BRIEF" card (doc icon, the brief title large, then the summary · N ships · Simulated).
2. **Race stage** (`rg-arena`, DOM, replaces the WebGL arena and its water):
   - left: numbered lane tags, a coloured parallelogram number plus the ship name;
   - per lane: a neon dashed line in the lane colour, an SVG holo ring per buoy, and the ship art sailing to its score with a thruster plume;
   - right: the holographic checkered FINISH arch.

   It reveals buoy by buoy as today; under reduced motion it shows the final state. It keeps `data-lanes` and `data-winners`, and is `aria-hidden`; the accessible course is still the `rg-course` list, kept in a visually hidden form.
3. **Winner banner:** a laurel, then "SS X WINS WITH 93.6 OF 100." with the score in neon red, then "COMPARE CRITERION BY CRITERION ›".
4. **Results:**
   - left: "FINAL STANDINGS", a three-step podium (2nd, 1st, 3rd) with ship art, names and totals. Ties and no-winner races show no podium places; the cards read "tie" or "no winner".
   - right: "RESULTS COMPARISON". Criteria rows each have an icon, label and coloured bar; one column per ship with art, name and a Simulated pill; values with BEST tags; then the TOTAL row.

   Below: "NEW REGATTA ›". Setup (brief and ship pickers) uses the same chrome.

### Bridge (`#/ship/:id/bridge`)

Four columns at 1440 or wider, over `plate-bridge`:

1. **Figure:** the crew cutout on a glowing holo pedestal, with worn artifacts orbiting as gold discs. The 3D turntable is replaced by the art; the drag-to-body drop zone stays on the figure box.
2. **Identity:**
   - a "STATION N" red tag, the name, the role as an italic caps subtitle, chips, and the quote with a red rule;
   - the Profile disclosure;
   - the tuning summary panel with "TUNE <NAME>".
3. **Agent stats** (real measures), then the **Artifacts** anchor diagram and "EQUIP A SKILL".
4. **Tune Agent** panel, always open on wide screens:
   - model tier as three big tiles (Opus, Sonnet, Haiku);
   - skill route as a node chain;
   - the prompt addendum textarea with a counter;
   - TUNE and SEND TO REGATTA.

Across the bottom: "CREW (N OTHER AGENTS)", a row of portrait cards. Each card has the art, a pigment rim, a role icon disc, the name and the role; the active card has the hot rim. Head, ShipNav and the template line take the reference chrome.

### Forge (`#/forge`)

- **Header:** the FORGE wordmark with red `//`, then the explanation to the right of a divider.
- **Tabs:** AGENTS · n, SKILLS · n, WORKFLOWS · n as big parallelograms with icons.
- **Columns:**
  1. **Agent list:** "+ NEW AGENT" plus the agents, each with a pigment dot, name and meta line.
  2. **Preview:** the pedestal with the crew cutout, or a stand-in silhouette for a new id, and the "CREW STATS" panel.
  3. **Form:** a "NEW AGENT" panel with name, a radio-pill model tier, access, route chips with "+ Add route", phase pills, a priority slider and persona.
  4. **Diff preview:** line numbers with a green and red diff, additions and deletions counts, and "APPLY TO LIBRARY »".

## Order and checks

1. Art import (script), `arcade.css` tokens and chrome, the header.
2. Hangar.
3. Regatta, including the DOM arena; update `regatta.spec`.
4. Bridge.
5. Forge.
6. Armory, Logbook, Voyage and Pre-flight inherit the chrome through the shared classes.

After each step:

- `npm run typecheck`, `npm run lint` and `npx vitest run`;
- the affected e2e specs (one Playwright project at a time);
- a 1440 screenshot next to the reference, in `plan/qa-screens/v3-*.png`.

**What a test may change:** only where the reference changes a product rule — the Hangar shows every library ship, and the arena has no canvas. Accessibility (axe 0) and the reduced-motion paths are kept.
