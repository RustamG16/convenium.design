# ARCHITECTURE ESSENTIALS

Read this file before changing Convenium.Design Studio.

1. The approved master plan in `.olympus/10-desktop-app-master-plan.md`, this project context, and existing working behavior are the source of truth.
2. Preserve existing `.mjs` business logic, `/api/*` behavior, `data/`, `knowledge/`, `public/media/`, and all unrelated uncommitted work. Do not delete or overwrite user records; project evidence belongs only in `.olympus/`.
3. Current runtime is Node 20+ with ESM and a dependency-free browser renderer. The approved target is Tauri 2 + React 19 + strict TypeScript, but no dependency or migration is added until Gate B selects a concept and the implementation slice is approved.
4. Frontend changes require Apple Design, UI/UX, and Emil Design reviews: keyboard access, visible focus/error recovery, 36 px desktop and 44 px narrow targets, reduced motion/transparency, no unapproved media dependency, and no initial Work WebGL.
5. Before handoff run `npm.cmd run check`; verify `/api/health`, desktop/narrow behavior, keyboard primary flow, reduced motion, and no console/runtime errors. Run project-context validation after context changes.
6. Secrets stay server/local only. Oracle and every mutation require explicit user approval; never invent evidence, rights, analytics, or verification. Packaging/publishing is not authorized without a later approved build plan.
