# Convenium.Design Studio Chat-First Usability Rebuild

## Approved outcome

Convenium.Design Studio is a calm chat workspace with an optional guided Constructor. The ordinary journey is `New chat → Describe goal → Answer necessary questions → Review approach → Start work → Inspect result → Continue chatting`.

## Product contract

- Standalone chats are first-class and may have nullable project membership.
- Projects own shared knowledge, workflows, runs, and results; folders are sidebar-only organization with one level.
- Constructor is project-scoped and optional; Advanced controls are progressive disclosure.
- The workspace uses one composer and at most one contextual right panel.
- The UI must label deterministic/demo behavior and must not add live AI execution.

## Visual contract

Warm neutral surfaces, readable locally served Barlow, restrained borders, Lucide icons, blue actions, and semantic status colors. Desktop layout is a 256px sidebar, 760px chat reading width, and 360px preview panel. Below 1280px the preview starts closed; below 820px use a drawer and one content surface at a time. Remove technical grids, uppercase navigation, permanent shortcut labels, and diagnostic banners.

## Canonical routes

`#/new`, `#/chats/{chatId}`, `#/projects/{projectId}`, `#/projects/{projectId}/chats/{chatId}`, `#/projects/{projectId}/constructor`, `#/projects/{projectId}/files`, `#/projects/{projectId}/files/{artifactId}`, `#/knowledge`, `#/agents`, `#/settings`.

Legacy Work links resolve to the corresponding conversation; Plan/Configure/System resolve to Constructor; Results/Outputs resolve to Files & Results while preserving valid run context.

## Non-negotiable behavior

First message submission must not require a project, model, budget, or workflow. Reload and Back/Forward preserve route selections, drafts, artifact context, and focus. Mutations are serialized, backed up before migration, and visibly fail on unreadable data. Moving a chat does not move historical runs/results.

## Verification target

Cover the route matrix, standalone/project chat lifecycle, folder organization and undo, migration compatibility, chat workflow cards, Constructor draft/apply semantics, preview ownership, async ownership, offline/reconnect behavior, keyboard-only flow, 200% text, reduced motion/transparency, 390/820/1280/1440/1920 widths, actual Barlow loading, Lucide rendering, no overflow, and clean console/runtime behavior.
