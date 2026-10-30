# 00 — Run plan: Convenium Shipyard build (the activation plan)

Written by the director (planning session, 2026-10-30) from `templates/00-run-plan.md`. Check
before the first spawn, and again after any edit:

```
python library/tools/verify.py --plan shipyard/plan/00-run-plan.md
```

Trail **abridged** (brief and direction fixed by the owner; see `06-build-plan.md` § 1). The
director is the main session of the **build** session, not the session that wrote the plan.
Replace `<CD>` with the absolute path of this Convenium.Design checkout before spawning; every
`skill_path` is under it. Engineering phases run sequentially — they share `shipyard/`. The
author QA and the finish review never run in parallel with each other or with a build phase.

```json
{
  "run": "convenium-shipyard",
  "trail": "abridged",
  "convenium_design": "<CD>",
  "phases": [
    {
      "id": "plan-check",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": ["shipyard/plan/06-build-plan.md", "shipyard/DESIGN.md", "shipyard/ARCHITECTURE.md"],
      "outputs": ["verify.py --plan CLEAN on this file", "shipyard/PROGRESS-AND-DECISIONS.md entry: build started"],
      "stop": "plan read in full; no TBD in DESIGN.md token block; this file CLEAN",
      "parallel": false
    },
    {
      "id": "data-pipeline",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": ["shipyard/data/artifact-families.json", "library/tools/project.py", "library/tools/verify.py"],
      "outputs": ["library/registry/artifacts.json", "project.py shipyard target", "verify.py KB checks", "shipyard/public/data/knowledge-base.json"],
      "stop": "T1 done-when: project.py all && verify.py CLEAN; removing a skill from the registry makes verify fail",
      "parallel": false
    },
    {
      "id": "scaffold-domain",
      "agent": "design-engineer",
      "skill": "project-scaffold",
      "skill_path": "<CD>/library/skills/09-engineering-workflow/project-scaffold/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/plan/06-build-plan.md §3 §5 §8 §9 §11 T2-T3", "shipyard/ARCHITECTURE.md", "shipyard/schemas/ship.schema.json"],
      "outputs": ["shipyard/package.json and app skeleton", "shipyard/src/kb", "shipyard/src/domain", "shipyard/src/store", "tests/unit", "scripts/check-plans.mjs"],
      "stop": "T2 + T3 done-when; npm run test:plans exports the 4 library ships and verify.py --plan is CLEAN on each",
      "parallel": false
    },
    {
      "id": "scene-port",
      "agent": "design-engineer",
      "skill": "webgl-experience",
      "skill_path": "<CD>/library/skills/03-motion-3d/webgl-experience/SKILL.md",
      "model": "sonnet",
      "inputs": ["ArkhEthos/src/features/ship (local checkout)", "shipyard/ARCHITECTURE.md Port map", "shipyard/plan/05-asset-manifest.md", "shipyard/plan/06-build-plan.md §5 §6 T4-T5"],
      "outputs": ["shipyard/src/scene", "shipyard/src/scene/artifacts", "shipyard/public/media (imported)", "features/board"],
      "stop": "T4 + T5 done-when; no-WebGL and reduced-motion fall-through verified",
      "parallel": false
    },
    {
      "id": "game-layer",
      "agent": "design-engineer",
      "skill": "gamified-ui",
      "skill_path": "<CD>/library/skills/02-web-build/gamified-ui/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/plan/06-build-plan.md §7 §8 §9 T9", "shipyard/DESIGN.md Gamification"],
      "outputs": ["features/preflight", "features/logbook", "src/domain/commissions.ts"],
      "stop": "T9 done-when; ethics gate (06 §7.6) checklist ticked in PROGRESS-AND-DECISIONS.md",
      "parallel": false
    },
    {
      "id": "editors",
      "agent": "design-engineer",
      "skill": "ui-ux",
      "skill_path": "<CD>/library/skills/01-design-direction/ui-ux/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/plan/06-build-plan.md §4 §10 T6-T8", "shipyard/DESIGN.md Layout grid"],
      "outputs": ["features/hangar", "features/bridge", "features/armory", "features/voyage"],
      "stop": "T6-T8 done-when; acceptance 1, 2, 4 and 7 demonstrated",
      "parallel": false
    },
    {
      "id": "assets",
      "agent": "asset-producer",
      "skill": "asset-director",
      "skill_path": "<CD>/library/skills/04-media-generation/asset-director/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/plan/05-asset-manifest.md"],
      "outputs": ["shipyard/plan/05-asset-manifest.md status column filled", "11 family glyph SVGs in shipyard/src/scene/artifacts/glyphs.tsx reviewed", "shipyard/public/media/LICENSES.md"],
      "stop": "every manifest row has source, licence, bytes, sha256; no paid generation run",
      "parallel": false
    },
    {
      "id": "motion",
      "agent": "design-engineer",
      "skill": "emil-design-eng",
      "skill_path": "<CD>/library/skills/01-design-direction/emil-design-eng/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/DESIGN.md Motion contract", "shipyard/plan/06-build-plan.md T10"],
      "outputs": ["motion implemented per table", "src/lib/feel.ts tiers"],
      "stop": "every motion-contract row demonstrated with its reduced-motion variant",
      "parallel": false
    },
    {
      "id": "finish",
      "agent": "design-engineer",
      "skill": "impeccable",
      "skill_path": "<CD>/library/skills/01-design-direction/impeccable/SKILL.md",
      "model": "sonnet",
      "inputs": ["shipyard/PRODUCT.md", "shipyard/DESIGN.md", "node .claude/skills/impeccable/scripts/context.mjs output"],
      "outputs": ["finish pass applied", "required states reachable"],
      "stop": "T11 done-when; impeccable detector reports no blocking anti-pattern",
      "parallel": false
    },
    {
      "id": "author-qa",
      "agent": "design-engineer",
      "skill": "visual-qa",
      "skill_path": "<CD>/library/skills/08-qa-review/visual-qa/SKILL.md",
      "model": "sonnet",
      "inputs": ["running app", "shipyard/plan/06-build-plan.md acceptance criteria"],
      "outputs": ["shipyard/plan/07-qa.md", "shipyard/plan/qa-screens/"],
      "stop": "07-qa.md covers 1440/1024/390/360, keyboard, reduced motion, no WebGL, console health",
      "parallel": false
    },
    {
      "id": "finish-review",
      "agent": "independent-critic",
      "skill": "award-rubric",
      "skill_path": "<CD>/library/skills/08-qa-review/award-rubric/SKILL.md",
      "model": "opus",
      "inputs": ["shipyard/DESIGN.md", "shipyard/plan/06-build-plan.md", "shipyard/plan/07-qa.md", "running app"],
      "outputs": ["shipyard/plan/10-finish-review.md"],
      "stop": "scored against DESIGN.md; defects listed; no fixes made by the critic; at most two author-fix / review cycles",
      "parallel": false
    },
    {
      "id": "handoff",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": ["07-qa.md", "10-finish-review.md"],
      "outputs": ["shipyard/PROGRESS-AND-DECISIONS.md handoff entry", "Gate C question to the owner"],
      "stop": "owner answers Gate C",
      "parallel": false
    }
  ],
  "gates": ["C"]
}
```
