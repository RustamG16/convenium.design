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
| 11 artifact families | `library/registry/artifacts.json` › `mesh`; ≤ 600 tris; 4 hash-picked variants each | `src/scene/artifacts/families.tsx` |
| 11 family glyphs | 24px SVG, 1.5px stroke, cotton + family pigment fill at 0.2 | `src/scene/artifacts/glyphs.tsx` |
| Anchor silhouette | SVG body outline with 9 sockets (DOM loadout + no-WebGL) | `features/bridge/AnchorDiagram.tsx` |
| Hull diagram | SVG, one panel per pre-flight rule group | `features/preflight/HullDiagram.tsx` |
| Hull silhouettes (DOM hangar) | 5 SVG side profiles traced from the 5 hull GLBs' bounds | `features/hangar/FleetGrid.tsx` |
| Stand-in body | capsule + visor in the member pigment (ported from ArkhEthos `CrewMember.tsx`) | `src/scene/CrewMember.tsx` |

### Glyph review (2026-11-04)

Recipe: 24 px viewBox, 1.5 px stroke, cotton stroke, family pigment fill at 0.2. The recipe is applied once, in the shared `FamilyGlyph` wrapper (viewBox 0 0 24 24, `strokeWidth` 1.5, `stroke="var(--cotton, #edebdd)"`, `fillOpacity` 0.2, round joins and caps). The pigment is a prop; every call site passes `a.pigment` from the artifact record, which derives from `library/registry/artifacts.json`, so no pigment is hard-coded in `glyphs.tsx`. The 11 shape keys equal the 11 registry family ids. All path coordinates sit within 0-24. Per glyph: lens, wrench, gyroscope, projector, quill, seal, spyglass, calipers, gearbox, codex, orrery - each conforms (default size 24, no per-shape stroke or fill overrides). Minor note, not a violation: open strokes (quill, gearbox ticks) take the 0.2 fill over their implied area. No change made to `glyphs.tsx`.

## Files imported (manifest measured 2026-10-30 at ArkhEthos `4de85a8`; re-measured here 2026-11-04)

### `crew/` — Owner-generated (Higgsfield gpt_image_2_5 sheet → sam_3_3d → Meshy rig), ArkhEthos ledger 2026-10-19; owner-owned, not CC0

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `crew/analyst-sheet-1280.webp` | 94614 | `774520a04fed6c0b` | imported, verified 2026-11-04 |
| `crew/analyst-sheet-640.webp` | 37290 | `fd173b39248c7f5c` | imported, verified 2026-11-04 |
| `crew/analyst.glb` | 1928124 | `512ba13f37d9a193` | imported, verified 2026-11-04 |
| `crew/captain-sheet-1280.webp` | 48918 | `fffed1911fe9f422` | imported, verified 2026-11-04 |
| `crew/captain-sheet-640.webp` | 19042 | `d30c1fe5cf508065` | imported, verified 2026-11-04 |
| `crew/captain.glb` | 1382788 | `7c63fe85bc2b9a74` | imported, verified 2026-11-04 |
| `crew/critic-sheet-1280.webp` | 45088 | `b09eb1726d188734` | imported, verified 2026-11-04 |
| `crew/critic-sheet-640.webp` | 18310 | `0a884b6dd8289658` | imported, verified 2026-11-04 |
| `crew/critic.glb` | 819544 | `c0033b7ae2cbd39d` | imported, verified 2026-11-04 |
| `crew/engineer-sheet-1280.webp` | 67804 | `b01bc7337898e02f` | imported, verified 2026-11-04 |
| `crew/engineer-sheet-640.webp` | 26866 | `d1b7b455a8cf2555` | imported, verified 2026-11-04 |
| `crew/engineer.glb` | 1260860 | `e0f600b1553c3bff` | imported, verified 2026-11-04 |
| `crew/metrics-sheet-1280.webp` | 48724 | `8bbfcb1cda57b11b` | imported, verified 2026-11-04 |
| `crew/metrics-sheet-640.webp` | 20220 | `5bfef691d4b0c7bd` | imported, verified 2026-11-04 |
| `crew/metrics.glb` | 1314740 | `ea8b14d3855ccdf2` | imported, verified 2026-11-04 |
| `crew/producer-sheet-1280.webp` | 109132 | `7f25bd2bbae2e8de` | imported, verified 2026-11-04 |
| `crew/producer-sheet-640.webp` | 42008 | `420fa8b7721bd755` | imported, verified 2026-11-04 |
| `crew/producer.glb` | 2149056 | `158f7342e5fa2d7a` | imported, verified 2026-11-04 |
| `crew/strategist-sheet-1280.webp` | 52194 | `44f8db015110c0a6` | imported, verified 2026-11-04 |
| `crew/strategist-sheet-640.webp` | 20014 | `8adc1b323405d515` | imported, verified 2026-11-04 |
| `crew/strategist.glb` | 1262080 | `91bb45ddc6dec702` | imported, verified 2026-11-04 |

