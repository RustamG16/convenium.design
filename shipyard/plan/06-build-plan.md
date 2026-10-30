# 06 — Build plan: Convenium Shipyard

Written 2026-10-30 in a planning session (cloud). **Implement it in a fresh session** (the
build-plan rule in `AGENTS.md`). Trail: **abridged** — the owner's instruction fixes brief and
direction, so `00`–`04` collapse into § 1 below. This plan never skips `DESIGN.md` (committed
alongside it), the finish review or Gate C.

---

## 1. Brief, resolved by the director

**Owner's words (2026-10-30, paraphrased faithfully):** "Inspired by the ship view inside
ArkhEthos that explains the Convenium.Design system with its crew members, create a new UI…
the same UI, but customizable and editable: choose and pick skills from the knowledge base; by
default one ship crew; then create a new ship and customize the crew members with the skills
they pick, as artifacts. Each skill gets an artifact anchor, like gamification. A game you use
to create your design-system workflow with the agents, with a gamification layer that shows
everything as a ship and crew members. Use the Convenium.Design skills — gamification, UI/UX,
Emil design, impeccable, motion. Plan only; don't implement."

| Intake field | Resolution (director-resolved) |
|---|---|
| What | A standalone web app, `shipyard/`, inside the Convenium.Design repo |
| Reference | ArkhEthos ship view (`ArkhEthos/src/features/ship/`, spec `docs/superpowers/specs/2026-10-19-ship-tour-design.md`, `DESIGN.md` › Ship tour) — reused **by port**, not by imitation: same owner, same DNA |
| Default content | One ship: *SS Full Run* (workflows.json default) with its seven crew (crew.json minus `gauge`) |
| Editable | Ships, crew characters, loadouts (artifacts on anchors), voyage stages, gates, doctrine, modules |
| Knowledge base | All 101 registry skills + doctrines + plugins + tools, generated from `library/` |
| Game layer | Artifacts with families/tiers/anchors, hull integrity (pre-flight), discovery codex, commissions, logbook |
| Output that matters | `ship.json`, `00-run-plan.md` (passes `verify.py --plan`), kickoff prompt |
| Ambition | "same UI" as the ArkhEthos ship → the floor is that scene's craft; timid is a failure |
| Paid generation | None. CC0 + already-owned crew GLBs + procedural artifacts |

### Acceptance criteria (encoding what the brief requires and rejects)

1. Opening Shipyard with no saved state shows **exactly one** ship — SS Full Run — with seven crew.
2. Any registry skill can be equipped on any crew member from the Armory; the result is
   visible on the 3D body (or the DOM anchor diagram without WebGL) within one frame of drop.
3. **Every skill has an artifact and an anchor.** `verify.py` fails if a registry skill does not
   resolve to an artifact (family from category, tier from state).
4. A new ship can be commissioned (blank, or cloned from any of the four library workflows),
   renamed, recruited (1–8 crew), equipped, voyage-planned and saved — without touching `library/`.
5. Export of a ship whose pre-flight is clean produces a `00-run-plan.md` that
   `python library/tools/verify.py --plan` reports **CLEAN**.
6. The gamification passes the ethics gate (§ 7.6) — no XP, streaks, timers, rankings, random rewards.
7. Reduced motion, no WebGL, phone width (360px) and keyboard-only all complete tasks 1–5.
8. The 2D console `ship/index.html` keeps working and stays true; `verify.py` CLEAN.

### Research basis (internal; no "current/trending" claim is made, so no live-URL lane)

- ArkhEthos files read 2026-10-30: `ShipPage.tsx`, `ArtifactRack.tsx`, `EcosystemMap.tsx`,
  `IntroTour.tsx`, `model.ts`, `schema.ts`, `walk.ts`, `useTourControls.ts`, `scene/*`,
  `data/{crew.ts,stations.ts,ship-kit.json}`, `DESIGN.md`, `PROGRESS-AND-DECISIONS.md` (2026-10-18…21).
- Convenium.Design: `AGENTS.md` (activation protocol, model rule, loop bounds),
  `library/registry/{crew,workflows,slots,skills.registry}.json`, `library/agents/*.md`
  (`access`, `routes`), `library/tools/{verify,project}.py`, `ship/` console.
