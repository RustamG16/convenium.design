# Convenium.Design notes: interface-review

Vendored 2026-10-19 from [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills) (`skills/interface-review`, commit `4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63`), MIT.
The licence is in `third-party/`. **Changes made:** a `license: MIT` frontmatter key and a one-line
pointer to this file under the frontmatter. The rest of the upstream text and every supporting file
are unchanged.

## Fit in Olympus

Change-scoped review. Upstream frontmatter sets `disable-model-invocation: true`: it is user-invoked only, so it is **unrouted** in Olympus. The routed QA skill is `better-interface`, which this hands back to.
