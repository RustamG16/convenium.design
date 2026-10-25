// Tiny DOM helpers. Every view builds real nodes; no innerHTML with data.

export function h(tag, attrs = {}, ...children) {
  const svgTags = new Set(['svg', 'path', 'g', 'line', 'circle', 'rect', 'polyline', 'polygon', 'text', 'defs', 'marker', 'linearGradient', 'radialGradient', 'stop', 'ellipse', 'image', 'title', 'pattern', 'filter', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'clipPath', 'animate']);
  const el = svgTags.has(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') el.setAttribute('class', value);
      else if (key === 'style' && typeof value === 'object') { for (const [k, v] of Object.entries(value)) { if (k.startsWith('--')) el.style.setProperty(k, v); else el.style[k] = v; } }
      else if (key === 'dataset') Object.assign(el.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'html') el.innerHTML = value; // only ever used with static, trusted markup
      else if (value === true) el.setAttribute(key, '');
      else el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const clear = el => { while (el.firstChild) el.firstChild.remove(); return el; };
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function fmtTime(date = new Date()) {
  const d = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  const t = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${d}   ${t}`;
}

export function titleCase(id = '') {
  return String(id).split(/[-_ ]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function toast(message, tone = 'green', iconNode = null) {
  let host = document.querySelector('.toasts');
  if (!host) { host = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  const node = h('div', { class: `toast ${tone}` }, iconNode, h('span', {}, message));
  host.append(node);
  setTimeout(() => node.remove(), 3600);
}

export function confirmModal({ title, body, confirm = 'Confirm', tone = 'green', cancel = 'Cancel' }) {
  return new Promise(resolve => {
    const close = value => { back.remove(); resolve(value); };
    const ok = h('button', { class: `btn ${tone === 'danger' ? 'danger' : tone === 'dark' ? '' : 'green'}`, onclick: () => close(true) }, confirm);
    const back = h('div', { class: 'modal-back', onclick: e => { if (e.target === back) close(false); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('h2', {}, title), typeof body === 'string' ? h('p', {}, body) : body,
        h('div', { class: 'actions' }, h('button', { class: 'btn outline', onclick: () => close(false) }, cancel), ok)));
    back.addEventListener('keydown', e => { if (e.key === 'Escape') close(false); });
    document.body.append(back);
    ok.focus();
  });
}
