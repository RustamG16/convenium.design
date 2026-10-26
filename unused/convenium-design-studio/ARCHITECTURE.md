# ARCHITECTURE — Convenium.Design Studio Desktop

## Runtime and stack

The current application is Node 20+ ESM (`server.mjs`) with a vanilla browser renderer under `public/`, a dependency-free local API, and deterministic demo plus optional live Responses API behavior. The approved destination is a Windows-first Tauri 2 shell with React 19, strict TypeScript, React Aria Components, custom CSS tokens, Zustand shell state, TanStack Query command caching, SQLite via the official Tauri SQL plugin, and Stronghold for the OpenAI key. This migration is phased; existing `.mjs` modules remain authoritative until parity tests pass.

## Source layout and boundaries

- Current: `server.mjs` exposes `/api/*`; `agents.mjs`, `systems.mjs`, `skills.mjs`, `knowledge.mjs`, and `events.mjs` hold deterministic domain behavior; `data/` and `knowledge/` are protected legacy sources; `public/` is the browser UI and local media source.
- Target: `src/app` shell/routing/providers; `src/features` product surfaces; `src/components` accessible primitives; `src/domain` framework-independent rules; `src/bridge` typed app/demo/web adapters; `src-tauri` commands, migrations, secure credentials, scoped files, logging, and packaging.
- `public/media` remains referenced source media until manifest provenance and placement rules are recorded. Existing uncommitted work is never reverted.

## Interfaces and state

The bridge exposes typed project, chat/message, tab, attachment, library, system, Playground, Oracle, settings, and migration operations. Renderer code never directly accesses filesystem, SQLite, API keys, or live AI. Required shared types include projects/chats/messages/tabs/attachments, agents/skills/systems/versions, runs/events/artifacts, marketplace/installations, Oracle contexts/proposals/approvals, settings, and migration records.

SQLite uses UUID keys, UTC timestamps, normalized searchable relations, forward-only migrations, a pre-migration backup, and idempotent legacy imports recorded by source hash. Never silently delete records. Live AI runs from the Rust layer with `store: false`; typed allowed tools separate reads from mutations. Mutations must match a persisted approved proposal. Demo mode fulfills the same bridge contract and stays visibly labeled.

## Build, verification and deployment

Current checks: `npm.cmd run check`; launch with `npm.cmd start` and inspect `http://127.0.0.1:4173/api/health`. Validate root context with `..\scripts\validate-project-context.ps1 -ProjectPath .`. Before each redesigned slice: check desktop and 390 px/narrow, keyboard, empty/loading/error states, reduced motion, console/runtime health, and performance risks. Later Tauri work adds strict type/lint/unit/integration/Playwright/axe and packaged Windows smoke checks.

## Decisions and costs

Work is the no-WebGL default; any Three.js/R3F scene is lazy-loaded, one canvas per view, DPR capped at 1.5, pausable, and static-fallback capable. New dependencies, data migrations, external generation, permissions, and packaging require the Gate-B-approved build plan. See `.olympus/10-desktop-app-master-plan.md` and `PROGRESS-AND-DECISIONS.md`.