- Skills applied while writing this plan (bodies read): `gamified-ui` (decision order, numbers,
  ethics), `ethical-gamification-systems` (truth labels, mission loop, mastery), `octalysis-gamification`
  (drive mix), `game-feel` (tiers; no shake/hit-stop in an editor). Routed for the build, one per
  phase (see `00-run-plan.md`): `project-scaffold`, `webgl-experience`, `gamified-ui`, `ui-ux`,
  `emil-design-eng`, `asset-director`, `impeccable`, `visual-qa`, `award-rubric`.

---

## 2. Art direction

**"A drydock at night."** The ArkhEthos bridge is the working ship; Shipyard adds the place where
ships are fitted out. Warm noir hull, cotton type, the cherry signal reserved for the primary
action. The new loud element is the **artifact**: small, crafted, family-coloured objects that
glow on a crew member's body — a lens on the brow, a wrench in the hand, a gyroscope circling the
head. They are the only saturated things on screen, so a loadout reads at a glance like a
character's gear in an RPG inventory, while the UI around it stays editorial and calm.

Three voices (Archivo decides, Newsreader explains, Inter operates) as in ArkhEthos. The Armory
is a cabinet of curiosities set in a grid; the Voyage planner is a navigator's chart (a horizontal
track with gate buoys); Pre-flight is a hull diagram whose panels light as checks pass.

Numbers: `DESIGN.md` (token block, layout grid, gamification, motion contract). Nothing in this
plan overrides them.

---

## 3. Concepts and data model

| Game term | System truth | Source |
|---|---|---|
| Ship | A workflow (trail) — stages, gates, crew | `workflows.json` (library ships, read-only) / `ship.json` (custom) |
| Crew member | A **character** (cosmetic) playing one **runtime agent** | `crew.json` + `library/agents/*.md` |
| Artifact | A registry **skill**, rendered as a family object on an anchor | `skills.registry.json` + `artifacts.json` |
| Anchor | Where on the body an artifact sits; bounded capacity | `artifacts.json › anchors` |
| Active artifact | The ONE skill body a stage opens | run-plan row `skill` |
| Gate | A decision the owner takes | workflows.json `gate` rows |
| Chart | A doctrine the ship carries | `library/doctrines/` |
| Module | A plugin / connector / tool on the ship | `plugins.json`, `tools.json` |
| Hull integrity | Pre-flight checks passed / applicable | § 8 |
| Logbook | Exports + imported `verify --plan` results + `run.json` phase counts | § 7 |

A crew member's **loadout** (up to 9 artifacts) is the set of skills that member *may* be handed;
a **stage** lights exactly one of them. This makes the one-body-per-phase rule a visible game rule
instead of a footnote: you may carry many tools, you work with one at a time.

Default loadouts for the library crew are derived, not invented, in this priority order:
(1) the skills the member activates in the library ship's stages (§ 9.1), (2) the agent's
`routes:` from `library/agents/<agent>.md`, (3) the slot defaults it owns (`slots.json`
`runtimeOwner`). Deduplicated, placed by `autoPlace`, capped at 9; overflow goes to the ship's
hold. Measured on 2026-10-30: the captain resolves to 12 skills (9 worn, 3 in the hold), the
engineer to 5, the strategist to 6 — so the default ship opens with a real choice for the captain.

Persistence: one versioned store in `localStorage` (`convenium.shipyard.v1`, zod-validated on
read, malformed → defaults + banner), plus file I/O (import/export `*.ship.json`), plus a
**dev-only** Vite middleware that saves to `shipyard/ships/<id>.ship.json` so ships can be
committed. No backend.

---

## 4. Screens and page sequence (with the media map)

Routes (React Router, hash history so `file://`-adjacent static hosting works):

