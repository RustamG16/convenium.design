---
name: domain-and-hosting-plan
description: Check and secure a domain through the GoDaddy connector, then size the hosting (static shell, backend, database, object storage, bandwidth) for a project's current footprint and a stated growth factor. Use for "buy a domain", "is example.com available", "which server do we need", "how much storage", "plan hosting for 5x growth", "point the domain at Vercel/Supabase/cPanel".
---

# Domain + hosting plan

Authored in Convenium.Design 2026-10-19 for the ArkhEthos domain request. Pair with `06-ops-security/static-site-apache-deploy`
when the target is GoDaddy cPanel, and with the project's own `ARCHITECTURE.md` for its stack.

## Hard limits
- **Never buy, renew, or add hosting yourself.** The GoDaddy connector exposes only `domains_check_availability`
  and `domains_suggest` — there is no purchase tool, and a purchase is the owner's action at checkout. Give
  the owner the registration link and the exact cart (domain, term, add-ons to decline).
- Never change DNS, create accounts, or provision paid plans. Write the records; the owner applies them.
- Never quote a price you did not read from a live source this session. The connector often returns
  `priceInfo: null` — say so and point to the checkout price instead of inventing one.

## 1. Domain
1. `domains_check_availability` with the exact name plus the defensive set the owner cares about
   (`.com` first; `.app`/`.io`/`.net` only if they protect the brand). One call, comma-separated.
2. Report: available / taken / premium (`inventoryType: "Premium"` costs more than standard).
3. Recommend one primary domain. Defensive extras only when the name is a brand that will be public.
4. Cart guidance for the owner: 1–2 year term with auto-renew on; **domain privacy on** (free at GoDaddy
   for most TLDs); decline GoDaddy website builder, email and hosting add-ons when the architecture
   hosts elsewhere — they are upsold at checkout and duplicate the real stack.
5. Registration link: `https://www.godaddy.com/domainsearch/find?domainToCheck=<domain>`.

## 2. Measure before sizing
Measure the real footprint; do not guess.
- Static shell: `du -sh dist` after `npm run build`; list files > 10 MB.
- Public media: `du -sh public/media`.
- Private objects that will live in object storage (uploads, imported media, backups).
- Database: row-count estimate × average row size; for Postgres, `select pg_size_pretty(pg_database_size(current_database()))`
  on the local instance when it runs.
- Traffic: users × sessions/day × transferred bytes per session (first load vs cached).

## 3. Size for growth
Multiply each line by the stated growth factor, then add 50 % headroom. Present one table:
component | today | ×N | with headroom | plan tier that fits | the tier's limit.

Choose the **hosting type** from the architecture, not the reverse:
- **Static SPA + managed backend (Supabase/Firebase):** no VPS. A static host (Vercel, Netlify, Cloudflare
  Pages, or GoDaddy cPanel via `static-site-apache-deploy`) plus the backend's own plan. This is the default
  for single-user or small-team apps.
- **Server-rendered app or long-running workers:** a container host or VPS — size vCPU/RAM from measured
  peak, not from a plan name.
- **Shared cPanel hosting** only for static output; it cannot run Postgres-backed auth or edge functions.

Check each tier's limits that bite for the use case: free-tier project pausing on inactivity, database
size, storage size, egress, backup retention, commercial-use terms. Read them from the provider's
pricing page this session (or mark them "last known — verify") before recommending.

## 4. DNS handoff
Write the records the owner enters at GoDaddy (DNS → Manage), for the chosen host — apex `A`/`ALIAS`,
`www` `CNAME`, any verification `TXT`. Keep existing `MX`/`TXT` mail records untouched. Note that TLS is
issued by the host after the records resolve.

## 5. Write it down
Record the decision in the project's `PROGRESS-AND-DECISIONS.md` (or equivalent): domain, availability
date, chosen hosting, the sizing table, and what the owner still has to do.