### `ship-kit/` — CC0 1.0 — Kenney Modular Space Kit 1.0, Space Kit 2.0, Space Station Kit; Quaternius Sci-Fi Essentials Kit (see ship-kit.json)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ship-kit/airlock-frame.glb` | 27788 | `bbae2a7a7d60f08e` | imported, verified 2026-11-04 |
| `ship-kit/cargo-barrels.glb` | 11564 | `dbfc993acfae3dd2` | imported, verified 2026-11-04 |
| `ship-kit/conduit-cables.glb` | 19792 | `057730d914252e1f` | imported, verified 2026-11-04 |
| `ship-kit/console-terminal.glb` | 4868 | `b0c52ed2d5edd73a` | imported, verified 2026-11-04 |
| `ship-kit/container-tall.glb` | 7912 | `7ac7e4a601579da3` | imported, verified 2026-11-04 |
| `ship-kit/corridor-ceiling.glb` | 17872 | `c660954190004c10` | imported, verified 2026-11-04 |
| `ship-kit/corridor-floor.glb` | 4808 | `905fc2fca44f8cd6` | imported, verified 2026-11-04 |
| `ship-kit/corridor-wall.glb` | 20668 | `b6f215c461d9d701` | imported, verified 2026-11-04 |
| `ship-kit/crate-large.glb` | 210564 | `a3b2df8cec9be565` | imported, verified 2026-11-04 |
| `ship-kit/crew-seat.glb` | 5112 | `4b138bad93a01254` | imported, verified 2026-11-04 |
| `ship-kit/floor-grate.glb` | 6912 | `938ecdb92feb917b` | imported, verified 2026-11-04 |
| `ship-kit/hatch.glb` | 5372 | `f1ca2c60b654f637` | imported, verified 2026-11-04 |
| `ship-kit/lectern.glb` | 14784 | `db6f7fb5175bbf66` | imported, verified 2026-11-04 |
| `ship-kit/locker.glb` | 54436 | `85cdfa8ac2b37b7e` | imported, verified 2026-11-04 |
| `ship-kit/pipe-ring.glb` | 4820 | `a17f88c99b115498` | imported, verified 2026-11-04 |
| `ship-kit/pipe.glb` | 4200 | `f57466c4ec327538` | imported, verified 2026-11-04 |
| `ship-kit/railing.glb` | 4036 | `eaed10ab3dc2f617` | imported, verified 2026-11-04 |
| `ship-kit/readout.glb` | 11496 | `2a435dc3d80a6088` | imported, verified 2026-11-04 |
| `ship-kit/support-pillar.glb` | 18824 | `32cb78bf5c5673d6` | imported, verified 2026-11-04 |
| `ship-kit/tool-rack.glb` | 123000 | `f274182318111f40` | imported, verified 2026-11-04 |
| `ship-kit/wall-display.glb` | 6692 | `2e88c23c3fce936d` | imported, verified 2026-11-04 |
| `ship-kit/wall-panel.glb` | 41532 | `c04339a440f6afb4` | imported, verified 2026-11-04 |
| `ship-kit/window-frame.glb` | 8372 | `aaef78bd6215dc5a` | imported, verified 2026-11-04 |
| `ship-kit/workbench.glb` | 93976 | `0cabd4eef88ac879` | imported, verified 2026-11-04 |

