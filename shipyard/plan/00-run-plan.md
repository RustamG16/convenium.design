# 00 — Run plan: Convenium Shipyard v2 (the activation plan)

Rewritten by the director on 2026-11-08 for v2 (live library, Forge, trials, Regatta). The v1 plan
(T0–T14) is complete and kept in git history at `8c78d44`. Check before the first spawn, and again
after any edit:

```
python library/tools/verify.py --plan shipyard/plan/00-run-plan.md
```

Trail **abridged**: the owner fixed the scope on 2026-11-08 (`PRODUCT.md § v2`). Following the
owner's standing rule, **one Opus director session builds every phase**. The only subagent is the
independent critic at the finish. Phases run in sequence; each ends green with one commit on
`shipyard/build`. The task list and the art direction are in `12-build-plan-v2.md`.

```json
{
  "run": "convenium-shipyard-v2",
  "trail": "abridged",
  "convenium_design": "D:/Analyst_Designer/Convenium.Design-shipyard",
  "phases": [
    {
      "id": "v2-docs",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": [
        "shipyard/PRODUCT.md",
        "shipyard/ARCHITECTURE.md",
        "shipyard/plan/10-finish-review.md"
      ],
      "outputs": [
        "PRODUCT.md § v2",
        "ARCHITECTURE.md § v2",
        "plan/12-build-plan-v2.md",
        "this file CLEAN",
        "05-asset-manifest.md § v2 quotes"
      ],
      "stop": "verify.py --plan CLEAN on this file; docs committed",
      "parallel": false
    },
    {
      "id": "v2-quick-wins",
      "agent": "director",
      "skill": "impeccable",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/01-design-direction/impeccable/SKILL.md",
      "model": "opus",
      "inputs": [
        "plan/10-finish-review.md n1 n3 n4 n5 + residues"
      ],
      "outputs": [
        "FleetRing fit, orbit spread, fix labels, veil status, residues"
      ],
      "stop": "typecheck, lint, unit, affected e2e green",
      "parallel": false
    },
    {
      "id": "v2-data-driven",
      "agent": "director",
      "skill": "project-scaffold",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/09-engineering-workflow/project-scaffold/SKILL.md",
      "model": "opus",
      "inputs": [
        "library/tools/project.py",
        "library/tools/verify.py",
        "src/domain/schema.ts",
        "src/domain/conversion.ts"
      ],
      "outputs": [
        "slug ids, manifests, deriveTable, dry dock, governance check, invariant tests"
      ],
      "stop": "project.py all + verify.py CLEAN; unit green; a workflow with no table derives a voyage",
      "parallel": false
    },
    {
      "id": "v2-live-kb",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": [
        "vite.config.ts",
        "src/kb/context.tsx"
      ],
      "outputs": [
        "dev/kbWatch.ts, rebuild route, KbProvider hot reload, banner"
      ],
      "stop": "live-KB e2e: a fixture skill appears in the open Armory without reload",
      "parallel": false
    },
    {
      "id": "v2-forge",
      "agent": "director",
      "skill": "ui-ux",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/01-design-direction/ui-ux/SKILL.md",
      "model": "opus",
      "inputs": [
        "ARCHITECTURE.md § v2 middleware"
      ],
      "outputs": [
        "dev/forge.ts, features/forge/, rollback"
      ],
      "stop": "Forge e2e: create agent + skill live; forced verify failure rolls back; preview build makes no /__shipyard call",
      "parallel": false
    },
    {
      "id": "v2-variants",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": [
        "src/domain/export.ts",
        "src/domain/preflight.ts"
      ],
      "outputs": [
        "crew/override, PF-16, fork, promote"
      ],
      "stop": "unit + bridge e2e green; test:plans CLEAN with an override",
      "parallel": false
    },
    {
      "id": "v2-dry-trials",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": [
        "fixtures/briefs/",
        "src/domain/preflight.ts"
      ],
      "outputs": [
        "src/domain/trial.ts, three briefs, golden tests"
      ],
      "stop": "golden scores stable; unit green",
      "parallel": false
    },
    {
      "id": "v2-regatta",
      "agent": "director",
      "skill": "gamified-ui",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/02-web-build/gamified-ui/SKILL.md",
      "model": "opus",
      "inputs": [
        "PRODUCT.md § v2 ethics gate"
      ],
      "outputs": [
        "features/regatta/, leaderboard, ethics.test.ts"
      ],
      "stop": "regatta e2e names a winner; ethics test green",
      "parallel": false
    },
    {
      "id": "v2-live-trials",
      "agent": "director",
      "skill": null,
      "skill_path": null,
      "model": "opus",
      "inputs": [
        "ARCHITECTURE.md § v2 trials"
      ],
      "outputs": [
        "dev/trial.ts, features/trials/, fake CLI tests"
      ],
      "stop": "fake-CLI e2e: complete, cancel (no orphan), timeout; one real smoke run after owner confirms the estimate, or recorded as not run",
      "parallel": false
    },
    {
      "id": "v2-arena-3d",
      "agent": "director",
      "skill": "webgl-experience",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/03-motion-3d/webgl-experience/SKILL.md",
      "model": "opus",
      "inputs": [
        "scene/",
        "plan/05-asset-manifest.md § v2"
      ],
      "outputs": [
        "scene/Arena.tsx, Forge workbench, approved assets imported + LICENSES.md"
      ],
      "stop": "no-WebGL and reduced-motion fallbacks pass; only owner-approved paid assets generated",
      "parallel": false
    },
    {
      "id": "v2-author-qa",
      "agent": "director",
      "skill": "visual-qa",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/08-qa-review/visual-qa/SKILL.md",
      "model": "opus",
      "inputs": [
        "all v2 screens"
      ],
      "outputs": [
        "plan/07-qa.md § v2 at 1440/1024/390/360"
      ],
      "stop": "axe 0, overflow 0, detector 0; desktop then phone Playwright green",
      "parallel": false
    },
    {
      "id": "v2-finish-review",
      "agent": "independent-critic",
      "skill": "award-rubric",
      "skill_path": "D:/Analyst_Designer/Convenium.Design-shipyard/library/skills/08-qa-review/award-rubric/SKILL.md",
      "model": "opus",
      "inputs": [
        "plan/12-build-plan-v2.md",
        "plan/07-qa.md § v2",
        "screens"
      ],
      "outputs": [
        "plan/10-finish-review.md § v2 (verbatim)"
      ],
      "stop": "score and verdict written; at most two fix cycles",
      "parallel": false
    }
  ],
  "gates": [
    "C"
  ]
}
```
