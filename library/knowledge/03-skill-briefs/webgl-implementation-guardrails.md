# WebGL implementation guardrails

- Type: note
- Origin: `convenium-design-studio/knowledge/index.json` `sources["three-js-implementation"]`, saved
  2026-08-10. `three-js-implementation` was deleted in the unification (Phase 1); this note
  is kept because it still applies to `webgl-experience`.

Dispose geometries, materials, textures, and renderer resources on teardown. Cap pixel ratio
on mobile. Keep a semantic DOM equivalent and a static poster fallback.
