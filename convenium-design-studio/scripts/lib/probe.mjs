// The in-page measurement. Serialised into the page by ui-metrics.mjs, so it must be
// self-contained: no imports, no closures over module scope.
export const PROBE_SOURCE = String(function conveniumDesignProbe(scope, revealDisclosures) {
  // A control inside a shut <details> is one click from being a real target, so it is
  // measured for real rather than guessed at: the disclosure is opened, the control is
  // measured, and the disclosure is put back. A control with no box because the panel it
  // lives in is not currently rendered cannot be measured at all, and is reported as
  // unmeasured rather than counted as a failure - a number that cannot be driven to zero
  // by fixing anything is not a threshold.
  const reopened = [];
  if (revealDisclosures) {
    for (const d of document.querySelectorAll('details:not([open])')) { d.open = true; reopened.push(d); }
  }
  const CHROME_SELECTOR = '.app-shell > header, .topbar, #topbar, body > header';

  const parseRgb = value => {
    if (!value) return null;
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const luminance = c => {
    const ch = v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };

  const contrast = (a, b) => {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    let node = el;
    while (node && node !== document.documentElement) {
      const s = getComputedStyle(node);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (s.clipPath === 'inset(50%)' || (s.position === 'absolute' && s.clip === 'rect(0px, 0px, 0px, 0px)')) return false;
      node = node.parentElement;
    }
    return true;
  };

  // Effective background behind an element: composite every translucent layer up the tree.
  const backdrop = el => {
    let stack = [];
    let node = el;
    let imageBacked = false;
    while (node) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') imageBacked = true;
      const c = parseRgb(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 0.999) break; }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return { color: base, imageBacked };
  };

  // Scope rule: a view is the active view only, and the persistent chrome is measured once
  // as its own scope. Counting the chrome inside every view would multiply one defect by
  // eight; section 02 of LOADOUT-PLAN.md counted the same way, and this reproduces its
  // 165 contrast failures exactly. The chrome's own numbers are added to the totals once.
  const chromeRoots = Array.from(document.querySelectorAll(CHROME_SELECTOR));
  const roots = scope === 'chrome'
    ? chromeRoots
    : [document.querySelector('.view.is-active') || document.body];
  const inChrome = el => chromeRoots.some(r => r.contains(el));

  const text = [];
  const sizeTally = {};
  for (const root of roots) {
    if (!root) continue;
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (scope !== 'chrome' && inChrome(el)) continue;
      const own = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3 && n.textContent.trim().length)
        .map(n => n.textContent.trim()).join(' ');
      if (!own) continue;
      // Text inside a collapsed disclosure is still text: a 9px label does not stop being
      // 9px because a <details> is shut. It counts for the size floor (T1) but not for
      // contrast (T4), which only means something for pixels actually on screen. This is
      // the rule section 02 of LOADOUT-PLAN.md used, and it reproduces its counts exactly.
      const rendered = visible(el);
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const fg = parseRgb(cs.color) || { r: 0, g: 0, b: 0, a: 1 };
      const bd = backdrop(el);
      const composited = fg.a < 1 ? over(fg, bd.color) : fg;
      const ratio = contrast(composited, bd.color);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      sizeTally[size.toFixed(1)] = (sizeTally[size.toFixed(1)] || 0) + 1;
      text.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : '',
        sample: own.slice(0, 40),
        size, weight,
        family: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        ratio: Math.round(ratio * 100) / 100,
        need,
        rendered,
        pass: rendered ? ratio >= need : true,
        imageBacked: bd.imageBacked,
      });
    }
  }

  const CONTROL_SELECTOR = [
    'a[href]', 'button', 'input:not([type=hidden])', 'select', 'textarea',
    'summary', '[role=button]', '[role=tab]', '[role=switch]', '[role=checkbox]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const activationArea = el => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (el.tagName !== 'INPUT' || (type !== 'checkbox' && type !== 'radio')) return el;
    const wrapping = el.closest('label');
    if (wrapping) return wrapping;
    if (el.id) {
      const bound = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (bound) return bound;
    }
    return el;
  };

  const controls = [];
  const unmeasured = [];
  const measured = new Set();
  for (const root of roots) {
    if (!root) continue;
    for (const el of root.querySelectorAll(CONTROL_SELECTOR)) {
      if (scope !== 'chrome' && inChrome(el)) continue;
      // The target is the activation area, not the widget. A 20px checkbox inside a 36px
      // label is a 36px target, and a checkbox hidden behind a styled switch track is the
      // size of its label. Measuring the <input> alone would report a defect that is not
      // there and hide the one that is - a label that really is too short.
      const hit = activationArea(el);
      if (hit !== el && measured.has(hit)) continue;
      measured.add(hit);
      const rect = hit.getBoundingClientRect();
      const w = Math.round(rect.width * 100) / 100;
      const h = Math.round(rect.height * 100) / 100;
      // A control with no box is either inside a collapsed disclosure or visually hidden
      // behind a proxy. Both are recorded: the first is a real target once revealed.
      if (!visible(hit) || w === 0 || h === 0) {
        unmeasured.push({
          tag: el.tagName.toLowerCase(),
          cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : '',
          inDisclosure: el.closest('details:not([open])') != null,
        });
        continue;
      }
      controls.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : '',
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 32),
        w, h, min: Math.min(w, h),
      });
    }
  }

  // Non-text contrast (WCAG 1.4.11, and DESIGN.md's Contrast Rule: "Boundaries that carry
  // meaning meet 3:1"). T4 only ever looked at text, so a control edge at 2.5:1 passed. This
  // walks the boundary of every interactive control and measures the border it is drawn with
  // against the surface immediately outside it. A control with no border at all delineates by
  // fill or context and is a separate question; it is skipped, not failed.
  const BOUNDARY_SELECTOR = [
    'button', 'input:not([type=hidden]):not([type=checkbox]):not([type=radio])',
    'select', 'textarea', '[role=switch]', '.switch-track',
  ].join(',');
  const boundaries = [];
  for (const root of roots) {
    if (!root) continue;
    for (const el of root.querySelectorAll(BOUNDARY_SELECTOR)) {
      if (scope !== 'chrome' && inChrome(el)) continue;
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      // A transparent border is a layout placeholder (so a state can add a coloured edge with
      // no shift), not a boundary. Only an actually-painted border counts.
      const sides = ['Top', 'Right', 'Bottom', 'Left']
        .map(s => ({ w: parseFloat(cs['border' + s + 'Width']) || 0, style: cs['border' + s + 'Style'], raw: parseRgb(cs['border' + s + 'Color']), color: cs['border' + s + 'Color'] }))
        .filter(b => b.w >= 1 && b.style !== 'none' && b.style !== 'hidden' && b.raw && b.raw.a >= 0.15);
      // One or two painted sides is a separator or rule between grouped items - DESIGN.md
      // permits --line there. Only a box the control is fully enclosed by (>=3 sides) is a
      // sole boundary, which is what WCAG 1.4.11 and the Contrast Rule require to reach 3:1.
      if (sides.length < 3) continue;
      const outside = backdrop(el.parentElement || el);
      const inside = backdrop(el);
      let best = 0, worstColor = sides[0].color;
      for (const b of sides) {
        const composited = b.raw.a < 1 ? over(b.raw, outside.color) : b.raw;
        // The edge is legible if it stands out from EITHER the surface outside the control or
        // the fill inside it - whichever it manages. 1.4.11 asks for 3:1 against adjacent
        // colour, and a border between two surfaces has two.
        const r = Math.max(contrast(composited, outside.color), contrast(composited, inside.color));
        if (r > best) { best = r; worstColor = b.color; }
      }
      boundaries.push({
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
        ratio: Math.round(best * 100) / 100,
        pass: best >= 3,
        color: worstColor,
      });
    }
  }

  // T9: does the view carry an empty state and a primary action?
  const view = scope === 'chrome' ? roots[0] : (document.querySelector('.view.is-active') || document.body);
  const emptyStates = view ? view.querySelectorAll('.empty-state,[data-empty-state]').length : 0;
  const primaryActions = view ? view.querySelectorAll('.primary-action,[data-primary-action]').length : 0;
  const emptyStateHasAction = view
    ? Array.from(view.querySelectorAll('.empty-state,[data-empty-state]'))
        .some(n => n.querySelector('button,a[href],[role=button]')) : false;

  // T11: destructive controls without a declared undo path.
  const DESTRUCTIVE = /\b(delete|remove|clear|reset|discard|erase|revoke)\b/i;
  const destructive = [];
  for (const root of roots) {
    if (!root) continue;
    for (const el of root.querySelectorAll('button,[role=button],a[href]')) {
      if (scope !== 'chrome' && inChrome(el)) continue;
      if (!visible(el)) continue;
      const label = ((el.getAttribute('aria-label') || '') + ' ' + el.textContent).trim();
      const cls = typeof el.className === 'string' ? el.className : '';
      if (!DESTRUCTIVE.test(label) && !/danger/.test(cls)) continue;
      destructive.push({
        label: label.slice(0, 40),
        cls: cls.slice(0, 50),
        hasUndo: el.hasAttribute('data-undo') || el.closest('[data-undo]') != null,
      });
    }
  }

  // Document scrollWidth alone misses an element that spills past the viewport inside a
  // container that happens to clip or scroll. The element-level sweep is what actually
  // catches a grid child refusing to shrink, which is the common cause.
  const viewportWidth = document.documentElement.clientWidth;
  const spills = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= viewportWidth + 1) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') continue;
    // Content extending past the viewport inside a container that scrolls is not overflow -
    // it is a diagram or a table doing what DESIGN.md asks of wide content. Only a spill the
    // user cannot reach counts.
    let scroller = el.parentElement, reachable = false;
    while (scroller) {
      const sc = getComputedStyle(scroller);
      if (/(auto|scroll)/.test(sc.overflowX) && scroller.scrollWidth > scroller.clientWidth) { reachable = true; break; }
      scroller = scroller.parentElement;
    }
    if (reachable) continue;
    spills.push({
      tag: el.tagName.toLowerCase(),
      cls: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
      by: Math.round(rect.right - viewportWidth),
      sample: (el.textContent || '').trim().slice(0, 32),
    });
  }
  // Clipped inside a component, rather than past the viewport. A caption cut off by its own
  // card is as unreadable as one pushed off the page, and a viewport test cannot see it.
  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (!visible(el)) continue;
    if (el.children.length) continue;
    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (/(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflowY)) {
        const box = node.getBoundingClientRect();
        const cut = Math.max(0, rect.right - box.right) + Math.max(0, rect.bottom - box.bottom)
          + Math.max(0, box.left - rect.left) + Math.max(0, box.top - rect.top);
        if (cut > 2) clipped.push({
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
          sample: (el.textContent || '').trim().slice(0, 28),
          cut: Math.round(cut),
        });
        break;
      }
      node = node.parentElement;
    }
  }

  const overflow = {
    clipped: clipped.slice(0, 10),
    clippedCount: clipped.length,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: viewportWidth,
    spills: spills.slice(0, 10),
    spillCount: spills.length,
  };
  overflow.horizontal = Math.max(
    overflow.scrollWidth - overflow.clientWidth,
    spills.reduce((worst, item) => Math.max(worst, item.by), 0)
  );

  const bodySize = parseFloat(getComputedStyle(document.body).fontSize);
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const families = Array.from(new Set(text.map(t => t.family))).sort();

  for (const d of reopened) d.open = false;

  return { text, controls, unmeasured, boundaries, sizeTally, emptyStates, primaryActions, emptyStateHasAction, destructive, overflow, bodySize, rootSize, families };
});
