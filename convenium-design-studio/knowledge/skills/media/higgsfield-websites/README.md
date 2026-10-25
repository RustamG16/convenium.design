# higgsfield-websites

- Category: Media
- Phase: unrouted
- Status: active
- Routed: no
- Skill ID: higgsfield-websites

Build, edit, and deploy full-stack websites, apps and games via the Higgsfield CLI (`higgsfield website …`). Each is a React 19 + TanStack Start SSR app in one Cloudflare Worker (D1/R2/KV/DO/Containers). THREE product types, picked via `--type` on create: `website` (standalone, no Higgsfield integration — references/website-flow.md), `app` (Sign in with Higgsfield + fnf SDK, Quanta — references/app-flow.md), `game` (realtime multiplayer rooms — references/game-flow.md). Routes to the right flow; each carries its own rules and deploy/publish gates. Use when: "build me a website", "make a landing page", "create a web app", "build a SaaS dashboard / portfolio", "make me a game", "deploy this site", "publish". Also owns GAME ART: "make a spritesheet", "tileable texture", "animate a 3D character", game music/SFX — see the game-* references. NOT for: single image/video/audio generation (higgsfield-generate), product photos (higgsfield-product-photoshoot), marketplace cards (higgsfield-marketplace-cards).
