# Reference Extraction

Goal: reverse-engineer the *system* behind a reference — the rules its designer followed — so you can apply those rules to different content. You are not copying pixels; you are recovering the grammar.

## 1. Capture screenshot evidence

Capture the full page and the key above-the-fold sections so you can reason about hierarchy, pacing, and composition visually (numbers alone miss the feel).

Tool options, in rough order of preference:
- **Claude in Chrome** (`navigate`, then `computer` screenshot / `read_page` / `get_page_text` / `javascript_tool`) when available — it can render the live site, scroll, and read the real DOM and computed styles. This is the richest source.
- **web_fetch** on the reference URL to pull markup and linked CSS when a live browser isn't available. You won't get computed styles or runtime motion, but you get structure, class names, font links, and often the CSS variables.
- If the user supplied a screenshot directly, read it as the visual evidence and infer tokens from it.

Capture at least: the hero (above the fold), one content section, and the footer. Note the scroll behavior as you go (does the header pin? do sections snap? does anything pin-and-scrub?).

## 2. Extract visual tokens

Pull the concrete values, not impressions. When you have a live DOM (Chrome), read computed styles via `javascript_tool`; otherwise infer from the fetched CSS and screenshots.

Useful `javascript_tool` probes when the live page is available:

```js
// Color tokens — sample computed colors from prominent elements + any CSS custom props
const root = getComputedStyle(document.documentElement);
const cssVars = Array.from(document.styleSheets)
  .flatMap(s => { try { return Array.from(s.cssRules); } catch { return []; } })
  .filter(r => r.style)
  .flatMap(r => Array.from(r.style).filter(p => p.startsWith('--'))
    .map(p => [p, r.style.getPropertyValue(p).trim()]));
// dedupe + report
```

```js
// Type system — sample headings and body
['h1','h2','h3','p','a','button'].map(sel => {
  const el = document.querySelector(sel); if (!el) return null;
  const cs = getComputedStyle(el);
  return { sel, family: cs.fontFamily, weight: cs.fontWeight,
           size: cs.fontSize, tracking: cs.letterSpacing,
           leading: cs.lineHeight, transform: cs.textTransform };
}).filter(Boolean);
```

```js
// Spacing & shape — radii, section padding, gaps
['section','.container','main > *','button','[class*="card"]'].map(sel => {
  const el = document.querySelector(sel); if (!el) return null;
  const cs = getComputedStyle(el);
  return { sel, radius: cs.borderRadius, padY: cs.paddingTop,
           gap: cs.gap, maxWidth: cs.maxWidth };
}).filter(Boolean);
```

Record into the brief:
- **Color tokens** — 3–6 dominant colors with hex + role (background/ink/accent). Note if it's a near-monochrome system with one loud accent (very common in award work) vs. a fuller palette.
- **Type** — display family + weight + tracking (award headings are often a serif or a grotesk at heavy weight with negative tracking); body family; the size ratio between H1/H2/body.
- **Spacing rhythm** — is there generous whitespace? a consistent vertical rhythm? tight brutalist density?
- **Radii & borders** — sharp (0) reads editorial/brutalist; large radii read soft/friendly.
- **Button treatments** — fill vs. outline vs. text; pill vs. sharp; hover behavior.

## 3. Inspect structure

From the DOM / markup:
- **Hero composition** — single column? split-screen? full-bleed media? oversized type with a small supporting block?
- **Section ordering** — the narrative sequence (hero → proof → offering → story → CTA). The *order* is part of the pacing.
- **Navigation behavior** — fixed/sticky? transparent-over-hero then solid? hamburger-into-overlay? Does it hide on scroll-down and reveal on scroll-up?
- **CTAs** — how many, where, how emphasized.
- **Trust signals** — logos, testimonials, stats, certifications; where they sit in the flow.

## 4. Detect animation cues

This is where award sites earn the trophy. Look for:
- **Smooth-scroll library** — Lenis (look for `lenis`/`data-lenis` classes or a transformed scroll container), Locomotive (`data-scroll`), or native. The presence of one signals the whole motion budget.
- **Reveal patterns** — opacity + `translateY` on enter; character/word/line staggers on headings; clip-path/mask wipes on images.
- **Pinned / sticky regions** — sections that hold while inner content scrubs (horizontal galleries, step sequences). In Chrome, scroll and watch for `position: sticky` or transform-pinned containers.
- **Parallax** — layers moving at different rates on scroll.
- **Cursor effects** — custom cursor, magnetic buttons, hover-grow blend-mode cursors.
- **Marquees** — infinite-scrolling logo or text strips.

In Chrome you can sample what's animating mid-scroll:

```js
// Find elements currently carrying transforms/transitions (run while scrolled into a section)
Array.from(document.querySelectorAll('*')).filter(el => {
  const cs = getComputedStyle(el);
  return cs.transform !== 'none' || parseFloat(cs.transitionDuration) > 0;
}).slice(0, 25).map(el => el.className || el.tagName);
```

## 5. Summarize — principles, not a clone

Close the phase by writing the **Visual Brief** (shape defined in SKILL.md Phase 2). Translate everything above into reusable rules:

- *Mood* (the adjective stack)
- *Hierarchy* (how dominant is the headline; how quiet is everything else)
- *Pacing* (calm sections vs. loud moments; where the motion spikes)
- *Typographic rhythm* (the scale and tracking discipline)
- *Interaction vocabulary* (the 2–4 signature motions to carry forward)

Explicitly note what you are **not** taking: the exact copy, imagery, logo, and literal layout. Those are theirs. The system is what transfers.
