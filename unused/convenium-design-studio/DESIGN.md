---
name: Convenium.Design Journey v2
description: Warm-paper editorial workspace with heavy monospace headlines, a fixed near-black rail, a persistent Oracle dock and dark neural canvases — built to match the approved journey-v2 imagery screen for screen.
northStar: Convenium.Design Journey v2
version: 4.0
resolvedAtGate: approved-in-plan
resolvedOn: 2026-10-03
source: New_upgradePlan/media/apollo-continuous-journey-v2/00…10 (canonical), Screenshot (2687–2703) (brain-network and editorial references)
supersedes: "Oracle Continuum 3.0 (2026-09-15) and the chat-first rebuild (2026-09-16)"
measurement: "Colours sampled from the PNGs with PIL; geometry measured at the mockup size 1672×941. 1rem = 16px at a 1672px viewport (html font-size clamp(13px, 0.957vw, 17px))."
colors:
  rail: "#0B1111"
  railActive: "#172A23"
  railAccent: "#06E08B"
  railText: "#E4E9E7"
  paper: "#F7F7F2"
  paper2: "#F1F1EB"
  card: "#FDFDFB"
  line: "#DCDDD8"
  ink: "#0B1111"
  ink2: "#252C2A"
  muted: "#5B6361"
  green: "#078A56"
  greenStrong: "#0A7A4B"
  greenTint: "#E2F1E9"
  greenLine: "#9FD0B9"
  blue: "#0B6BFA"
  blueTint: "#E7F0FE"
  amber: "#C97C0A"
  amberText: "#B86E00"
  amberTint: "#FCF4E2"
  coral: "#E0282A"
  coralTint: "#FDEEEC"
  canvas: "#081316"
  nodeGreen: "#2EE6A8"
  nodeBlue: "#3B9CFF"
  nodePink: "#E45BD8"
  nodeAmber: "#F2C94C"
  nodePurple: "#A78BFA"
  nodeCoral: "#FF5A5F"
typography:
  display: { family: "JetBrains Mono", weight: 800, size: 2.3rem, hero: 2.7rem, transform: uppercase, lineHeight: 1.02 }
  subline: { family: "JetBrains Mono", size: 0.8rem, letterSpacing: 0.26em, transform: uppercase }
  label: { family: "JetBrains Mono", size: 0.66rem, letterSpacing: 0.2em, transform: uppercase }
  body: { family: "JetBrains Mono", size: 0.8rem, lineHeight: 1.45 }
  ui: { family: "Inter", weights: [400, 500, 600, 700], use: "rail items, buttons, names, values" }
  fonts: "Self-hosted woff2 in public/fonts (JetBrains Mono, Inter; OFL)"
spacing:
  pageLeft: 2.875rem
  pageRight: 2.5rem
  cardGap: 0.75rem–1rem
rounded:
  card: 0.25rem
  control: 0.2rem
  dock: 0.625rem
shell:
  rail: 14.875rem (238px at 1672, ≈205px at 1440)
  topStrip: 3rem
  inspector: 22–29rem per view, in the page grid, sticky under the strip
  dock: 43rem (37rem beside an inspector), bottom 1rem, centred over the content column
motion:
  feedback: 120ms
  change: 180ms
  trace: 260ms
  easing: "cubic-bezier(0.2, 0.7, 0.2, 1)"
  reducedMotion: "all durations collapse to 1ms; edge flow, orb breathing and totem bob stop"
breakpoints:
  phone: "0–819px — rail becomes a drawer, graphs default to list, inspector becomes a slide-over"
  tablet: "820–1279px — inspector becomes a slide-over"
  desktop: "1280px and above — inspector in the page grid"
---

# Convenium.Design Journey v2 — design specification

## Visual world

Convenium.Design is an editorial operations desk. Warm paper with a faint 1.5rem technical grid, framed by a near-black rail. Headlines are heavy uppercase monospace; labels are small, letter-spaced mono; names, values and buttons are Inter. Knowledge, System and the Agents brain open dark technical canvases where nodes glow in their identity colour and edges carry typed, labelled relationships. The shell never changes between screens.