### `ship-sound/` — CC0 1.0 — Kenney Sci-Fi Sounds / Interface Sounds (see ship-sound/README.md)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ship-sound/README.md` | 563 | `e92aa0dcdb5eb32b` | imported, verified 2026-11-04 |
| `ship-sound/click.ogg` | 4275 | `adcd1f4adc35f1b4` | imported, verified 2026-11-04 |
| `ship-sound/hum.ogg` | 99760 | `d7deee8d7217ce63` | imported, verified 2026-11-04 |
| `ship-sound/servo.ogg` | 119024 | `1527944e16eb14b4` | imported, verified 2026-11-04 |
| `ship-sound/weld.ogg` | 201216 | `0fdc474d93f209de` | imported, verified 2026-11-04 |

### `ships/` — CC0 — Quaternius ship hulls (ArkhEthos PROGRESS 2026-10-18)

| File | Bytes | sha256 (first 16) | Status |
|---|---|---|---|
| `ships/ship-a.glb` | 57168 | `ae5f5d76b6475543` | imported, verified 2026-11-04 |
| `ships/ship-b.glb` | 76056 | `c75a34f7c7d80f13` | imported, verified 2026-11-04 |
| `ships/ship-c.glb` | 90056 | `232f741f38ab9a35` | imported, verified 2026-11-04 |
| `ships/ship-d.glb` | 149300 | `129f41f243db7c0f` | imported, verified 2026-11-04 |
| `ships/ship-e.glb` | 116528 | `cba7d6040d8a468b` | imported, verified 2026-11-04 |

## Verification record (2026-11-04)

Measured by the asset-producer from the files actually in `shipyard/public/media/` (bytes and full sha256, computed independently, not copied):

- 55 files, 12,410,762 bytes, excluding `LICENSES.md`. Matches the manifest total.
- Every file matches its manifest row on bytes and on the first 16 hex of sha256. No mismatch.
- Nothing in `shipyard/public/media/` is outside the manifest (only `LICENSES.md` is extra, and it is generated).
- No generation, purchase or download was run for this record.

### Provenance of the import

The media was imported from a **read-only snapshot of ArkhEthos revision `4de85a8`**, not the owner's current checkout (`4db3cf3`). In `4db3cf3` the 7 crew GLBs have been meshopt-recompressed and would fail this manifest's bytes and sha256.

### Open question for the owner (Gate C), not decided here

The 7 crew GLBs in this manifest total 10,117,192 bytes (about 10.1 MB of the 12.4 MB set). The meshopt-recompressed versions in the owner's checkout are reported to total about 5.4 MB (reported, not re-measured here), which would bring the set to roughly 7.7 MB. Adopting them would require: re-measuring this manifest (bytes, sha256 for 7 files, new totals); re-checking that the bone names the anchors rely on (Head, LeftHand, RightHand, Spine02, Hips, Armature) survived recompression; and confirming the loader decodes meshopt (drei `useGLTF` does by default, so no new package should be needed). The owner decides at Gate C; until then the lossless set above stands.

### Full sha256

