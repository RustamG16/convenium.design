# 05 — Asset manifest: Convenium Shipyard

Written 2026-10-30. **No paid generation is authorised by this plan.** Everything Shipyard needs
already exists (owner-generated crew, CC0 kit and sound) or is procedural (artifacts, hull
diagram, glyphs). A new crew body (e.g. for `gauge` / `fleet-measurer`) or a generated artifact
image needs a new, explicit owner request with a quoted price before any job.

## What the owner provides

A local checkout of **ArkhEthos** (the source of the files below). The import script copies them:

```
node shipyard/scripts/import-arkhethos-media.mjs --from <path-to-ArkhEthos>
```

It copies `public/media/{crew,ship-kit,ship-sound,ships}/` into `shipyard/public/media/`, checks
every file's byte count and sha256 against this table, refuses on a mismatch, and writes
`shipyard/public/media/LICENSES.md` from the licence column. Total 55 files, 12,410,762 bytes.

Rights: the crew GLBs and sheets were generated for the owner (ArkhEthos `.olympus/05-asset-manifest.md`,
ledger 2026-10-19) — fine to reuse in the owner's own Convenium.Design repo; do **not** relicense
them as CC0. Kit, hulls and sound are CC0 1.0.

## Procedural (no file, built in code)

| Asset | Recipe | Where |
|---|---|---|
| 11 artifact families | `data/artifact-families.json` › `mesh`; ≤ 600 tris; 4 hash-picked variants each | `src/scene/artifacts/families.tsx` |
| 11 family glyphs | 24px SVG, 1.5px stroke, cotton + family pigment fill at 0.2 | `src/scene/artifacts/glyphs.tsx` |
| Anchor silhouette | SVG body outline with 9 sockets (DOM loadout + no-WebGL) | `features/bridge/AnchorDiagram.tsx` |
| Hull diagram | SVG, one panel per pre-flight rule group | `features/preflight/HullDiagram.tsx` |
| Hull silhouettes (DOM hangar) | 5 SVG side profiles traced from the 5 hull GLBs' bounds | `features/hangar/FleetGrid.tsx` |
| Stand-in body | capsule + visor in the member pigment (ported from ArkhEthos `CrewMember.tsx`) | `src/scene/CrewMember.tsx` |

## Files to import (measured 2026-10-30 in the ArkhEthos checkout at `4de85a8`)

### `crew/` — Owner-generated (Higgsfield gpt_image_2_5 sheet → sam_3_3d → Meshy rig), ArkhEthos ledger 2026-10-19; owner-owned, not CC0

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `crew/analyst-sheet-1280.webp` | 94614 | `774520a04fed6c0b` | to import |
| `crew/analyst-sheet-640.webp` | 37290 | `fd173b39248c7f5c` | to import |
| `crew/analyst.glb` | 1928124 | `512ba13f37d9a193` | to import |
| `crew/captain-sheet-1280.webp` | 48918 | `fffed1911fe9f422` | to import |
| `crew/captain-sheet-640.webp` | 19042 | `d30c1fe5cf508065` | to import |
| `crew/captain.glb` | 1382788 | `7c63fe85bc2b9a74` | to import |
| `crew/critic-sheet-1280.webp` | 45088 | `b09eb1726d188734` | to import |
| `crew/critic-sheet-640.webp` | 18310 | `0a884b6dd8289658` | to import |
| `crew/critic.glb` | 819544 | `c0033b7ae2cbd39d` | to import |
| `crew/engineer-sheet-1280.webp` | 67804 | `b01bc7337898e02f` | to import |
| `crew/engineer-sheet-640.webp` | 26866 | `d1b7b455a8cf2555` | to import |
| `crew/engineer.glb` | 1260860 | `e0f600b1553c3bff` | to import |
| `crew/metrics-sheet-1280.webp` | 48724 | `8bbfcb1cda57b11b` | to import |
| `crew/metrics-sheet-640.webp` | 20220 | `5bfef691d4b0c7bd` | to import |
| `crew/metrics.glb` | 1314740 | `ea8b14d3855ccdf2` | to import |
| `crew/producer-sheet-1280.webp` | 109132 | `7f25bd2bbae2e8de` | to import |
| `crew/producer-sheet-640.webp` | 42008 | `420fa8b7721bd755` | to import |
| `crew/producer.glb` | 2149056 | `158f7342e5fa2d7a` | to import |
| `crew/strategist-sheet-1280.webp` | 52194 | `44f8db015110c0a6` | to import |
| `crew/strategist-sheet-640.webp` | 20014 | `8adc1b323405d515` | to import |
| `crew/strategist.glb` | 1262080 | `91bb45ddc6dec702` | to import |

