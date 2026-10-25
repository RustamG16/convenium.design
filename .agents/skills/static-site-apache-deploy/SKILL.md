---
name: static-site-apache-deploy
description: Deploy a static site (Next.js `output export`, Astro, Vite, plain HTML) to Apache shared hosting such as GoDaddy/cPanel — security audit, root-served build, a .htaccess with redirects, headers, CSP, caching and compression, a GitHub Actions rsync-over-SSH pipeline, and an email-safe DNS cutover with AutoSSL. Use for "deploy to cPanel", "GoDaddy hosting", "write the .htaccess", "security headers on Apache", "move off GitHub Pages", "DNS cutover without breaking email".
---

# Static site → Apache (cPanel) deploy

Distilled from the Convenium Studio deploy (2026-10-09). Templates: `references/htaccess-template.conf`,
`references/deploy-workflow-template.yml`. Pair with `06-ops-security/open-sourcing` (Actions hardening)
and `06-ops-security/implementing-secret-scanning-with-gitleaks` (read its APOLLO-NOTES first).

**Verification status of this skill:** the build, export checks and pipeline logic were verified on the
source project; the `.htaccess` was reviewed but its live Apache run was still pending when written —
always run the Docker test in § 4 before shipping it.

## Work in gated phases
Audit → build config → `.htaccess` + local Apache proof → pipeline → DNS checklist → docs. Stop after each,
report, wait for an explicit "approved". Never deploy, push, change DNS or create secrets yourself.

## 1. Security audit (read-only)
Table: check | PASS/FAIL/N/A | evidence | fix.
- Tree: `git ls-files` + key/token/private-key regexes; list `.env*`; check `.gitignore` covers `.env` (not just `.env*.local`).
- History: gitleaks over **all refs** (`gitleaks git . --log-opts="--all" --redact`). No Docker? Use the official
  release binary and verify it against the release's `checksums.txt`. Hits in gitignored build caches
  (`.next/prerender-manifest.json` preview keys) are not leaks — scan `out/` separately.
- `npm audit --omit=dev` (ships) vs full (dev tooling). Prefer a patch bump in the same line; a framework
  major is a separate decision. Note what a static export does not run (Server Actions, middleware, image optimizer).
- Input: forms that build `mailto:` must `encodeURIComponent` the body; `dangerouslySetInnerHTML` only for static strings.
- Third-party inventory from the **built** output (grep `out/` for `src=`/`href=` to `http`, hosts in JS bundles) — feeds the CSP.
- N/A, one line each, for every backend item (DB, RLS, auth, sessions, hashing, rate limits, SQL, uploads, API trimming).

## 2. Build
- No base path in production; the canonical origin from one env var (e.g. `NEXT_PUBLIC_SITE_ORIGIN`).
- Canonical **and** `og:url` per route — Next: `alternates: { canonical: "./" }` and `openGraph.url: "./"` in the
  root layout resolve per route with the trailing slash. A fixed `openGraph.url` makes every page claim the homepage.
- Sitemap URLs must match `trailingSlash` exactly.
- Check `out/` for: robots, sitemap, 404, no leftover base-path or staging host; report size and files > 10 MB.
- Build in a clean `git worktree` of HEAD + only your changes when the owner has unrelated WIP in the tree.

## 3. `.htaccess` — rules that bite
- Only `.htaccess`-legal directives: **no `ServerSignature`/`ServerTokens`** (500 error).
- Never redirect `/.well-known/acme-challenge/` or `/pki-validation/` (AutoSSL).
- Ship HTTP→HTTPS and HSTS **commented behind a gate**; enable only after AutoSSL issued the cert — AutoSSL
  needs DNS pointing at the host first, and a premature redirect is an outage.
- HSTS: start `max-age=300`, raise to a year after two clean weeks; no `includeSubDomains`/`preload` when mail
  (Microsoft 365 / Google) lives on subdomains the host does not serve.
- CSP: if a meta CSP is already enforced and tested, add the header as **Report-Only** (plus `frame-ancestors`,
  which meta cannot carry). Two enforced policies intersect. `upgrade-insecure-requests` is ignored in Report-Only.
- `Permissions-Policy`: only feature names Chrome recognises (unknown ones — e.g. `interest-cohort` — log console errors).
- Next exports `app/icon.tsx`/`apple-icon.tsx` as **extensionless** files → `ForceType image/png`, or nosniff drops the favicon.
- Cache: `/_next/static/` 1 y immutable via `<If>` (merges after `<FilesMatch>`, so it wins); un-hashed media 30 d; HTML/RSC `.txt` `no-cache`.
- Brotli if present, Deflate otherwise; include `.glb`, SVG, JSON, manifest. Not mp4.
- Hidden files: `RewriteRule (^|/)\.(?!well-known(/|$)) - [F]`.

## 4. Local Apache proof
`docker run` `httpd:2.4` with `mod_rewrite`, `mod_headers`, `mod_deflate`, `mod_ssl`, `AllowOverride All`, a
self-signed cert, `out/` mounted read-only. `curl -I` with `--resolve host:port:127.0.0.1` for: www→apex,
http→https (gate on), `.well-known` not redirected, every header, 404 status + body, cache per type,
`Content-Encoding`, MIME types (incl. the extensionless icons). Docker Desktop crashing in its Model Runner/inference
service: turn that feature off (owner's settings change) — never "Reset to factory defaults".

## 5. Pipeline (template in references/)
SHA-pinned actions; `permissions: contents: read`; `concurrency` that never cancels an upload; skip
Puppeteer/Playwright browser downloads in `npm ci`; the project's own checks before the build; export checks;
rsync over SSH with `--checksum`, **no `--delete`**, two passes (assets, then HTML/RSC); host key pinned via a
secret; refuse a target path that does not end in `/public_html/`. Rejected: FTP-Deploy-Action (FTP/FTPS, not SFTP),
lftp `--only-newer` (mtime → full re-upload). Secrets: host, user, port (optional), path, private key, known_hosts.

## 6. DNS cutover (owner executes)
- Record a baseline first (`Resolve-DnsName … -Server 1.1.1.1`): A, CNAME www, MX, SPF, verification TXT, DKIM
  selectors, DMARC, autodiscover, NS.
- Change only `A @` (remove parking/forwarding records and any GoDaddy Forwarding) and keep `CNAME www → @`.
- Re-read the baseline after propagation; send a test mail from outside.
- Preview the server before DNS: `curl -I --resolve example.com:80:<ip> http://example.com/`.

## 7. Production extras worth adding
`/.well-known/security.txt` (RFC 9116: Contact + Expires; no links into a private repo), `/llms.txt` generated
from the content source (so it cannot drift), web manifest + `theme-color` from tokens, `SECURITY.md`, a README
with the runbook link, `.nvmrc`, `.editorconfig`.

## Never
Commit credentials · force-push or rewrite history without approval · touch MX/SPF/DKIM/DMARC/autodiscover ·
enforce an untested CSP · enable the HTTPS redirect before the certificate exists · `--delete` on shared hosting.