| Route | Screen | Built from (ArkhEthos) |
|---|---|---|
| `#/` | **Hangar** — the fleet | Universe hangar ring (`UniverseCards.tsx`, hull GLBs) |
| `#/ship/:id/board` | **Boarding walk** — first-person tour | `IntroTour.tsx`, `walk.ts`, `useTourControls.ts`, `scene/*` |
| `#/ship/:id/bridge?member=` | **Bridge** — crew profile + rack + ecosystem map | `ShipPage.tsx` profile branch, `ArtifactRack.tsx`, `EcosystemMap.tsx`, `ShipCards.tsx`, `scene/Turntable.tsx` |
| `#/armory` (and as a drawer on the bridge) | **Armory** — the knowledge base | new |
| `#/ship/:id/voyage` | **Voyage planner** | new (ecosystem map's phase columns as the model) |
| `#/ship/:id/preflight` | **Pre-flight + Export** | new |
| `#/logbook` | **Logbook + Commissions** | ArkhEthos LVL/rewards-rail vocabulary, minus XP |

### 4.1 Hangar
| Section | Content | Media |
|---|---|---|
| Header | "SHIPYARD" (80px Archivo), one Newsreader line, "How it works?" pill (3 numbered points + one honest promise: "Nothing here runs an agent; it writes the plan a session runs.") | — |
| Fleet ring (3D) / grid (DOM) | Library ships as *Commissioned* (read-only lock glyph + "Template"), custom ships as *Drydock*. Each card: hull, name, class badge (skewed italic), crew chips, hull integrity ring, last export date | `ships/ship-a…e.glb` (CC0 Quaternius, from ArkhEthos) ; DOM: hull silhouette SVG per class |
| Primary action | **Commission a ship** (cotton button → cherry hover): dialog with *Blank* / *Clone from…* (4 library workflows + custom ships) / *Import ship.json* | — |
| Empty custom state | "Your drydock is empty. Clone SS Full Run to start." with the clone button | — |

Default state = one card visible: SS Full Run (Commissioned). Other library workflows appear
only inside the Commission dialog as templates (acceptance 1).

### 4.2 Boarding walk
Port of the ArkhEthos intro with the crew, stations and holo screens driven by the **ship's**
crew and loadout instead of the fixed seven. Holo screen lines become "Active: <artifact> ·
carries n". Stations 1–8 (§ 6.3); empty stations dark. "Skip to bridge" always visible.
Plays once per ship; replay from the bridge. Media: ship-kit GLBs, crew GLBs, ship-sound (opt-in).

### 4.3 Bridge (the screen the owner lives in)
| Column | Content |
|---|---|
| Left (320) | Turntable of the member **wearing their artifacts** (orbiting ones circle the head); crew rail (all members, pigment dot, artifact count); **Recruit** button; "Codex n of 101" line |
| Centre (1fr) | Identity card (ported) with **Edit** mode: name, species, essence, analogy, body (7 GLBs + stand-in), pigment (8 swatches), glyph; runtime agent shown as a fixed chip with its `access` (read-only / write) and model tier, labelled Verified |
| Right (360) | **Loadout rack** (replaces the 4 shelves): the anchor diagram — a body silhouette with 6 anchor groups (9 sockets), each socket empty or holding an artifact chip; below it the Skills slots the agent owns (ported SlotRow → now "swap artifact in slot") ; "Open Armory" button |
| Below | Ecosystem map (xyflow, ported): phases as columns, members as nodes, the stage's active artifact on the edge label; click a node → that member |

Drag an artifact chip from the Armory drawer onto a socket (or onto the 3D body — nearest
allowed anchor highlights); keyboard: focus artifact → `E` "Equip to…" menu of allowed anchors.

### 4.4 Armory (knowledge base)
| Region | Content |
|---|---|
| Filters (280) | search (id, name, description); category (11 families with counts); phase (always/diagnose/direct/prepare/build/verify/unrouted); tier (Core/Swappable/Library/Dormant); "Fits <member>" toggle (allowed for the selected member's agent without a warning) ; "Not yet inspected" |
| Grid | artifact cards: family glyph tile (pigment), artifact name, skill id (mono), tier rim + word, phase badge, one-line description, "Equipped by" avatars |
| Inspector (420) | 3D artifact on a slow turntable (DOM: large SVG glyph), name + lore, skill id, full registry description, phase, group, category, hosts, which agents route it, which slots it is a candidate in and "what changes", **Equip to…** (member × anchor), "Copy Skill path" (`library/skills/<category>/<id>/SKILL.md`) |
| Other tabs | **Charts** (doctrines: displayName, avoid-list), **Modules** (plugins, tools/connectors with status) — ship-level equips |

### 4.5 Voyage planner
A horizontal chart: stages as cards on a track, gates as buoys between them (A/B/C, fleet 0/1/2).
Each stage card: label, phase colour band, crew avatar, **active artifact** (one, chosen from the
member's loadout; or none), outputs, stop condition, parallel toggle, wave (fleet). Add / reorder
(drag + keyboard Alt+←/→) / duplicate / delete-with-undo. Templates insert the stage set of any
library workflow. The selected stage's inspector shows its run-plan row live (JSON preview).

### 4.6 Pre-flight + Export
Hull diagram (SVG, one panel per rule group) + the check list (§ 8): each row = rule, status
(pass / warn / block / n.a.), the exact reason and a **Fix** jump (to the stage / member / socket).
Export panel: `convenium_design` absolute path field (remembered locally) → buttons
**Download ship.json**, **Download 00-run-plan.md**, **Copy kickoff prompt**, and (dev server)
**Save to shipyard/ships/**. After export: "Paste the `verify.py --plan` output here" box → parsed
CLEAN / n problems → logbook (User-reported).

### 4.7 Logbook + Commissions
Per ship: export history, verify results, imported `run.json` (`phase_counts`, `artifact_hashes`
count) as Verified rows. Commissions rail: 8 tall cards (ArkhEthos rewards-rail anatomy) — GRANTED
with date, or the plain condition ("Export a ship with a clean pre-flight"). No levels.

---

## 5. Artifact system

Source: `data/artifact-families.json` (moves to `library/registry/artifacts.json` in T1).

- **Family** from the skill's `category` (11 families: Lens, Wrench, Gyroscope, Projector, Quill,
  Seal, Spyglass, Calipers, Gearbox, Codex, Orrery). Each family = one procedural mesh recipe
  (≤ 600 tris), one material (MeshStandard, metalness 0.6, roughness 0.35, emissive = pigment at
  0.6, bloom-eligible), one 24px SVG glyph for DOM.
- **Tier** from real state: Core (pipeline-active) → Swappable (slot candidate) → Library
  (unrouted, active) → Dormant (status ≠ active). Tier changes rim and word only; every tier is equipable.
- **Name**: override, else "{Family} of {Title}". The skill id is always shown under the name.
- **Per-skill variation** (so 31 gyroscopes are not identical): a stable hash of the skill id
  picks ring count / facet count / gem position from 4 variants per family and a ±12° hue-free
  tilt. Deterministic; no randomness at runtime.
- **Anchors** (bones verified in the GLBs): hand → `RightHand`, offhand → `LeftHand`,
  head → `Head`, back → `Spine02`, belt → `Hips` (3 slots spread 0.12 m), orbit → `Armature`
  at heightM + 0.1 m (2 slots, radius 0.45 m). Capacity 9 per member.
- **Any anchor accepts any family** — capacity is the only hard limit. The family's
  `defaultAnchor` / `autoPlace` order decide where an artifact lands when placed automatically.
  Pose by anchor: hand/offhand *held* (scale 1), head/back/belt *worn* (0.7), orbit *floating* (0.8).
- **Ship's hold**: spare artifacts carried by the ship and worn by nobody (unlimited). Overflow of
  a default loadout lands here; a stage can activate only a *worn* artifact (PF-03), so the hold
  is where the owner trades gear between crew.
- **Attaching** uses the ArkhEthos pattern: `createPortal(mesh, bone)` on the SkeletonUtils clone,
  so artifacts follow the baked working loop. Stand-in body: anchors at fixed offsets on the capsule.
- **Active glow**: on the Bridge, the artifact that the *selected stage* activates orbits at
  0.25 rps with the family rim; in the boarding walk, each member's first-stage active artifact.

### 5.1 Equip rules (warnings, not locks — the owner decides; pre-flight reports them)

| Rule | Severity at equip | Why (source) |
|---|---|---|
| Anchor full | refuse drop, reason shown, offer "Swap" or "Send old one to the hold" | capacity is the game's one hard limit |
| Duplicate skill on the same member | refuse | meaningless |
| Build-phase skill on a `read-only` agent | warn "This agent cannot write files" | `access: read-only` in `library/agents/*.md` |
| Skill phase ≠ member's agent phase (and not `always`/`unrouted`) | note "Off-route" | agent Activation › Phase |
| Skill not in agent `routes:` | note "Off-route" (counts toward the commission) | `routes:` is informational |
| Dormant skill | warn "Manual skill — invoked explicitly" | registry `status` |

---

## 6. 3D scene (webgl-experience: it explains *who carries what*; DOM is complete without it)

1. **Port, then generalise.** Copy the ArkhEthos scene modules (see `ARCHITECTURE.md` › Port map),
   replace `CREW` constants with the ship's crew, `screenLines` with loadout lines, and keep every
   number from ArkhEthos `DESIGN.md` › Ship tour / scene upgrade.
2. **Crew bodies**: the 7 owned GLBs (no `gauge` body exists — `fleet-measurer` wears the procedural stand-in until a body is made); a recruit wears any of them tinted by a pigment rim light
   (no texture recolour) or the procedural stand-in.
3. **Stations**: the 7 ArkhEthos positions + `gauge: [0, 0, -3.6], yaw 0, prop 'console'`
   (centre aisle, between the dais and the entrance; re-check collision in `walk.ts`). A ship
   assigns members to stations 1–8; the captain (design-director) defaults to 1.
4. **Turntable**: wearing artifacts; frameloop `demand` when idle.
5. **Artifact inspector canvas**: a second small canvas only when the inspector is open
   (or a shared `View` from drei to avoid a second WebGL context — preferred).
6. **Fallbacks**: no WebGL / context lost / reduced motion / `?2d` → the DOM bridge with the anchor
   silhouette and SVG glyphs; boarding walk skipped.

---

## 7. Gamification (gamified-ui decision order, ethical-gamification-systems, octalysis)

7.1 **Target behaviour**: export a ship that passes `verify --plan`; later log its `run.json`.

7.2 **Drives** (Octalysis L1, white-hat only): *Empowerment of Creativity & Feedback* (strong —
equipping and seeing the body change, pre-flight feedback), *Ownership & Possession* (strong —
your ships, your recruits, your codex), *Development & Accomplishment* (moderate — hull integrity,
commissions from real outcomes), *Epic Meaning* (light — the ship metaphor, the captain's welcome).
Black-hat drives (scarcity, loss, unpredictability): **none**.

7.3 **Loop** (one line, also in `DESIGN.md`): open a ship → equip / plan → pre-flight shows the
consequence → export → import run.json → logbook. The next goal is always on screen.

7.4 **Mechanics** (fewest that close the loop): hull integrity ring (progress), commissions
(achievements for firsts), codex discovery count, logbook. Numbers: `DESIGN.md` › Gamification.

7.5 **States**: 0 checks applicable (blank ship: "Add a crew member to begin"); all blocked; stale
library; retired artifact; commission granted while offline (stored, shown on next visit, no toast).

7.6 **Ethics gate** (any failure blocks the build): no XP / levels / streaks / timers / countdowns /
expiry; no random or paid rewards; no locked basics (every skill equipable from minute one);
no ranking of skills, agents or ships; every edit reversible (undo stack 50, Reset ship, Restore
default ship); celebrations only on outcomes and only once; sound off by default; truth label on
every number (Verified computed / Simulated narrative / User-reported paste).

---

## 8. Pre-flight — the real rules as hull checks

| ID | Check | Sev | Source |
|---|---|---|---|
| PF-01 | A `design-director` member is aboard, and every director stage is `parallel: false` | block | AGENTS.md activation 5; verify.py |
| PF-02 | Every stage has ≤ 1 active skill, and it is a registry id | block | activation 1; verify.py |
| PF-03 | Every stage's active skill is equipped by that stage's member | block | game rule (makes 02 visible) |
| PF-04 | Every stage has ≥ 1 output and a stop condition | block | verify.py |
| PF-05 | Stage ids unique | block | verify.py |
| PF-06 | Parallel stages: ≤ 2 read-only gatherers per wave (non-fleet); fleet: ≤ 1 writing engineer per site per wave | block | activation 6 |
| PF-07 | A `build`-phase stage's member is not a `read-only` agent | block | agent `access` |
| PF-08 | Trail `full` has gates A, B, C in that order; `abridged` has C; `fleet` has C | block | START-HERE gates |
| PF-09 | A design-system stage (outputs DESIGN.md) precedes the first build stage — n.a. when `scoped: true` (retrofit, fleet: a repair on a built site) | block | design-system rule; ARCHITECTURE-ESSENTIALS (retrofit) |
| PF-10 | A verify stage by an agent that built nothing in this ship (finish review) precedes Gate C | block | loop bound 1 |
| PF-11 | The critic's model tier ≥ the builder's (opus ≥ sonnet) | warn | model rule |
| PF-12 | No stage is a plan written by a reader-tier agent | warn | model rule |
| PF-13 | A run-plan stage is first | warn | activation 1 |
| PF-14 | Off-route / dormant / retired artifacts equipped | info / warn / block(retired) | § 5.1 |
| PF-15 | Ship saved against the current KB hash | warn | stale banner |

Pure functions in `src/domain/preflight.ts`, each with unit tests built from the four library
workflows converted per § 9.1 (all four must pass clean — a false positive on a library
workflow is a bug; a library workflow the table cannot convert is a T3 blocker to report).

---

## 9. Export contracts

- **ship.json** — `schemas/ship.schema.json` (`shipyard.ship.v1`).
- **00-run-plan.md** — the `templates/00-run-plan.md` prose header + fenced json:
  `run` = ship name, `trail`, `convenium_design` = the path field, `phases[]` from stages in order
  (`id`, `agent` = member's agent or `director`, `skill` = activeSkill, `skill_path` =
  `<convenium_design>/library/skills/<category>/<skill>/SKILL.md`, `model` from the agent file,
  `inputs`, `outputs`, `stop`, `parallel`), `gates` from gate rows. A "Crew characters" table
  after the block (cosmetic, ignored by verify). Golden-file tests: exporting each library
  workflow ship and running `verify.py --plan` on it in CI (`npm run test:plans`).
### 9.1 Library workflow → ship conversion

`workflows.json` stages may name several crew, carry no skill and no stop condition, and `build`
lists no artifacts. A ship stage needs exactly one member, ≤ 1 active skill, outputs and a stop.
The conversion is an **authored table** in `shipyard/src/domain/conversion.ts` (one per library
workflow, unit-tested), not a heuristic. Multi-crew stages split into one stage per member, in
crew order. SS Full Run, the default ship:

| Stage | Member | Active skill | Outputs | Stop |
|---|---|---|---|---|
| run-plan | captain | `olympus-design-director` | `.olympus/00-run-plan.md` | `verify.py --plan` CLEAN |
| dna | strategist | `product-marketing` | `brand-dna.json`, `BRAND.md`, `00-brief.md` | brand-dna.json validates against `library/schemas/brand-dna.schema.json` |
| audit | analyst | `ux-evidence-audit` | `01-audit.md` | evidence table returned; director ranks five problems |
| Gate A | — | — | — | brief approved |
| direction | captain | `concept-studio` | `02-concepts.md` | one direction defended in writing |
| critique | critic | `award-rubric` | `03-critique.md` | scored; no redesign |
| Gate B | — | — | — | direction approved |
| assets | producer | `asset-director` | `05-asset-manifest.md` | every asset has source, rights, fallback |
| plan | captain | none | `06-build-plan.md` | art direction, palette, type scale as numbers, media map |
| design-system | captain | `impeccable` | `PRODUCT.md`, `DESIGN.md`, `design.json` | no TBD in the token block |
| build | engineer | `apple-design` (craft slot default) | project source | build-plan tasks done; typecheck + lint green |
| author-qa | engineer | `visual-qa` | `07-qa.md` | evidence for desktop, phone, states, reduced motion |
| finish-review | critic | `visual-qa` | `10-finish-review.md` | scored against `DESIGN.md` |
| metrics | metrics | `design-analytics` | `08-metrics.md` | event contract + readout plan |
| Gate C | — | — | — | owner accepts |
| handoff | captain | none | `09-handoff.md` | handoff delivered |

One deliberate difference from `workflows.json`: there, `verify` lists critic + metrics for
`07-qa.md` and `10-finish-review.md` together; the conversion gives `07-qa.md` to the builder,
because loop bound 1 in `AGENTS.md` defines it as the author's own pass. Record this in
`PROGRESS-AND-DECISIONS.md`; if the owner prefers the registry's reading, change the table, not the rule.
SS Abridged, SS Mobile Retrofit (`scoped`) and SS Mobile Fleet (`scoped`, waves) get their tables in
T3 by the same method; `mobile-app-shell` and `visual-qa` (their `skills`) are the active skills of
their build and review stages.

- **Kickoff prompt** — `templates/prompts/`-style: the project path, "start from this run plan",
  the read order, and the equipped-but-inactive artifacts listed as *available on request* (never
  pre-loaded: agents preload nothing).
- **Proposals** (optional, T12): "Propose as library change" exports a patch-style Markdown with
  a `crew.json` entry draft / `artifacts.json` override draft for a reviewed commit. Never written
  by the app.

---

## 10. Accessibility and input

Keyboard: every drag has a menu equivalent (`E` equip, `Del` unequip, `Alt+←/→` reorder stages,
`U`/`Ctrl+Z` undo). Sockets are buttons with names ("Belt slot 2: Calipers of the Approved
Direction, Core"). Live region announces equip/unequip/check changes (polite). Focus visible per
token. The 3D canvas is `aria-hidden`; the DOM carries all state. Touch: long-press 300ms picks up
an artifact; sockets 48px. Colour never alone (tier word + rim style; check icon + word).

---

## 11. Tasks (implement in order; each ends green: typecheck, lint, unit, the task's e2e)

| # | Task | Done when |
|---|---|---|
| T0 | Read this plan + `DESIGN.md`, `verify.py --plan shipyard/plan/00-run-plan.md` CLEAN | CLEAN printed |
| T1 | **Data pipeline**: `library/registry/artifacts.json` (from `data/`), `project.py shipyard` target writing `shipyard/public/data/knowledge-base.json` (skills+artifact resolution, agents with access/model/routes/phase, crew, workflows, slots, doctrines, plugins, tools, `sourceHash`); `verify.py`: KB fresh, every skill → artifact, override names contain family; docs: add `shipyard/public/data/` to the generated list in `ARCHITECTURE-ESSENTIALS.md` / `CLAUDE.md` | `project.py all && verify.py` CLEAN; a removed skill makes verify fail |
| T2 | **Scaffold** `shipyard/` Vite + React + TS (pinned versions = ArkhEthos's), routes, tokens CSS from `DESIGN.md`, fonts, zod KB loader, store + persistence + undo, import-media script | `npm run dev` shows Hangar with SS Full Run from the KB |
| T3 | **Domain**: `ship.ts` (library→ship conversion, default loadouts), `loadout.ts` (equip rules), `preflight.ts`, `export.ts` (+ golden tests; 4 library ships export CLEAN through verify.py) | unit + `test:plans` green |
| T4 | **Port the scene**: ShipInterior, Decor, Atmosphere, HoloScreen, Hotspots, CrewMember, Turntable, Walker, walk/tour controls, sound; parametrised by ship crew; 8th station | boarding walk runs on SS Full Run like ArkhEthos |
| T5 | **Artifacts in 3D + DOM**: 11 family meshes, variants, bone attachment, glyph SVGs, inspector view | all 101 render in the Armory inspector; equip shows on body |
| T6 | **Bridge**: ported identity card with edit, crew rail + recruit, loadout rack with anchor diagram, slot swaps, ecosystem map | acceptance 2 |
| T7 | **Armory**: filters, virtualised grid, inspector, charts, modules, drag + keyboard equip | equip from Armory to any member, every input mode |
| T8 | **Hangar + Commission + Voyage planner** | acceptance 4 |
| T9 | **Pre-flight + Export + Logbook + Commissions** | acceptance 5, ethics gate checklist ticked |
| T10 | **Motion pass** (emil-design-eng; numbers in `DESIGN.md` › Motion contract) | every row demonstrated, reduced-motion variants verified |
| T11 | **Finish pass** (impeccable: run `node .claude/skills/impeccable/scripts/context.mjs` first; detector clean) + states | all required states reachable |
| T12 | Optional: proposals export | patch Markdown validates by hand |
| T13 | Author QA (`visual-qa`) → `plan/07-qa.md`, screens 1440/1024/390/360, keyboard, reduced motion, no-WebGL | 07-qa.md written with evidence |
| T14 | Independent finish review (`award-rubric`, critic) → `plan/10-finish-review.md`, scored against `DESIGN.md`; ≤ 2 fix cycles (loop bound 1) | score + defects recorded; Gate C asked |

Out of scope: running agents from the app, cloud sync, multi-user, new paid media, replacing
`ship/index.html`, changing the pipeline itself.