### `ship-kit/` — CC0 1.0 — Kenney Modular Space Kit 1.0, Space Kit 2.0, Space Station Kit; Quaternius Sci-Fi Essentials Kit (see ship-kit.json)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ship-kit/airlock-frame.glb` | 27788 | `bbae2a7a7d60f08e` | to import |
| `ship-kit/cargo-barrels.glb` | 11564 | `dbfc993acfae3dd2` | to import |
| `ship-kit/conduit-cables.glb` | 19792 | `057730d914252e1f` | to import |
| `ship-kit/console-terminal.glb` | 4868 | `b0c52ed2d5edd73a` | to import |
| `ship-kit/container-tall.glb` | 7912 | `7ac7e4a601579da3` | to import |
| `ship-kit/corridor-ceiling.glb` | 17872 | `c660954190004c10` | to import |
| `ship-kit/corridor-floor.glb` | 4808 | `905fc2fca44f8cd6` | to import |
| `ship-kit/corridor-wall.glb` | 20668 | `b6f215c461d9d701` | to import |
| `ship-kit/crate-large.glb` | 210564 | `a3b2df8cec9be565` | to import |
| `ship-kit/crew-seat.glb` | 5112 | `4b138bad93a01254` | to import |
| `ship-kit/floor-grate.glb` | 6912 | `938ecdb92feb917b` | to import |
| `ship-kit/hatch.glb` | 5372 | `f1ca2c60b654f637` | to import |
| `ship-kit/lectern.glb` | 14784 | `db6f7fb5175bbf66` | to import |
| `ship-kit/locker.glb` | 54436 | `85cdfa8ac2b37b7e` | to import |
| `ship-kit/pipe-ring.glb` | 4820 | `a17f88c99b115498` | to import |
| `ship-kit/pipe.glb` | 4200 | `f57466c4ec327538` | to import |
| `ship-kit/railing.glb` | 4036 | `eaed10ab3dc2f617` | to import |
| `ship-kit/readout.glb` | 11496 | `2a435dc3d80a6088` | to import |
| `ship-kit/support-pillar.glb` | 18824 | `32cb78bf5c5673d6` | to import |
| `ship-kit/tool-rack.glb` | 123000 | `f274182318111f40` | to import |
| `ship-kit/wall-display.glb` | 6692 | `2e88c23c3fce936d` | to import |
| `ship-kit/wall-panel.glb` | 41532 | `c04339a440f6afb4` | to import |
| `ship-kit/window-frame.glb` | 8372 | `aaef78bd6215dc5a` | to import |
| `ship-kit/workbench.glb` | 93976 | `0cabd4eef88ac879` | to import |

### `ship-sound/` — CC0 1.0 — Kenney Sci-Fi Sounds / Interface Sounds (see ship-sound/README.md)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ship-sound/README.md` | 563 | `e92aa0dcdb5eb32b` | to import |
| `ship-sound/click.ogg` | 4275 | `adcd1f4adc35f1b4` | to import |
| `ship-sound/hum.ogg` | 99760 | `d7deee8d7217ce63` | to import |
| `ship-sound/servo.ogg` | 119024 | `1527944e16eb14b4` | to import |
| `ship-sound/weld.ogg` | 201216 | `0fdc474d93f209de` | to import |

### `ships/` — CC0 — Quaternius ship hulls (ArkhEthos PROGRESS 2026-10-18)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ships/ship-a.glb` | 57168 | `ae5f5d76b6475543` | to import |
| `ships/ship-b.glb` | 76056 | `c75a34f7c7d80f13` | to import |
| `ships/ship-c.glb` | 90056 | `232f741f38ab9a35` | to import |
| `ships/ship-d.glb` | 149300 | `129f41f243db7c0f` | to import |
| `ships/ship-e.glb` | 116528 | `cba7d6040d8a468b` | to import |
