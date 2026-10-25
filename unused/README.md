# unused/

Material that is no longer part of the running system, moved here on 2026-10-08 instead of
being deleted. Nothing in Apollo reads this folder: `project.py`, `verify.py` and
`scripts/validate-system.ps1` all exclude it. Paths mirror where each item used to live, and
`git log --follow` recovers its history.

Delete anything marked **yes** once you are sure you don't miss it. Items marked **no** hold
the only copy of something worth keeping.

| What | From | Why it moved | Safe to delete |
|---|---|---|---|
| `root-docs/APOLLO-ARCHITECTURE-REVIEW.md` | repo root | 14 Aug review of the Olympus/Studio split; resolved by the 2 Sep unification | yes |
| `root-docs/APOLLO-PRODUCT-ARCHITECTURE.md`, `APOLLO-IMPLEMENTATION-PLAN.md` | repo root | 14 Aug SaaS plan, never executed; superseded by `New_upgradePlan/PRODUCT-ARCHITECTURE.md` | yes |
| `root-docs/PLAN-UNIFICATION.md`, `PROGRESS.md` | repo root | The v3 unification plan and its execution log; completed 2 Sep | yes |
| `root-docs/skills-lock.json` | repo root | Installer lock for the 8 Higgsfield skills. Provenance now in `third-party/VERSIONS.md` | no — only record of the per-skill hashes |
| `apollo-starter/` | repo root | TypeScript starter for the abandoned SaaS plan | yes |
| `skill-backups/` | `.skill-backups/` | 10 Aug backup of `emil-design-engineering`; the library holds the current body | yes |
| `impeccable-cache/` | `.impeccable/` | Two regenerable Impeccable review screenshots | yes |
| `New_upgradePlan/SPEC-01..03`, `SOURCE-ANALYSIS.md` | `New_upgradePlan/` | Marked historical by that folder's own README; the rest of the folder stays because Studio reads `media/` | yes |
| `apollo-studio/Improvement/` | `apollo-studio/` | A third, competing Studio plan (Tauri, OpenAI/Sora media) | yes |
| `apollo-studio/GOOGLE-FLOW-*` | `apollo-studio/` | Savra client media notes — one client's data, not system knowledge | no — client work record |
| `library/skills/apollo-loadout-sync`, `apollo-dashboard-sync`, `apollo-cyberpunk-athens-skin` | `library/skills/11-meta-system/` | Written for an older repo layout; every path they cite is missing. Studio's `/api/loadouts` and `state.mjs` replaced them | yes |
| `library/skills/taste-first-experience-design`, `ethical-gamification-systems`, `agent-identity-and-portfolio` | `library/skills/` | Stubs with no body that were still routed | yes |
| `library/skills/apollo-bootstrap` | `library/skills/11-meta-system/` | Installed an older Apollo layout (profiles/, dashboard/, 12-agent roster) into projects; replaced by `python library/tools/apollo.py attach` | yes |
| `library/skills/garden-kb-retriever` | `library/skills/11-meta-system/` | Chinese-language local-KB retriever, out of scope | yes |
| `library/knowledge/02-tool-inventories/`, `05-pending-capture/` | `library/knowledge/` | Tool-shopping research, not knowledge a run uses | yes |
| `library/knowledge/07-design-systems/` | `library/knowledge/` | Agent definitions for the retired atelier/kinetic/instrument agents. Every token is already in `library/doctrines/*/design.md` | yes |
| `v3-apollo/apollo/`, `v3-apollo/apollo-run.md` | `C:\Users\<user>\apollo\`, `~/.claude/agents/apollo-run.md` | The older V3 Apollo, retired so it stops competing with `design-director`. The original folder was renamed to `apollo.retired` | no — `lib/contrast.mjs`, `tokens.schema.json` and `evals/` are earmarked for a later harvest |