| File | Bytes | sha256 |
|---|---|---|
| `crew/analyst-sheet-1280.webp` | 94614 | `774520a04fed6c0b1f349ba475034a19234b5a41cf4d846acc9ebaaf5daed6d2` |
| `crew/analyst-sheet-640.webp` | 37290 | `fd173b39248c7f5c4d6659dd8963b3787477a4fcc90e1134e7180541c343aeaa` |
| `crew/analyst.glb` | 1928124 | `512ba13f37d9a193be71c49bfd5fffa211ed3398a9755b1f4511ca85dea22ecf` |
| `crew/captain-sheet-1280.webp` | 48918 | `fffed1911fe9f42206387cb2b4731c1b0684bca9b2d25a317dc32bd9725e8059` |
| `crew/captain-sheet-640.webp` | 19042 | `d30c1fe5cf5080654cf62c0209f70c227113b0f57caa6be31eae59ac79fe0109` |
| `crew/captain.glb` | 1382788 | `7c63fe85bc2b9a7497acacae04a6dd0aa8a774a48f794e6c65bea0072cb7f0c3` |
| `crew/critic-sheet-1280.webp` | 45088 | `b09eb1726d1887342d716d73758e27521dbfff44154c33870f585b65cde4d0be` |
| `crew/critic-sheet-640.webp` | 18310 | `0a884b6dd8289658b8eb1d787098cb1da329ba7a961222096525a9ca87c354cb` |
| `crew/critic.glb` | 819544 | `c0033b7ae2cbd39d2706726913143c28b5f25aeae65ed1b5d867d4bf5ccc6d9d` |
| `crew/engineer-sheet-1280.webp` | 67804 | `b01bc7337898e02fdd2f1a5ca0345e9a6dd23ffa5e5141fd370d5d0ca821b76d` |
| `crew/engineer-sheet-640.webp` | 26866 | `d1b7b455a8cf255572cfc13d36cd2218997d87577c38688c34dd80f14cfadd91` |
| `crew/engineer.glb` | 1260860 | `e0f600b1553c3bffd79320edc18023eced1650de85c88ad56e3dab3629574f5d` |
| `crew/metrics-sheet-1280.webp` | 48724 | `8bbfcb1cda57b11bbd66a10a7dd4b946f31e7ee75bf17237a54993a09f7ffe04` |
| `crew/metrics-sheet-640.webp` | 20220 | `5bfef691d4b0c7bd945944f3a3826ad3bb051bf317e133f9dfef399c43c3b014` |
| `crew/metrics.glb` | 1314740 | `ea8b14d3855ccdf214d2e5e5ff5a1ad938c1666db413538300d3ed0d020d3d63` |
| `crew/producer-sheet-1280.webp` | 109132 | `7f25bd2bbae2e8def55e431ec342598a92ebc4cb12f2aed75c51f9cf259a5b66` |
| `crew/producer-sheet-640.webp` | 42008 | `420fa8b7721bd7559dab0a2782cdc73e9f878899669da5bdce38156e5a22ae39` |
| `crew/producer.glb` | 2149056 | `158f7342e5fa2d7adc9127f58bc64b3b5ba237bf69fdf4d3ce98c4043e9e3beb` |
| `crew/strategist-sheet-1280.webp` | 52194 | `44f8db015110c0a64be7cc6535bfaeea8d9dded942028b80327c9e72bec44a98` |
| `crew/strategist-sheet-640.webp` | 20014 | `8adc1b323405d515c7957c638bb03949bd42bb4b953f7862e988c2eb78d7e8c6` |
| `crew/strategist.glb` | 1262080 | `91bb45ddc6dec70276458e072cbf791605d52c6e4d3a1b3ff9fceaca64a76456` |
| `ship-kit/airlock-frame.glb` | 27788 | `bbae2a7a7d60f08e0fb322f5318d31920d99128ae4856994a2221f322255c5f5` |
| `ship-kit/cargo-barrels.glb` | 11564 | `dbfc993acfae3dd29957f39fc0509a30be88782190c6ff32e93616345d698b3a` |
| `ship-kit/conduit-cables.glb` | 19792 | `057730d914252e1f148c87a973df1e3cc8b9e32b0d85a4c2245c30992f50bd75` |
| `ship-kit/console-terminal.glb` | 4868 | `b0c52ed2d5edd73aac1908eb10d416f54127809bb2d7f43f06d47e1a4478fb90` |
| `ship-kit/container-tall.glb` | 7912 | `7ac7e4a601579da3bbbd0066689010a90f4516e0df2a3379335fc61f5809057f` |
| `ship-kit/corridor-ceiling.glb` | 17872 | `c660954190004c10ac1e28d6f832c7f03e3cbf8269a0ec80b84a2e7665efc1cc` |
| `ship-kit/corridor-floor.glb` | 4808 | `905fc2fca44f8cd6d4487ecc979ba330f61b87d34973e2cbe3ff5cc1ce8a490a` |
| `ship-kit/corridor-wall.glb` | 20668 | `b6f215c461d9d701a7cc3611d8299c6479293b1b39d863c7cc833e2a7f161d34` |
| `ship-kit/crate-large.glb` | 210564 | `a3b2df8cec9be565e105cec423a3e4ee4bc53fd0444719bba49c4a7051bc6928` |
| `ship-kit/crew-seat.glb` | 5112 | `4b138bad93a012549d48109d3f2218ed5e24d4e64c4b8d49a50ef51d7577123d` |
| `ship-kit/floor-grate.glb` | 6912 | `938ecdb92feb917bdd38c4a1203f69cdd3e844a73abd55b56c0a6a7c0ccfcccc` |
| `ship-kit/hatch.glb` | 5372 | `f1ca2c60b654f637f51b0a5ce393ed5e08868a4897f7a61401653c2e2bf73e48` |
| `ship-kit/lectern.glb` | 14784 | `db6f7fb5175bbf668dcdb9ebf31b9fc47faf09e3ae4d3da395e103cb1c845174` |
| `ship-kit/locker.glb` | 54436 | `85cdfa8ac2b37b7e09cf0c21cebe7bd2d233e9bad21648c8a83648d3f527e48d` |
| `ship-kit/pipe-ring.glb` | 4820 | `a17f88c99b115498cdd9e49abe5d07f7e8414500505bd8191a1767445aa4b1d8` |
| `ship-kit/pipe.glb` | 4200 | `f57466c4ec32753812f73c8616cf241784895b26c693acb2a0c32b0f7ac46596` |
| `ship-kit/railing.glb` | 4036 | `eaed10ab3dc2f617a35838056278cb8df86fa488d0f230e305abb443c0d70b8d` |
| `ship-kit/readout.glb` | 11496 | `2a435dc3d80a60887495a80c0048e8f33052bd291d686b42731654d1246d4e9c` |
| `ship-kit/support-pillar.glb` | 18824 | `32cb78bf5c5673d6bacaa7b56d40370e1202520ca21bab68c802bb80e453de10` |
| `ship-kit/tool-rack.glb` | 123000 | `f274182318111f400429d44dca607092352c77692db62055a586fcf43eaee8a5` |
| `ship-kit/wall-display.glb` | 6692 | `2e88c23c3fce936d425812495662e861a294fb0ba2f9d2ca68ba5eef22a737d2` |
| `ship-kit/wall-panel.glb` | 41532 | `c04339a440f6afb423cb6ebadea1fbfbb8ca5350cc317254c890fd0eff607f25` |
| `ship-kit/window-frame.glb` | 8372 | `aaef78bd6215dc5a12243d1dcdff0341866b6f2fef48b44a882aa8d3a8dc5b11` |
| `ship-kit/workbench.glb` | 93976 | `0cabd4eef88ac87900c9c4496d9b5045e217b7ad5f69c226b97a33a632f36f2d` |
| `ship-sound/README.md` | 563 | `e92aa0dcdb5eb32b49b8dd72279db54dedb4006d7248f8495ff786c4a732d7b2` |
| `ship-sound/click.ogg` | 4275 | `adcd1f4adc35f1b41bc1b5bbefeff7aa44f2f3f0d96d3199b544140c7c1e761c` |
| `ship-sound/hum.ogg` | 99760 | `d7deee8d7217ce63aab802ad7365a59cacfd243392dc1bd03b0a9d454aa494df` |
| `ship-sound/servo.ogg` | 119024 | `1527944e16eb14b48ee03fe3e7ce6aae94262833a4e1f83928d451a7414fe4e1` |
| `ship-sound/weld.ogg` | 201216 | `0fdc474d93f209debf1fc4ea77765a669dcb7676db31b4d8a0a509685bccf374` |
| `ships/ship-a.glb` | 57168 | `ae5f5d76b647554327b2210980bc265943f00d9547a6839a6eb9ebdd6d1ded4f` |
| `ships/ship-b.glb` | 76056 | `c75a34f7c7d80f13d3ff7d55e176afb04a10220e81a7d87c0842dc9b04fd1e77` |
| `ships/ship-c.glb` | 90056 | `232f741f38ab9a3595b44e011280ec06a0530c879cca16913fe1d5a8bb433288` |
| `ships/ship-d.glb` | 149300 | `129f41f243db7c0f599159cecb5f4c4287ab81d3bfb580471ca55e4385aa279b` |
| `ships/ship-e.glb` | 116528 | `cba7d6040d8a468be1fcb31d6e76b391106a3bc2fbdebbf41dbab5b38811ba13` |

