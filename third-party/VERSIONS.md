# Vendored skill versions

These upstream skill folders are copied into `.agents/skills/` so `system1` remains portable when attached without running an installer.

| Package | Source | Commit |
|---|---|---|
| Impeccable | https://github.com/pbakaus/impeccable | `1cbee026c319af4b8afc95bbf3cd2f736aeab484` |
| GSAP skills | https://github.com/greensock/gsap-skills | `aed9cfd3277740755f6bfc1155c7aa645403b760` |

| Higgsfield skills (8: brandkit, generate, marketplace-cards, product-photoshoot, soul-id, video-explainer, websites, youtube-thumbnail) | https://github.com/higgsfield-ai/skills | not recorded; installed 2026-08-13 via a skills installer whose `skills-lock.json` (per-skill SHA-256 hashes) is kept at `unused/root-docs/skills-lock.json` |
| `product-marketing` 2.1.0, `competitor-profiling` 2.0.0 | Vendored 2026-10-08 from the operator's personal `~/.claude/skills`. Upstream is believed to be a public marketing-skills pack (the version metadata matches) but was **not verified**; confirm source and licence before redistributing. | — |
| `ui-ux` support files (`references/`, `scripts/`, `templates/`, `evals/`) | Vendored 2026-10-08 from the operator's personal `~/.codex/skills/ui-ux`; only its `SKILL.md` had been copied before. Upstream not recorded. | — |
| `open-sourcing` (Trail of Bits, plugin 0.1.2) | https://github.com/trailofbits/skills (`plugins/open-sourcing`) — CC BY-SA 4.0, vendored 2026-10-09 into `library/skills/06-ops-security/` | `82fe8226252622fa807643bdca1710901198553a` |
| `implementing-secret-scanning-with-gitleaks` | https://github.com/mukul975/Anthropic-Cybersecurity-Skills (not affiliated with Anthropic) — Apache-2.0, vendored 2026-10-09, `.py` scripts excluded, corrections in `APOLLO-NOTES.md` | `54a798831d2266a3ca61ce68a7acb80b81160d57` |
| `octalysis-gamification` | https://github.com/eykd/vance-ts (`.claude/skills/octalysis-gamification`) — ISC per `package.json` (no LICENSE file in repo), vendored 2026-10-14 into `library/skills/01-design-direction/` | `548afca81ea8ee7f0924d19b002968af1c6857af` |
| `game-feel` | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (`skills/disciplines/game-feel`) — Apache-2.0, vendored 2026-10-14 into `library/skills/03-motion-3d/`; licence + NOTICE in `third-party/AWESOME-GAMEDEV-SKILLS-*.txt`; changes listed in its `APOLLO-NOTES.md` | `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd` |
| `scroll-scrubbed-visual-sequence`, `cinematic-scroll-storytelling`, `cinematic-gsap-lenis-motion-system` | https://github.com/MengTo/Skills (`agent-skills/web-design/*`) — MIT, vendored 2026-10-19; licence in `third-party/MENGTO-SKILLS-LICENSE.txt`; changes listed in each skill's `APOLLO-NOTES.md` | `398cd41c86ba42fbb30e944ae507f463648f08b7` |
| `mobile-ios-design`, `responsive-design` | https://github.com/wshobson/agents (`plugins/ui-design/skills/*`) — MIT, vendored 2026-10-19; licence in `third-party/WSHOBSON-AGENTS-LICENSE.txt` | `0874a27b17a22e2b7c2e2bcd725768e0803cad06` |
| `better-interface`, `better-layout`, `better-typography`, `better-colors`, `better-ui`, `better-writing`, `interface-review`, `better-accessibility` | https://github.com/jakubkrehel/skills (`skills/*`) — MIT, vendored 2026-10-19; licence in `third-party/JAKUBKREHEL-SKILLS-LICENSE.txt` | `4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63` |
| `gesture-patterns` | https://github.com/Owl-Listener/designer-skills (`interaction-design/skills/gesture-patterns`) — MIT, vendored 2026-10-19; licence in `third-party/OWL-LISTENER-DESIGNER-SKILLS-LICENSE.txt` | `9a6930cf84a822eb458624bd11c61aac5bbdf224` |

Vendored on 2026-08-09 (Impeccable, GSAP). Review upstream releases, diffs, and licenses before updating. Do not auto-update during a client project.

Compatibility note: the vendored Impeccable `SKILL.md` omits upstream’s top-level `version` frontmatter key because the current Codex skill validator accepts version data only through supported metadata. The pinned upstream commit and package version remain recorded here.
