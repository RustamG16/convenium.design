# Handoff

## Convenium.Design Workbench prototype — 2026-08-31

Changed `public/index.html`, `public/app.js`, and `public/styles.css` to add the Work-first shell, browser-local project/chat fixtures, keyboard-safe composer, context drawer, and safe Oracle dock. Root context and project decision/asset/build/QA/measurement artifacts were added.

Demo path: open `http://127.0.0.1:4173/#/work`, choose a project, send a message, open Oracle, choose “Show me how” or “Do it for me,” then continue to Systems. Oracle moves to proposal planning; it does not execute a mutation.

Gate C remains pending: functional Tauri/SQLite slice, package proof, migration/security/accessibility evidence, media provenance, WKO demo review, and user acceptance are still required.

## Start

```powershell
cd D:\Analyst_Designer\Convenium.Design\convenium-design-studio
npm.cmd start
```

Open `http://127.0.0.1:4173`.

## Live mode

Set `OPENAI_API_KEY` in the server process environment, then restart. The key never enters the browser. Live comparisons use the selected OpenAI model, reasoning effort, output ceiling, skill contracts, and optional hosted web search.

## Extend

- Add skills and source notes from the Knowledge UI; runtime-safe custom contracts and category folders persist under `knowledge/`.
- Adjust specialist activation, token budgets, and approval gates from the Agents UI.
- Implement authenticated MCP bridges server-side before marking Figma, PostHog, Higgsfield, Browser Control, or Chrome DevTools as usable.
- Follow `INTEGRATIONS.md`: keep subscription sign-in inside each host and forward only explicit Convenium.Design events. Never import app session cookies.
- Replace browser-local experiment history with a persistent run store when multi-user or resumable execution becomes necessary.
- Consider the OpenAI Agents SDK tracing adapter or Temporal only when production monitoring or crash-resilient long-running workflows justify those dependencies.

## 2026-09-01 — Persistent Work foundation

The Work surface now persists projects, nested chats, messages, scoped attachment metadata, and proposal records on the local server in `data/workspace.json`. Attachments are explicit browser-selected references only: Convenium.Design records their name, size, type, and authorization scope, but this browser slice does not read or upload their contents. Unlinking uses the visible proposal dialog and preserves the original source file.

Run `npm.cmd start` from `D:\Analyst_Designer\Convenium.Design\convenium-design-studio`, open `http://127.0.0.1:4173/#/work`, create a project or chat, send a message, select Attach, and use Context → Unlink to exercise the approval review.

## 2026-09-01 — Visual-enrichment cycle

Two generated, decorative local WebP assets now deepen the product world without becoming functional dependencies:

- `public/media/generated/system-concordance-01.webp` — the composed-team orbital field used on Systems and Architecture.
- `public/media/generated/knowledge-reliquary-01.webp` — the capability archive used on the Knowledge Factory.

Both assets were generated with the built-in OpenAI image generator under the user’s explicit 2026-09-01 approval. Prompts and acceptance criteria are recorded in `.olympus/05-asset-manifest.md`; each has a CSS-only fallback and is omitted under reduced-transparency/high-contrast preferences. No remote media is fetched at runtime.
