# Frozen concept directions — Convenium.Design Studio Desktop

## Shared constraints

The product is a Windows-first, local-first desktop workspace for creators and small teams. Projects and chats must remain visible; Work is the primary no-WebGL surface; Oracle remains global and approval-gated. Existing Node/vanilla behavior, local APIs, data, and media stay protected. No external media generation is approved, and rights for supplied media are not yet confirmed.

## 1. Convenium.Design Workbench — selected

**Thesis:** A calm Codex-style workbench makes the project conversation the center of gravity, while character identity and artifacts appear only when they add context.

**Why it fits:** It makes the primary job—completing project work—immediate for WKO reviewers and recurring operators, while leaving a clear path into reusable systems and libraries.

**Hierarchy:** Native frame → persistent project/chat sidebar → top Work/Systems/Library/Playground navigation → compact project tabs → chat/work canvas with focused composer → contextual inspector → persistent Oracle dock. Work empty state offers open/create project and sample task; advanced model/tool controls are disclosed only on demand.

**Visual system:** Dense but breathable system-ui typography; near-black graphite surfaces, cool neutral dividers, one restrained solar-gold selection/accent; shallow translucency only where it separates temporary layers. Portraits appear in agent/system detail only after provenance confirmation; until then, monogram and text identity remain complete.

**Motion:** CSS transform/opacity feedback only, under 300 ms, anchored to originating controls. No frequent-keyboard animation and no GSAP in the initial slice. Reduced motion and reduced transparency remove nonessential transitions/materials.

**WebGL:** No on Work, Settings, default lists, or first prototype. A later, lazy system-detail scene is a candidate only if it communicates workflow state better than a diagram.

**Narrow behavior:** Sidebar and Oracle become independent drawers; chat and composer win the viewport; inspector opens as a focused sheet; agent/library lists use list-to-detail navigation.

**Assets needed:** Optional approved Convenium.Design/Athena/Calliope/Hephaestus/Hermes portraits for detail cards; wordmark/icon source; WKO constraints and rights confirmation. Functional fallbacks use CSS avatars.

**Risk:** Low. It aligns with the existing server-rendered browser UI and allows a staged migration without a dependency or data rewrite.

## 2. Olympus Observatory

**Thesis:** Systems become spatial observatories: a visual workflow constellation surrounded by inspectable operational panels.

**Why it fits:** Advanced workflow designers get a memorable systems overview with stronger mythological atmosphere.

**Hierarchy:** Shell → system constellation/phase map first → selected agent or phase inspector → activity/proposal rail → secondary Work chat. The project chat is contextual rather than central on Systems.

**Visual system:** Deep midnight field, luminous connection lines, sculptural agent cards, stronger depth layers, and spatial grouping. Typography is editorial for systems headings and utilitarian for controls.

**Motion:** Brief path-highlighting and inspector transitions; GSAP may support phase progression after performance validation.

**WebGL:** Candidate only for a bounded read-only system overview, with an SVG/static workflow map fallback.

**Narrow behavior:** Replaces the constellation with a vertical phase rail; selected detail takes precedence and connection maps become an on-demand summary.

**Assets needed:** Rights-cleared portraits and optional system thumbnails; static fallback diagrams. No generation is authorized.

**Risk:** Medium/high. It risks making systems—not project work—the perceived primary product and costs more to make accessible, useful, and performant.

## 3. Artifact Archive

**Thesis:** Convenium.Design is an editorial archive of collected, trusted, and reusable agents, skills, systems, and references.

**Why it fits:** It gives advanced users a strong browsing and provenance model for their reusable operating assets.

**Hierarchy:** Shell → Library-led category dashboard → curated resource shelves and saved views → item detail/provenance → contextual “equip/use” actions → Work is a transition from a selected artifact.

**Visual system:** Warm paper/graphite contrast, catalog labels, disciplined metadata, cover-like agent/system cards, and small atmospheric media crops when approved.

**Motion:** Gentle shelf/detail transitions; no GSAP needed in the initial slice and no WebGL.

**Narrow behavior:** Filter/search first, then single-column catalog with detail pushed into a focused drawer.

**Assets needed:** Provenance-cleared portrait crops, artifact icons, source/compatibility metadata. CSS-only catalog cards work before assets are cleared.

**Risk:** Medium. It is distinctive and credible for the Library, but would make the primary Work journey feel secondary if applied as the overall desktop shell.

## Comparison and Gate B recommendation

| Direction | Information model | Production cost | Delivery risk | Fit to primary Work goal |
|---|---|---:|---|---|
| Convenium.Design Workbench | Project/chat first; systems and artifacts contextual | Low | Low | Excellent |
| Olympus Observatory | System visualization first | High | Medium/high | Moderate |
| Artifact Archive | Library/provenance first | Medium | Medium | Moderate |

**Recommendation:** Convenium.Design Workbench. It is the only direction that makes the approved primary action—project-aware work—unambiguous while giving later systems, library, and visual-world work a scalable place to live.
