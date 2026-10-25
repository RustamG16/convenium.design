# Asset manifest — Convenium.Design Workbench

## Current implementation

No media is required by the first Workbench prototype. The functional UI uses CSS-only project and agent identity fallbacks, so missing, blocked, or unavailable assets cannot prevent work.

| Asset group | Source | Intended later use | Status | Rights/provenance |
|---|---|---|---|---|
| Agent portraits | `public/media/gods/` | Agent profiles, agent picker, and selected-agent context; never primary Work controls | Approved for project use | User explicitly instructed reuse on 2026-09-01; original upstream provenance remains unverified |
| Environmental stills/videos | `public/media/other/` | Optional contextual Library/system moments | Not used | Local presence only; usage rights not yet confirmed |
| Product mark | Existing `favicon.svg` / UI mark | Shell identity | Used | Project-local existing asset; verify canonical wordmark before release |
| Systems atlas | New generated still saved under `public/media/other/` | Atmospheric background for the editable node playground; decorative only | Approved for one representative generation | User explicitly approved new generation on 2026-09-01; generated with the available OpenAI image tool because Sora is unavailable in this environment |

## Controls

- One generated still is approved for the systems atlas. No generated video, transformation, purchase, or WebGL asset is approved.
- Existing agent portraits are approved for this project by explicit user instruction; upstream provenance remains recorded as unknown and must be resolved before public redistribution.
- Every future media placement needs source, license/permission, transformation, dimensions, target weight, static fallback, and performance budget recorded here.

## Systems atlas specification

- **Stable ID:** `systems-atlas-01`
- **Purpose/message:** make the node editor feel like a configurable world map while leaving graph structure and controls dominant.
- **Placement:** Architecture node-canvas background only; decorative with empty alt text.
- **Format/dimensions:** landscape PNG or JPEG, approximately 16:9; responsive center crop; target optimized delivery under 450 KB.
- **Art direction:** dark obsidian drafting table, pale marble topography, fine brass construction lines, sparse cyan energy traces, museum-grade cinematic lighting, no figures, no legible text, no UI mockup, no logo.
- **Fallback:** existing tonal CSS/noise background; graph remains fully functional without the asset.
- **Quantity/cost:** one generated candidate in the first batch.
- **Acceptance:** quiet enough for white graph labels and cyan/violet connectors to remain legible at WCAG-oriented contrast.

## Desktop continuous-improvement media — approved 2026-09-01

The user explicitly requested new media and uninterrupted implementation. This authorizes the following smallest representative batch; no video, 3D, WebGL, stock purchase, or identity generation is included.

### `work-signal-field-01`

- **Purpose/message:** orient the Work surface as a calm local command space with a subtle sense of an active system behind the conversation.
- **Placement:** low-opacity background layer in the central Work area only; decorative, empty alt text.
- **Format/dimensions:** 21:9 or similarly wide still, target source at least 1600×700; optimized WebP target under 320 KB.
- **Safe crop:** center/right energy path remains visible from 1280×800 through 1920×1080; no essential detail near edges.
- **Art direction:** black obsidian drafting surface, restrained ivory contour lines, one warm brass orbit, sparse cyan signal points, premium industrial/editorial lighting, generous negative space.
- **Exclusions:** no people, deities, faces, readable text, UI mockups, logos, purple AI cloud, neon city, starfield, or high-frequency detail.
- **Provenance:** generated for this project with the available OpenAI image generator on 2026-09-01; prompt recorded in the implementation turn.
- **Quantity/cost:** one candidate; no iterative batch unless it fails legibility/performance acceptance.
- **Fallback:** existing CSS radial gradient and noise texture.

### `comparison-lenses-01`

- **Purpose/message:** distinguish Playground as controlled comparison: the same input passing through two bounded systems toward an evidence point.
- **Placement:** decorative background inside the desktop experiment workbench/results region; never behind form labels at full opacity.
- **Format/dimensions:** 16:9 still, target source at least 1400×800; optimized WebP target under 280 KB.
- **Safe crop:** twin forms and convergence point remain legible in a wide right-hand panel.
- **Art direction:** two translucent architectural lenses or calibrated brass/ivory instruments, one cyan and one amber signal path, dark neutral studio, precise scientific composition, soft falloff.
- **Exclusions:** no people, faces, text, UI mockups, fantasy portal, generic gradient blob, decorative code, or lens flare.
- **Provenance:** generated for this project with the available OpenAI image generator on 2026-09-01; prompt recorded in the implementation turn.
- **Quantity/cost:** one candidate; no iterative batch unless it fails legibility/performance acceptance.
- **Fallback:** CSS conic/radial comparison field.

### Lucide command icons

- **Purpose:** improve repeated command recognition while retaining explicit text labels and accessible names.
- **Source/license:** official Lucide package, ISC license; pinned dependency and local delivery.
- **Placement:** command buttons only; icons are `aria-hidden` when adjacent text supplies the name.
- **Acceptance:** consistent 16 px stroke icons, no icon-only destructive action, no remote fetch, and no visual dependence on icon color alone.

## Visual-enrichment cycle — approved 2026-09-01

The user explicitly requested a stronger design layer and authorized newly generated media for Convenium.Design Studio. This bounded batch adds atmosphere only; all product controls, labels, and state remain fully usable with the CSS fallback.

### `system-concordance-01`

- **Purpose/message:** give Systems a quiet visual language for a composed, reviewable agent team rather than a generic flow editor.
- **Placement:** low-opacity background on the Systems canvas and system summary; decorative, empty alt text.
- **Format/dimensions:** wide 16:9 WebP, target optimized delivery under 420 KB; center crop with no required edge detail.
- **Art direction:** a dark obsidian field with a restrained ivory topographic diagram, five small brass and cyan constellation marks arranged around a calm central orbit, subtle drafted grid, museum-grade editorial lighting.
- **Exclusions:** no people, faces, legible text, logos, UI mockups, screens, fantasy character art, purple gradient clouds, or high-frequency detail.
- **Provenance/approval:** generated with the built-in OpenAI image generator on 2026-09-01, explicitly authorized by the user; prompt and final path recorded in the handoff evidence.
- **Fallback/acceptance:** existing CSS grid/noise surface; node labels, connectors, and focus outlines remain legible at normal contrast.

### `knowledge-reliquary-01`

- **Purpose/message:** make the Knowledge Factory feel like a curated capability collection, not a list of raw records.
- **Placement:** low-opacity visual field in the Library header and empty/overview state; decorative, empty alt text.
- **Format/dimensions:** wide 16:9 WebP, target optimized delivery under 420 KB; center/right crop supports desktop header composition.
- **Art direction:** an architectural archive of pale stone shelves, warm brass rails, sparse cyan-lit skill artifacts and index cards without readable labels, dark gallery surround, meticulous editorial product still life.
- **Exclusions:** no people, faces, legible text, logos, UI mockups, fantasy clutter, neon cityscape, or stock-photo office styling.
- **Provenance/approval:** generated with the built-in OpenAI image generator on 2026-09-01, explicitly authorized by the user; prompt and final path recorded in the handoff evidence.
- **Fallback/acceptance:** tonal CSS surface and existing local content; filters, search, and selection remain primary.