---

## v2: paid-asset quotes (2026-11-08). **None is approved; each needs its own owner yes**

The owner's rule (`CLAUDE.md` rule 6) is that each asset is approved one at a time against the
recorded quote. The quotes below come from Higgsfield `generate_3d` with `get_cost: true`; no job
was submitted. The account balance when quoted was 439.17 credits (plan "plus"). Each asset
generated must also:

- pass the import budgets (≤ 30k triangles, ≤ 2 MB GLB);
- get a row in `LICENSES.md` ("owner-generated, Higgsfield, <date>").

| # | Asset | Why | Model and params | Quote | Status |
|---|---|---|---|---|---|
| A1 | Hull replacing `ships/ship-e.glb` (critic n2) | ship-e is an upright rigged figure, not a hull | `tripo_3d`, text, `face_limit` 10000 | **5 credits** | **Closed, not needed (T17):** ship-e is no longer displayed; every ship shows one of the CC0 hulls a–d. 0 credits |
| A1′ | the same, alternative | Use if Tripo's hull reads badly | `meshy_v6_text_to_3d`, `mode` full, lowpoly, 8000 polys | **25 credits** | **Closed, not needed** (with A1) |
| A2 | One neutral rigged recruit body (`fleet-measurer`, Forge-created agents; pigment-tinted) | Recruits are a capsule stand-in today | `meshy_v6_text_to_3d`, `mode` full, a-pose, `enable_rigging`, 1.7 m, 20k polys | **25 credits** | **Open, waiting for the owner's yes.** Recruits keep the capsule stand-in until then. Prototype against the existing clips before approving any more bodies |
| A3 | Arena environment (course, buoys, harbour) | The Regatta scene | Remote Blender scene builder (3D Jutsu) from its curated catalog | **No get_cost quote available** for scene-builder runs | **Built procedurally instead (T24):** `src/scene/Arena.tsx` (water, lanes, buoys, finish posts, the CC0 hulls). 0 credits. A scene-builder harbour stays optional and needs its own yes |
| A4 | Per-agent bodies | Only on a separate request | `meshy_v6_text_to_3d` rigged | 25 credits each (A2 rate) | Not requested |

**Excluded:**

- Seedance video and Spline, as decided in `PRODUCT.md § v2`.
- The procedural fallbacks: the arena buoys and course, and the existing capsule stand-in. These
  ship whatever the answers are, so v2 is complete with **0 credits** spent.

**Ledger at T24 (2026-11-08):** 0 credits spent in v2. A1 and A1′ were closed at no cost, and A3 was
built procedurally. A2 is the one open item and waits for the owner's yes. A4 has not been requested.
