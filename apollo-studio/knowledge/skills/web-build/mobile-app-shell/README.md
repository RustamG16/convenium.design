# Mobile App Shell

- Category: Web Build
- Phase: build
- Status: active
- Routed: yes
- Skill ID: mobile-app-shell

Rebuild a site's phone experience when mobile pages are too long, unoptimized or below current standards. Owns per-page screen budgets, the 2026 standards floor (fluid type, container queries, svh/dvh, touch targets, INP), phone-sized scroll-scrub runways and frame sets, a thumb-zone tab bar, safe areas on all four sides, cheap phone motion, and the verification rules that catch what emulated tests miss. Use when asked to rebuild or optimize a site's mobile resolution, when a site must work as the primary phone experience (360–430 px wide), when scroll-driven video is soft or stutters on phones, or before sharing a concept most visitors will open on a phone.

## Runtime instructions

Treat the 360–430 px phone band as the primary layout: measure first (screens per route, overflow, tap targets at 390×844), hold each route to its screen budget (home ≤ 16, others ≤ 12), hold the 2026 standards floor — clamp() type between the committed ramp numbers, container queries for components, 100svh heroes and 100dvh sticky stages, ≥ 44 px primary targets with a 24 px hard floor, 16 px inputs, INP ≤ 200 ms, no overflow from 320 px — size scrub runways and frame sets for phones, and verify reduced motion by computed opacity, live-scroll lag on 4G and production cache headers.