This version replaces both the September 15 "Oracle Continuum" spec and the September 16 chat-first rebuild. The owner asked for the UI in the journey-v2 imagery, with brain-network node views and Higgsfield-generated imagery. Points and levels are still out of scope.

## Semantic colour (fixed meaning on every screen)

| Meaning | Colour | Used for |
|---|---|---|
| Active · verified · complete · approved | green `#078A56` (tint `#E2F1E9`) | completed stages, approve buttons, "BRIEF READY" |
| Action · selection · data flow | blue `#0B6BFA` (tint `#E7F0FE`) | links, running tasks, Setup B, Add Knowledge |
| Waiting · review · approval required | amber `#C97C0A` (tint `#FCF4E2`) | "PLAN READY — REVIEW REQUIRED", drafts, Gate C pending |
| Failure · blocker · destructive | coral `#E0282A` (tint `#FDEEEC`) | Cancel Safely, conflicts, errors |

On the dark canvas: agent identities use node colours. Oracle, the Director and Results are green; the Analyst and Producer are pink; the active agent is amber; the Critic is slate. Status dots follow the same four meanings.

## Shell

- **Rail.** APOLLO // wordmark, nine destinations in fixed order (Home, Projects, Plan, Playground, Results, Knowledge, System, Agents, Settings), active item dark-green with a bright-emerald icon, "Tutorials & guide" with the totem, footer "Higher ideas / Faster execution //".
- **Top strip.** Breadcrumb `Projects / Northstar / …`, Oracle status (green = live, amber = demo, coral = offline), date/time, avatar.
- **Oracle dock.** White floating card, bottom centre. Removable context chips (project, screen, selection), "● ORACLE ▾" opens the conversation, sparkle input, black send button. `/` focuses it. Oracle never approves, publishes or changes production.
- **Inspector.** Right column in the page grid (sticky), border-left. The page header spans the full width above it, as in the mockups.
- **Footer marks.** "APOLLO v1.0.0" and "// Creative intelligence for a brighter tomorrow" at the bottom of the page.

## Component grammar

Cards: white, 1px `#DCDDD8`, 0.25rem radius. Buttons: black (primary), green (approve/run), outline, coral-tint (destructive), all Inter 600, 3rem tall. Status banners: tinted box with a square dot, uppercase mono title, small sub-line. Badges: uppercase mono, tinted. Tags: grey tint, Inter. Segmented progress bars. Vertical steppers with numbered, coloured markers. Key/value inspector rows.

## Graphs

- One engine (`public/js/graph.js`). Nodes are real DOM buttons, edges are SVG beneath them, layouts are deterministic.
- Pan by drag, zoom with −/+/fit (Ctrl+wheel). Dragging changes the view only, never the execution.
- Every graph has a list twin with the same node ids, which is the default on phones.
- **Pipeline** (System): layered INPUT → OUTPUT, agent cards with tool satellites, a status legend and a minimap.
- **Neural** (System → Architecture, Agents → Neural): Operator-style tree with a glowing core orb, agents above it and skills above them. Dotted lines run to the core.
- **Radial** (Agents): a light canvas with the core, a ring of agents, and the skills each carries. Dormant skills are collapsed into category counts.
- **Knowledge**: a hub-and-spoke graph with labelled edges (defines, informs, aligns, enables, conflicts, produces).

## Imagery (Higgsfield, GPT Image 2.5)

All generated images are in `public/media/apollo/` as WebP; the PNG sources are in `.olympus/asset-sources/`.

- Preview-site heroes: `hero-mountain`, `hero-concrete`.
- Neural core orb: `neural-core`, used as the hub of every brain graph.
- Convenium.Design Totem mascot in six poses: wave/base, point-right, point-left, think, celebrate, head. It guides the tutorials.

## Honesty rules

- The Northstar walkthrough data is marked **DEMO** wherever it shows: the run replay, the example graph, estimated scores.
- Agents, skills, slots, loadouts, budgets, phases, gates, tools and integrations are live server data.
- Drafts never appear as production. Configure and Playground changes reach production only through "Save to plan" or "Apply to plan", and both ask you to confirm first.

## Don'ts

- No WebGL, no framework migration.
- No fake progress or glow without a real relationship behind it.
- No colour that changes meaning between routes.
- No XP, points or achievements.
