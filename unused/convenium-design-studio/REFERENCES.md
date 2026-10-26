# Convenium.Design Studio — reference set

The artifact this program never had.

The P0–P5 program declared the old look *"evidence and anti-reference"*
(`LOADOUT-PLAN.md:11`) and then wrote `DESIGN.md` — 487 lines specifying a visual world — with
no positive reference anywhere. `reference-deconstruction` exists in this repo only as a slot
candidate sold to clients; it was never run on the product. An agent asked to author a visual
world against nothing converges on its priors, and its priors are the median of everything it
has seen. That is the mechanism of "AI slop", and it is why eleven passing thresholds coexist
with a 62/100 read.

This file is the anchor. **Every rule in `DESIGN.md` must trace to a line here, or be marked
`PRIOR` and defended on its own.**

Method: `reference-deconstruction`. Observation is separated from interpretation. Transferable
logic only — no distinctive expression is copied, and the "do not copy" column is binding.

---

## The six references

Chosen on one criterion: **professional instruments a competent person uses all day**, dense
with state, dark, local-feeling. Not marketing sites. Convenium.Design Studio is a workbench; the
reference class is workbenches.

### 1. Linear — *thesis: darkness is the medium, and structure is carried by lift, not by lines.*

Observed ([DesignMD](https://designmd.cc/benchmarks/linear), [awesome-design-md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md)):

- A four-step **surface ladder** above the canvas: `#010102` canvas → `#0f1011` → `#141516` →
  `#18191a` → `#191a1b`, each with a hairline (`#23252a`, strong `#34343a`).
- The stated rule: **"The dark canvas IS the whitespace. Sections separate by lift onto
  surface-1 panels, not by gaps in white."**
- **"Depth is carried by surface ladder + hairline borders. The brand resists drop shadows on
  dark almost entirely."**
- One chromatic accent (`#5e6ad2`) on mark, focus ring, primary action. *"Don't introduce a
  second chromatic accent."* *"Don't add atmospheric gradients or spotlight cards."*
- Four-step text ramp: `#f7f8f8` → `#d0d6e0` → `#8a8f98` → `#62666d`.
- Radius scale 4 / 6 / 8 / 12 / 16, with buttons fixed at 8. *"Don't pill-round CTAs."*
- Display tracks aggressively negative (−3px at 80px ≈ 4% of size); at ≤24px tracking relaxes
  to normal; eyebrows take **positive** tracking.

**Interpretation.** The first read of the contact sheet was "Convenium.Design has hairlines and no
ladder." **That is wrong and worth recording as wrong** — `styles.css` ships a four-step
ladder (`--bg #0B0C0E` → `--surface #131518` → `--surface-2 #1A1D21` → `--surface-3 #22262B`)
and 69 rules use it. Measured, Convenium.Design's ladder is *wider* than Linear's end to end (1.286
canvas→top vs Linear's 1.197).

The actual difference is the **canvas**:

| | canvas L | first lift L | luminance multiple of the first step |
|---|---:|---:|---:|
| Linear | 0.00033 | 0.00513 | **15.5×** |
| Convenium.Design | 0.00366 | 0.00741 | **2.0×** |

Convenium.Design's canvas is **11× brighter than Linear's**. Linear can say "the dark canvas IS the
whitespace" because its canvas is effectively pure black, so the very first lift off it reads
unmistakably as a surface. Convenium.Design's canvas is a mid-dark grey that *competes* with the panels
resting on it: the contrast ratios are respectable on paper and the figure/ground still reads
flat, because ground is not dark enough to recede. Contrast passes AA on text while the
composition stays flat — the failure T4 cannot see.

The fix is one token, not a repaint: take the canvas toward true black and the existing ladder
does the work it was already built to do.

### 2. Raycast — *thesis: the row is the atom, and recognition speed beats decoration.*

Observed ([Raycast API](https://developers.raycast.com/api-reference/user-interface),
[design notes](https://aiskill.market/blog/inside-raycasts-design-system)):

- A tiny component vocabulary — `List`, `Detail` (+ metadata panel), `ActionPanel` — and
  everything is built from it. One list shape, everywhere.
- Palette is *"dark-first and restrained … cooler, sharper neutrals that read as precise and
  technical"*, not warm dark.
- *"Rows are compact and uniform for quick scanning under arrow-key navigation, selection
  states are clear and high-contrast … hierarchy favours speed of recognition over decorative
  flourish."*
- Every action carries a visible keyboard shortcut in the panel that offers it.

**Interpretation.** Convenium.Design has at least six different list shapes (`project-item`,
`project-tab`, `system-list-item`, `knowledge-skill`, `agent-profile`, `history-row`,
`architecture-agent`), each invented in its own P4 slice. Raycast's discipline is that a list
is a list.

### 3. Things — *thesis: one skeleton, and only the content region changes.*

Observed: a permanent left rail, a single content column, a single detail treatment. Moving
between areas changes what is *in* the column, never the column.

**Interpretation.** This is the defect the contact sheet made visible and no threshold could:
Convenium.Design's eight views are eight different layouts — 3-column shell (Work), full-width document
(Pipeline map), 2-column workbench (Loadouts), 2-column rail+grid (Playground), full-bleed
list (Agents), 3-column browser (Library), 2-column (Oracle), single column (Runs). There is
no shared spine, so the product reads as eight products.

Measured in `styles.css` — seven independent top-level column systems:

```
.workspace-frame       248px  minmax(0,1fr)  280px
.configuration-layout  minmax(0,1.8fr)  minmax(280px,.7fr)
.loadout-workbench     minmax(0,1fr)
.playground-workbench  minmax(300px,.72fr)  minmax(0,1.4fr)
.knowledge-layout      220px  minmax(0,1fr)
.oracle-layout         minmax(0,1.45fr)  minmax(330px,.7fr)
.agent-registry        repeat(2,minmax(0,1fr))
```

Across those and their breakpoint variants the left rail is 190, 220, 226, 248, 252, 300, 330
and 340px wide. **There is no shared measure anywhere in the product.** No threshold could see
this: every one of those layouts passes T1–T11 individually.

### 4. Figma's right-hand properties panel — *thesis: a dense parameter surface is a two-column grid, held.*

Observed ([Figma Help](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)):
a fixed label column and a fixed control column, sections separated by rules, labels optional
and consistent when shown, every control on the same right edge.

**Interpretation.** Convenium.Design's eight slot rows are *almost* this and break alignment between
sections — Design DNA, Brief, Tools and Budget each invent their own internal layout inside
the same editor. The parameter surface is the product; it should be one grid down the whole
column.

### 5. Ableton Live — *thesis: density is a setting, and one visual temperature holds across every panel.*

Observed ([redesign case study](https://nenadmilosevic.co/ableton-live-redesign/)): a Detail
Level control governs how much UI is drawn; regardless of setting, every device panel shares
one temperature, one control vocabulary, one label treatment.

**Interpretation.** Convenium.Design's Agents view ships full-saturation neon portraits against a cool
grey product — a second visual temperature that T6 cannot detect, because T6 counts font
families. Two of those portraits are held back by a CSS `saturate(.45)`, which is the
product apologising for its own asset.

### 6. LangGraph Studio — *thesis: the graph earns its space by showing what happened, not what is possible.*

Observed ([DeepWiki](https://deepwiki.com/langchain-ai/langgraph-studio/5.2-graph-visualization)):
the topology renders the path a run *actually took*; state is inspectable per node; runs
rewind and replay from a checkpoint.

**Interpretation.** Convenium.Design's Pipeline map is draggable furniture. `/api/events` already carries
phase, agent and token counts per event and `runPhaseTraces()` already computes the trace —
the data for a run overlay exists and nothing draws it.

---

## Principle matrix — five, no more

| # | Principle | Evidence | Why it works | Transfer to Convenium.Design | Do not copy |
|---|---|---|---|---|---|
| P1 | **The ground must recede.** Structure comes from lift; the canvas has to be dark enough that the first lift reads as a surface. | Linear's canvas at L=0.00033 vs Convenium.Design's at 0.00366 — a 15.5× first step against Convenium.Design's 2.0× | Figure/ground survives at any contrast ratio; AA text contrast and compositional hierarchy stop being the same question. | Take `--bg` toward true black. The existing four-step ladder is already correct and already used in 69 rules — it is the ground that is wrong, not the ladder. | Linear's exact hexes, its lavender, its Linear Display face. |
| P2 | **One skeleton; only the content region changes.** | Things; Raycast's List/Detail | The product reads as one instrument. Navigation costs no re-orientation. | One shell: persistent rail + one content column + one optional inspector. All eight views adopt it. | Things' rail iconography or its warmth. |
| P3 | **One row shape, one panel shape, one parameter grid.** | Raycast's three-component vocabulary; Figma's label/control columns | A small vocabulary used everywhere reads as intent; six vocabularies read as accretion. | Collapse the six list shapes to one `row` with slots. The loadout editor becomes one label/control grid top to bottom. | Raycast's shortcut-chip styling. |
| P4 | **One temperature, and assets obey it.** | Ableton; Linear's single accent | A single chromatic voice makes state legible because colour means something. | Resolve the portraits at the asset level to the product's temperature; delete the apologetic `saturate()`. | Ableton's chrome, skeuomorphic knobs, or its accent. |
| P5 | **A view of a process must show the process that ran.** | LangGraph Studio | The diagram becomes an instrument instead of an illustration; it earns its screen. | Overlay the last run's phase/agent/token trace on the pipeline nodes from data already on `/api/events`. | LangGraph's node chrome or its layout algorithm. |

---

## Contradictions between references

- **Density vs. air.** Raycast and Ableton are maximally dense; Linear's *product* is dense but
  its *marketing* is airy. Convenium.Design has been reading the airy half. **Resolution: Convenium.Design is a
  workbench — take Raycast's density in lists and Linear's ladder for structure.** The current
  build's problem is not that it is too dense; the contact sheet shows Runs and Oracle are
  ~80% empty. It is under-dense *and* flat, which is the worst pair.
- **Ableton's detail-level control** implies user-tunable density. **Rejected for Convenium.Design** —
  one more setting to test and no evidence anyone wants it. Pick one density and hold it.
- **Linear resists shadows entirely; Figma's panels use one.** **Resolution: keep the existing
  single shadow token.** Depth comes from the ladder; the shadow stays for overlays only.

## Asset implications

- The five agent portraits must be resolved to one temperature (P4). This is asset production,
  not CSS, and it is the first of the three items the previous program carried forward.
- No new decorative media. T10 (zero decorative media/ornament) stays at 0 — P1 replaces
  ornament with structure, which is the point.

## Motion / WebGL candidates — candidates, not requirements

- **Candidate:** the run overlay (P5) revealing phase-by-phase as an event stream arrives.
  Bounded by the existing ≤150ms motion budget; must be a state change, not a flourish.
- **Rejected outright:** WebGL anywhere. Nothing here needs it, and `LOADOUT-PLAN.md` already
  requires an explicit value/performance/accessibility test it would not pass.

## Keep / transform / avoid

**Keep** — these passed and are not in question: the rem type scale and 13px floor; AA contrast
including 1.4.11 boundaries; 36/44px targets; ≤4 radii; the ≤150ms motion budget; reduced-motion
honoured; undo instead of confirmation; honest tool-availability reporting.

**Transform** — P1 surface ladder; P2 one shell; P3 one row/panel/parameter vocabulary;
P4 one temperature including assets; P5 the map shows the run.

**Avoid** — a second chromatic accent; atmospheric gradients and spotlight cards; drop shadows
as the depth mechanism; pill-rounded primary actions; any per-view layout invention; and the
uppercase-tracked label register as the *default* secondary style — Linear's evidence is that
positive tracking belongs on eyebrows only, not on every field label, column header and
caption in the product.

---

Sources are linked inline. Observations are quoted from those sources or from
`metrics/shots/contact-sheet-before.png`; everything under "Interpretation" is this program's
reading and is open to challenge at the V2 critique.
