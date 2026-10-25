# PRD — Convenium.Design Studio Desktop

## Problem and goal

Convenium.Design is a premium, local-first creative operating system for recurring AI-assisted work. The desktop redesign makes projects and chats the persistent foundation while keeping systems, agents, skills, knowledge, and reusable artifacts understandable without exposing architecture internals as the default experience. The immediate WKO outcome is a demonstrable Windows-first prototype whose primary journey is completing project work.

## Audience

- Primary: creators, consultants, founders, and small teams doing recurring AI-assisted project work.
- Immediate validation: WKO start-up advisor.
- Secondary: advanced users designing reusable agent systems and workflows.

## Success criteria

- A user can create/open a project, create chats, attach authorized context, send or stop a labeled demo/live response, and restore tabs after restart.
- Oracle is available contextually, explains or drafts changes, and never mutates data without a reviewed, persisted approval.
- Systems, library resources, and Playground support their stated jobs with progressive disclosure and accessible keyboard flows.
- The Work surface is usable without media or WebGL, meets the agreed desktop/narrow states, and preserves honest demo/live behavior.

## Data and publication boundary

SQLite data, transcripts, file references, settings, and API keys remain local. Files are external references until explicitly imported. API keys must be secured and never emitted to source, logs, exports, screenshots, or browser storage. No cloud sync, public publishing, payment, or remote collaboration is in scope.

## Out of scope

No Godot/Unity, full game engine, production marketplace publishing/payments, accounts, cloud vector database, multiplayer, consumer credential reuse, auto-update, or code signing. WebGL is opt-in, bounded to approved selected surfaces, and always has a static fallback.

## Approvals

Gate A is approved as of 2026-08-31. Gate B remains required before production redesign work; Gate C remains required before final acceptance.
