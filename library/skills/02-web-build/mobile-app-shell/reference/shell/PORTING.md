# Porting the mobile shell to a site

The shell is three files and three HTML edits. Budget for one site: under an hour, no redesign.
Worked example: Hair & Beauty landing, 17.8 → 11.1 screens, 13 → 0 small targets, Oct 2026.

## 1. Files
Copy `mobile.css`, `mobile.js` next to the site's stylesheet. Link `mobile.css` **after** the
site's own CSS. `tab-bar.html` is pasted, not linked.

## 2. HTML edits
1. `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
2. Paste `tab-bar.html` before `</body>`: 4–5 cells, `data-tab` = section ids, last cell =
   the primary action (book / call / WhatsApp / inquiry). Hide the header CTA on phones —
   the action now lives in the thumb zone.
3. Wrap anything that may fold on phones in `<details class="m-fold" open>` with a
   `<summary class="m-fold-summary"><span>Label</span><span class="m-fold-icon" aria-hidden="true"></span></summary>`.
   Desktop and no-JS see it open; `mobile.js` closes it on phones. Candidates: comparison
   tables, optional extras, price lists, opening hours, long FAQs, process steps.

## 3. Length (layout first, content last)
Add `m-rail` to any card list (`<ul>`, `<ol>`, grid div) — it becomes a snap rail with the
next card peeking. Add `m-hide-phone` to decorative media that costs a whole screen.
Then the per-site block at the bottom of `mobile.css`: section padding, heading clamp, card
padding. Replace the worked-example selectors with the site's own.

## 4. Token map
The `:root` block in `mobile.css` reads `--accent`, `--on-accent`, `--surface`, `--ink`,
`--muted`, `--rule`, `--gutter`, `--font-sans` with fallbacks. If the site names them
differently, point them there — never hardcode a colour in the shell.

## 5. Stacks
- **Static HTML**: as above. One file per locale (`en/index.html` too).
- **Vite/React**: `tab-bar.html` becomes a `<TabBar/>` component; `mobile.js` logic into a
  `useEffect`; `mobile.css` imported once in the root.
- **Next.js**: same as React; tab bar in the root layout, `usePathname` for `aria-current`.
- **barbershop-kit / any template**: port into `template/` so every generated shop inherits it.

## 6. Verify (numbers, not impressions)
`node measure.mjs <url> --all` → screens, overflow, targets < 24 px, inputs < 16 px, tab bar
present, at 320/360/375/390/430. Budgets: home ≤ 10 screens (film sites ≤ 16), other routes
≤ 8, 0 small targets, 0 small inputs, no overflow. Encode as a test in the site's QA.
Check desktop at 1280 — the tab bar must be `display: none`, folds open, summaries hidden.
Then a real phone. Write `.olympus/07-qa.md` with the before/after table.
