# DESIGN — Convenium Shipyard

Committed as numbers before any layout code (the design-system rule in `AGENTS.md`). Shipyard
wears the same Convenium DNA (dark register) as the ArkhEthos ship view it is modelled on —
`ArkhEthos/DESIGN.md` › "Numeric token contract", "Ship tour" and "Ship tour: scene upgrade" —
so the two read as one product family. Deviations from ArkhEthos are marked **Δ**.

## Direction and material

Warm noir hull, cotton type, one red signal. Archivo 900 uppercase decides, Newsreader explains,
Inter operates. Depth from tonal steps and hairlines, not shadows. Artifacts are the only
place colour is loud: each artifact family carries a **family pigment** used as data colour
(the artifact's glow, its socket ring, its icon tint) — never for buttons, focus or status.

## Token block

| Token | Value |
|---|---|
| Ink / noir / surface / elevated / raised | #0F0C0C / #1B1717 / #221D1D / #2B2525 / #342D2D |
| Text (cotton) / muted / border / hairline | #EDEBDD / #A8A29A / #3D3535 / rgba(237,235,221,0.09) |
| Cherry / maroon / chili / chili-soft | #810100 / #630000 / #D73B3E / #E5595C |
| Focus | chili-soft #E5595C, 3px outline, 3px offset |
| Crew pigments | from `library/registry/crew.json` `pigment` (default crew); recruits pick from the 8-swatch set #D9A441 #86C2A8 #C79FDC #93AEDB #E39B95 #D8B66E #E9DCC5 #9FC7C0 |
| **Δ** Family pigments (artifacts) | see `data/artifact-families.json`; all ≥ 4.5:1 on #1B1717 as 12px label text |
| Tier rims | Core: cotton 2px solid · Swappable: cotton 1px solid · Library: cotton 1px dashed · Dormant: muted 1px dotted. Tier always also named in text |
| Display / prose / UI font | Archivo Variable (wght 900, uppercase) / Newsreader Variable / Inter Variable — self-hosted via @fontsource, OFL |
| Hangar title desktop/tablet/mobile | 80 / 60 / 44px, line-height 0.98 |
| Page title (ship name, member name) | 56 / 44 / 36px |
| Section head | 32 / 26px uppercase Archivo, line-height 1.02 |
| Card / panel title | 22 / 20px Newsreader 400 |
| Body / label / mono stat | 16px at 1.55 / 12px Inter 500 tracking 0.06em / 13px Inter tabular-nums |
| Spacing | 4, 8, 12, 16, 24, 40, 48, 80px |
| Radius | controls 8px, cards/panels 10px, sockets 999px, pills 999px |
| Hit target | ≥ 44 × 44px; anchor sockets 48px on touch |
| Content width / reading width | 1440px / 68ch |
| Panel width | 360px (rack, card); **Δ** Armory drawer 420px |
| Motion: micro / panel / camera; stagger | 160 / 240 / 700ms; 45ms per card |
| Ease (default) | cubic-bezier(0.16,1,0.3,1) |
| **Δ** Ease (equip arrival) | `back.out(1.6)` (GSAP) — the only overshoot in the product |

Contrast: cotton on noir 14.6:1; muted on noir 7.0:1; chili-soft on noir 4.97:1. Colour never
carries tier, status or validity alone — each also has a word and a shape.

## Layout grid

| Breakpoint | Bridge (crew profile) | Armory | Voyage planner |
|---|---|---|---|
| ≥ 1200px | 320 turntable+rail / 1fr identity / 360 rack | 280 filters / 1fr grid (min card 200px) / 420 inspector | 1fr stage track + 360 stage inspector |
| 768–1199 | two columns, turntable above card, rack below | filters as a sheet, grid + inspector as drawer | track full width, inspector as drawer |
| < 768 | stacked; rack becomes bottom sheet (snap 40% / 92%); anchors as list | grid 2 columns; inspector full-screen sheet | vertical stage list; inspector full-screen sheet |

## Gamification (committed numbers — gamified-ui, decision 5)

Loop: **open a ship → equip / plan → pre-flight shows what changed → export → (later) import run.json → logbook entry**.
Next goal is always on screen: the first failing pre-flight check, or "Export" when clean.

| Element | Rule |
|---|---|
| Hull integrity (readiness) | `passed / applicable` checks from `plan/06-build-plan.md` § Pre-flight; shown as a 0–100 ring + list. Blockers cap it at 99 and disable Export. Truth: Verified (computed) |
| Discovery | "Codex n of 101" artifacts inspected (opening an artifact's inspector counts once per id). Truth: Simulated (it measures curiosity, not skill). No reward beyond the line |
| Commissions (achievements) | 8 firsts, each tied to an outcome: first custom ship · first recruit · first artifact equipped off-route · first clean pre-flight · first export · first `verify --plan` result imported · first run.json logged · a ship with ≥ 3 logged runs ("Proven hull"). Truth: Verified for export/import ones, User-reported for the verify-result paste |
| Feedback tiers | small 150–200ms (equip, socket, toggle) · medium 400–700ms (check turns green, commission) · large 900ms max (clean pre-flight, first time per ship only) |
| Forbidden (ethics gate) | XP, levels, streaks, timers, countdowns, loot boxes, random rewards, locked basics, rankings, "at risk" wording, sound or confetti on routine actions |

## Motion contract (impeccable · emil-design-eng · apple-design · animate)

| Event | Motion | Reduced motion |
|---|---|---|
| Hover artifact card | lift 2px + family glow 0→0.35, 160ms | glow only, 120ms opacity |
| Pick up (drag start) | card scales 1.04, shadow-less tonal raise, 120ms; the ghost follows the pointer 1:1 (no lag) | no scale |
| Valid anchor under drag | socket ring pulses 1.0→1.12 at 1.6Hz, label shows anchor name | static highlighted ring + text "Drop to equip" |
| Equip (drop) | 3D: artifact flies along a 0.4m arc to the bone anchor, 520ms `back.out(1.6)`; socket flash 80ms; 2D: chip lands in the socket 240ms | instant place, 120ms opacity |
| Invalid drop | ghost returns 240ms ease-out; 2px horizontal shake ×2, 180ms; reason line under the socket | return instantly + reason line |
| Unequip | artifact fades to 0 + scale 0.85, 160ms; undo toast 8s | opacity only |
| Active-in-stage | the one active artifact orbits its anchor at 0.25 rps with a 3px family-pigment rim; others rest | no orbit, rim only |
| Pre-flight check flips | row tick count-up + ring fill 400ms default ease | final state |
| Clean pre-flight (first per ship) | ring closes, hull lights sweep stern→bow 900ms, one cotton line "Cleared for departure" | final state + line |
| Camera (scene) | 700ms between stations, interruptible; inherits ArkhEthos walk numbers (eye 1.6m, fov 62, walk 2.2 m/s, Shift ×2) | cut |
| Turntable | 1 rpm, orbit polar 0.9–1.6 rad, no pan | 0 rpm |

All motion is interruptible; nothing blocks input; hit-stop and screen shake are not used
(game-feel: reserved for impact, and an editor has none).

## 3D scene

Inherits ArkhEthos "Ship tour" + "scene upgrade" tables verbatim (interior kit, lighting, bloom
threshold 0.95 intensity 0.9, vignette 0.55, reflector 0.4 at quality high; phones < 768px: dpr 1,
no postprocessing, billboard sheets for non-neighbour crew). **Δ** Stations: 8 positions (adds a
gauge bay for `fleet-measurer`); custom ships with fewer crew leave stations dark, not removed.
**Δ** Artifacts: procedural meshes (≤ 600 triangles each, one shared material per family,
instanced when > 4 visible), attached to bones (see build plan § Anchors).

## Performance

Initial shell ≤ 300KB gzip JS; three/R3F, xyflow and GLBs lazy. Scene assets ≤ 14MB total (12.4MB measured for the imported set, 2026-10-30),
≤ 5MB before first interactive frame (captain + two neighbours first). DPR ≤ 1.5 desktop / 1 phone.
60fps desktop / 30fps phone target; PerformanceMonitor drops to low once per visit.
Armory grid virtualised above 60 cards; search responds < 50ms on 101 items.

## Required states

Empty (no custom ships; ship with 1 crew; member with 0 artifacts), loading KB, stale KB (KB
`sourceHash` ≠ ship's `kbHash` → banner "Library changed since this ship was saved" + diff),
missing skill (artifact whose skill left the registry → greyed "Retired" chip, kept until removed),
no WebGL / context lost (DOM bridge), storage unavailable (session-only banner), import invalid
(zod error list), export blocked (first blocker named), undo toast.
