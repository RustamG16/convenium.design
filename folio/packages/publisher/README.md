# packages/publisher (stub)

`putBundle(buildId, dir) → bundleKey` (R2), `publish(siteId, buildId)` (pointer + cache
purge), `addDomain(siteId, hostname)` → Cloudflare for SaaS custom hostname, `domainStatus`.
The edge Worker (`worker.ts`) routes `Host → siteId → currentBuildId → R2 key` and serves
with immutable cache headers for hashed assets.
