# workers/build (stub)

Inngest functions:
- `site/build.requested` — steps 1–8 of `../../pipeline/PIPELINE.md`, each a `step.run`
  keyed by `buildId`, writing status to `builds.status` and the log to `builds.runLog`.
- `site/publish.requested` — pointer swap + purge.
- `domain/verify.requested` — polls Cloudflare hostname status.
