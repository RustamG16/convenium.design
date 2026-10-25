---
id: ui-001
title: Radial department map — UI and design reference
source: src-0005 — https://www.instagram.com/reel/DbYh2P-MQnj/ (alassafi.ai)
evidence: 49 captured frames, library/frames/src-0005/
captured: '2026-08-21'
filed: '2026-08-28'
intent: reference for mapping THIS system — copy the UI and design, not the content
---

# Radial department map — UI reference

Saved because you want **this UI and this design** for a map of your own system. The
content of the original (137 sales/marketing agents) is not the point and is not
recorded here — [the taxonomy analysis lives in the MNEMOSYNE record](../../sources/src-0005.md).

Everything below is **observed from the captured frames**, not inferred from the caption.

---

## The whole screen

A single dark canvas holding one force-directed graph. No sidebar, no chrome, no cards.
The graph *is* the page.

- **Background** — flat desaturated indigo / periwinkle (roughly `#4a4a6a`–`#565478`),
  no gradient, with a very faint dot-matrix texture and sparse white specks like stars.
  Deliberately low contrast so the nodes carry all the brightness.
- **Nav** — one small centred pill at the top: `MAP` · `DASHBOARDS` · `CHART`. Tiny,
  wide-tracked uppercase. The active segment sits in a lighter rounded chip. It floats
  over the canvas rather than sitting in a bar.
- **Pagination** — a bare `‹` `›` pair centred at the bottom. No labels.

## The graph

**Seven clusters arranged radially around a common centre.** Each cluster is its own
small tree that grows outward from the middle.

- **The centre** is not a node. It is a loose **particle cloud** — dozens of tiny
  unconnected dots — reading as a diffuse core rather than a labelled hub. That restraint
  is what makes the composition work; a big labelled circle in the middle would flatten it.
- **Each cluster has a hub node**: a circle with a thin concentric ring around it and a
  small line icon inside. The hub is where the cluster's branches converge.
- **Branches** run hub → intermediate nodes → leaf nodes, two to three levels deep,
  spreading outward and fanning wider at the edge.
- **Nodes** are pale near-white filled circles with a soft outer glow. Leaf nodes are
  small; hubs are ~3× larger. Links are thin, pale, low-opacity straight lines.

## Labels

Two distinct type treatments, and the contrast between them does a lot of the work:

| Element | Treatment |
|---|---|
| Department name | Large **serif**, uppercase, very wide letter-spacing, low-opacity white. Sits *outside* the cluster, at the canvas edge. |
| Department subtitle | Tiny lowercase, heavily tracked, dim — a short `·`-separated word list (`replies · calls · closing · pipeline`) |
| Node label | Small **sans**, medium weight, bright white, set directly beneath or beside its node |

Serif for the taxonomy, sans for the instances. Departments read as *places*; nodes read
as *things*.

## Colour and state

The palette is almost entirely monochrome-on-indigo. **Colour is state, not decoration.**

- **Idle** — all clusters pale white/grey at low opacity.
- **Active/selected** — one cluster picks up an accent colour and everything else stays
  dim. Observed: `DEALS` in hot magenta (label, hub ring, and the small connector dots
  along its branches all shift together); `OPERATIONS` in cyan/teal. Back Office showed
  yellow, Customer showed violet, Sales showed white-blue.
- **Accent dots** — small solid-colour dots sit at branch junctions in the active
  cluster's colour, while the node bodies stay pale. The accent traces the *path*, not
  the nodes.

So: one accent per department, applied only when that department is focused, and applied
to the connective tissue rather than the objects.

## Zoom

Zooming in is a genuine level change, not a scale-up:

- Department serif labels become huge, very low-opacity **watermarks** behind the graph
  (a giant `ES` fragment of `DEALS` sitting behind the nodes).
- Node labels appear at readable size with their icons.
- Faint wide **arc lines** sweep across the background — orbital guides suggesting the
  radial structure continues past the viewport.
- Small orange accent dots hang off individual nodes.

## The detail drawer

Selecting a node opens a panel with a thin left icon rail (3 icons) and a `›` collapse
handle. Section headers are small, wide-tracked, uppercase, dim. Content is normal-weight
white. Observed sections, in order:

```
BREAKS INTO        solid-outline chips — the children of this node
BUILDS ON          dashed-outline chips — the dependencies of this node
WHAT IT REPLACES   one boxed paragraph
THE LADDER         3-row table: HUMAN-LED / HUMAN-ASSISTED / FULLY AUTONOMOUS
THE HUMAN          paragraph — what a person still owns
TAKE THE SKILL     a bordered card linking to the runnable thing
YOUR STATUS        a progress element with a warm gradient fill
```

**The chip-border convention is the single best detail here.** Solid border = decomposes
into. Dashed border = depends on. Two relationship types, distinguished by border style
alone, no legend needed.

**`THE LADDER` is the second.** The same capability described three times at three
autonomy levels, so the row tells you not just what the node is but how much of it you
can hand over today.

---

## Applying this to a map of your own system

The structure maps onto what is already here with almost no translation:

| Original | Yours |
|---|---|
| 7 departments | 7 agents — convenium-design, zeus, hephaestus, hermes, athena, calliope, themis |
| Central "company brain" particle cloud | `library/` + `.mnemosyne/` — the shared knowledge every agent reads |
| Cluster hub node | The agent's `skill-index` catalog |
| Branch/leaf nodes | Individual skills |
| `BREAKS INTO` / `BUILDS ON` chips | Skill routing and chaining rules from `ROUTING.md` |
| `THE LADDER` | Autonomy grading — borrowed and already flagged in `src-0005.yaml` |
| `WHAT IT REPLACES` | What the skill does instead of you |
| Accent-per-department | One accent per agent |

Two things to carry over deliberately:

1. **Keep the centre unlabelled.** The particle cloud works because it is atmosphere. A
   labelled "KNOWLEDGE BASE" circle would turn an elegant map into an org chart.
2. **Colour only on focus.** Seven simultaneous accents would be noise. The design earns
   its calm by staying grey until you ask a question of it.

## Honest limits

Captured from a phone filming an LG monitor — colour values are approximations shifted by
screen and camera, and small type is often unreadable. Structure, hierarchy, layout and
state behaviour are reliable; exact hex values, fonts and spacing are not. Treat the hex
codes above as starting points to be re-picked, not as a palette.

## Frames worth reopening

| Frame | Shows |
|---|---|
| `opt_dense_0018.jpg` | Full seven-cluster composition, `DEALS` active in magenta |
| `opt_dense_0006.jpg` | `OPERATIONS` active in cyan, top nav visible |
| `opt_dense_0030.jpg` | Zoomed state — node labels, icons, arc guides, watermark type |
| `opt_dense_0042.jpg` | The detail drawer, all sections legible |
