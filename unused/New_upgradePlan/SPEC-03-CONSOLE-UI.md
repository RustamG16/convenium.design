# Spec 03 — Apollo Atlas

> **2026-09-15 scope correction:** [PRODUCT-ARCHITECTURE.md](PRODUCT-ARCHITECTURE.md) supersedes this document as the product-level UI specification. Atlas survives as the evidence/lineage mode inside **System Node Control** and as an optional Connections mode in Knowledge. It is not the home page, the only product surface, or the primary navigation model. Preserve the evidence graph, inspector, provenance, responsive list equivalent and truthful states below; implement them only after the Oracle, Projects/Plan, Playground and Results journeys are understandable.

Revised 2026-09-07. Proposal only; no implementation authorized. Supersedes the concentric-ring/five-destination proposal. See [MASTERPLAN.md](MASTERPLAN.md).

## One surface

One editorial connection view answers: What are we making? What informed it? What changed? What needs my decision? Selecting an output exposes its reference → decision → artifact → review lineage.

Use a project selector, central map and contextual inspector. Search, skills and run history are overlays or inspector modes, not five equally weighted destinations. A small System/Project scope control reveals agent/skill relationships within the same surface. Preserve selection and camera between scopes. The active project is the default, not the capability inventory.

The console remains optional. Files and host workflows work without it. Neither CrewAI nor the KB is a prerequisite for evaluating the first static composition.

## Editorial direction

**Apollo Atlas — the annotated studio table.** Retain the screenshot's connected-system idea and selective focus. Replace its unlabelled particle core and repeated orbital badges with real project thumbnails, reference frames, decisions and review annotations. Compose deliberately unequal elements around a dominant project identity, with sharp image corners, restrained lines and generous empty space.

Proposed values for discussion; reconcile with existing apollo-studio/DESIGN.md before a future build:

| Role | Proposal |
|---|---|
| Ground | Warm ink #151614 |
| Reading surface / text on ink | Paper #EEE9DD |
| Text on paper | #20231F |
| Secondary text on ink | #B9B9AC |
| Selected path | Citron #D5DD88; verify actual contrast |
| Project display | Editorial serif, clamp(40px, 5vw, 72px), line-height 0.98 |
| Controls/body | Neutral sans, 15–16px, line-height 1.4–1.55 |
| Node labels | 14px default; meaningful text never below 13px |
| Metadata | Mono 13px, reserved for provenance and timestamps |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px |
| Desktop inspector | 340px; collapse if map becomes too narrow |
| Transitions | 160–220ms selection; immediate under reduced motion |

Use existing licensed fonts initially. Serif belongs to project identity; controls remain practical. Do not copy Savra's palette, portals or enormous title into every output.

No initial WebGL, orbit animation, cursor halo or perpetual graph simulation. Stable layout; selected connections explain focus. Semantic failures still have text/icon cues. Never imply that animation means work is running.

## Graph and evidence

Typed nodes: project, reference, decision, artifact, review, agent, skill, tool. Edges: informed-by, produced-by, reviewed-by, depends-on, uses. Every edge has provenance. Capability declarations and actual run events remain distinguishable.

Store stable IDs, source paths/hashes, type, title, timestamp and scope. Read a projection of canonical registry/artifact/event data. Layout positions are preferences, not execution authority. Start with 12–20 visible items, expand neighbors deliberately and show hidden counts. Provide a list equivalent.

No manufactured connections for symmetry. No unavailable usage shown as zero. Declared, verified-at, failed and unknown are distinct; a timestamped verification is not a live connection.

Dragging, if included, changes layout only. Connecting nodes must not edit execution dependencies or start jobs in version one. Workflow authoring requires a separate contract.

## Inspector and interaction

Selecting an artifact opens its preview, purpose, inputs, producing role, review status and source file. A skill shows activation, host availability, tools and source instructions. Existing registry content is sufficient; 31 new SOP essays do not gate the drawer.

A review finding focuses the affected artifact and evidence. A future approval action must bind to the artifact hash through the canonical state writer. No approval functionality is implemented by this plan.

Keyboard: searchable list equivalent, Enter selects, Escape closes detail and returns focus. Keep camera stable on selection; provide Fit selection and Reset. Touch needs no hover or precision port dragging.

At narrow widths the same lineage becomes a vertical sequence with inline detail or an inspector sheet. Keep current task and next decision visible. Do not shrink the desktop graph to fit.

## UI references to adapt

| Reference | Adapt | Avoid |
|---|---|---|
| [Krea Nodes](https://www.krea.ai/features/nodes) | Preview-led nodes, clear input/output relationships, unequal node sizes | Generic model-pipeline chrome |
| [FLORA](https://flora.ai/) | Expressive media composition, reusable creative workflows | Its brand/media and unlimited-generation scope |
| [Are.na](https://www.are.na/) | Connected source material and collections | Mistaking collections for execution state |
| [Cosmos](https://www.cosmos.so/) | Curated imagery with restrained framing | A feed without decision provenance |
| [Rivet](https://rivet.ironcladapp.com/) | Inspectable AI graphs and debugging | Engineering controls dominating the creative view |

Krea's public Nodes hero and FLORA's homepage were visually inspected. Krea showed connected image/prompt/video objects with an output larger than its sources. FLORA showed asymmetrical media around a typographic focal point; some video embeds did not play. Other references were read from first-party pages. Full signed-in applications were not tested. These are reference transformations, not endorsements of complete product usability.

The supplied Instagram screenshot supports interest in a connection map. It does not establish the source system's backend, costs or reliability.

## Future technical choice

Studio is currently vanilla JavaScript/Node. Start with semantic DOM and SVG connectors. Evaluate [Cytoscape.js](https://js.cytoscape.org/) only if graph complexity warrants it. [React Flow](https://reactflow.dev/) is relevant only if React is independently justified; a node view does not require migration.

A future build plan must name any minimal server adapter changes. The old blanket protection of server files conflicts with requiring new APIs. Preserve unrelated data and media. Use explicitly registered project roots, not an unrestricted disk scan. The registry and an artifact manifest can feed the first slice while the optional KB is absent.

## Acceptance

1. Every visible relationship in a real run resolves to evidence.
2. Locate current output, source reference and blocking review without changing pages. Proposed usability test: three representative users; at least two complete each task unaided.
3. Same tasks at desktop and 390px, with keyboard/touch equivalents and readable labels.
4. Explicit empty, stale, failed, missing-index and unknown-usage states.
5. No fake live states, unwanted reduced-motion animation, console errors or critical accessibility findings.
6. Test 20-node and expanded 100-node fixtures; target selection response within 200ms on a recorded device. This is a target, not a measurement.
7. Independent review against the approved design and screenshot evidence, within the existing repair bound.

Next planning deliverable: one representative desktop composition, its mobile transformation and selected-artifact state. These are states of one direction, not alternatives.
