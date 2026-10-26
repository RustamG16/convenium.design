// Component builders shared by every view. They mirror css/components.css.
import { h } from './dom.js';
import { icon } from './icons.js';

export const btn = (label, { tone = '', ico = null, icoRight = null, href = null, onClick = null, size = '', attrs = {} } = {}) => {
  const cls = `btn ${tone} ${size}`.trim();
  const kids = [ico ? icon(ico) : null, label ? h('span', {}, label) : null, icoRight ? icon(icoRight) : null];
  return href ? h('a', { class: cls, href, ...attrs }, kids) : h('button', { class: cls, type: 'button', onclick: onClick, ...attrs }, kids);
};

export const badge = (text, tone = 'grey', ico = null, lg = false) => h('span', { class: `badge ${tone}${lg ? ' lg' : ''}` }, ico ? icon(ico) : null, text);
export const tag = (text, tone = '', ico = null) => h('span', { class: `tag ${tone}`.trim() }, ico, text);
export const label = (text, tone = '') => h('span', { class: `label ${tone}`.trim() }, text);
export const demoFlag = (text = 'Demo data') => h('span', { class: 'demo-flag', title: 'Illustrative Northstar walkthrough data, not a recorded Convenium.Design run.' }, icon('FlaskConical'), text);

export function banner(tone, title, sub, extra = null) {
  return h('div', { class: `banner ${tone}`, role: 'status' }, h('i', { class: 'dot' }), h('div', {}, h('strong', {}, title), sub ? h('span', {}, sub) : null, extra));
}

export function pageHead({ eyebrow, title, sub, hero = false, eyebrowTone = '', actions = null, quote = true, extra = null, titleTag = 'h1' }) {
  return h('header', { class: 'page-head' },
    h('div', { class: 'titles' },
      eyebrow ? h('p', { class: `eyebrow ${eyebrowTone}`.trim() }, eyebrow) : null,
      h(titleTag, { class: `display${hero ? ' hero' : ''}`, id: 'page-title', tabindex: '-1' }, title),
      sub ? h('p', { class: 'subline' }, sub) : null),
    extra,
    actions ? h('div', { class: 'head-actions' }, actions) : null,
    quote && !actions ? h('div', { class: 'quote' }, '"A higher standard', h('br'), 'for creative work."', h('br'), '// Convenium.Design') : null);
}

export function projectHead({ title = 'Northstar', sub, status = null, actions = null, iconBox = false }) {
  return h('header', { class: 'page-head project-head' },
    iconBox ? h('div', { class: 'proj-ico' }, icon('Folder')) : null,
    h('div', { class: 'titles' }, h('p', { class: 'eyebrow' }, 'Project'), h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, title), sub ? h('p', { class: 'subline' }, sub) : null),
    status, actions ? h('div', { class: 'head-actions' }, actions) : null);
}

export function tabs(items, active, { onSelect = null, cls = '' } = {}) {
  return h('nav', { class: `tabs ${cls}`.trim(), role: 'tablist' }, items.map(([id, text, href]) => {
    const on = id === active;
    const attrs = { role: 'tab', 'aria-selected': on ? 'true' : 'false', class: on ? 'on' : '', dataset: { tab: id } };
    return href ? h('a', { ...attrs, href }, text) : h('button', { ...attrs, type: 'button', onclick: () => onSelect?.(id) }, text);
  }));
}

export function segbar(total, done, now = -1, label = null) {
  return h('div', { class: 'segbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, 'aria-label': label || 'Progress' },
    Array.from({ length: total }, (_, i) => h('i', { class: i < done ? 'done' : i === now ? 'now' : '' })));
}

export function meter(pct, tone = '', labelText = 'Level') {
  return h('div', { class: `meter ${tone}`.trim(), role: 'meter', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': labelText }, h('i', { style: { width: `${Math.max(0, Math.min(100, pct))}%` } }));
}

export function checks(items) {
  return h('ul', { class: 'checks' }, items.map(([text, done]) => h('li', {}, h('span', { class: `check-ico ${done ? 'done' : 'todo'}` }, done ? icon('Check') : null), text)));
}

export function statusRing(tone) { return h('span', { class: `ring-dot ${tone}` }); }

export function kv(rows, cls = '') {
  return h('dl', { class: `kv ${cls}`.trim() }, rows.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]));
}

export function fileRow(name, meta = null, ico = 'FileText') {
  return h('div', { class: 'file' }, icon(ico), h('span', {}, name), meta ? h('small', {}, meta) : h('span'));
}

export function notice({ ico = 'Lightbulb', title, text, tone = '' }) {
  return h('div', { class: `notice ${tone}`.trim() }, icon(ico), h('div', {}, h('span', { class: 'label' }, title), h('p', {}, text)));
}

export function card(children, cls = '') { return h('section', { class: `card ${cls}`.trim() }, children); }

export function emptyState(title, text, action = null) {
  return h('div', { class: 'empty' }, h('strong', {}, title), h('p', {}, text), action);
}

// Right inspector panel; open state is mirrored on <body> so the dock can re-centre.
export function inspector(children, { label: ariaLabel = 'Details', boxed = false } = {}) {
  const panel = h('aside', { class: `inspector${boxed ? ' boxed' : ''}`, 'aria-label': ariaLabel },
    h('button', { class: 'icon-btn inspector-close', type: 'button', 'aria-label': 'Close details', onclick: () => document.body.classList.remove('inspector-shown') }, icon('X')),
    children);
  return panel;
}

export function inspectorToggle(text = 'Details') {
  return h('button', { class: 'btn outline sm inspector-toggle', type: 'button', onclick: () => document.body.classList.add('inspector-shown') }, icon('PanelRight'), text);
}

// A website preview rendered at a real desktop width and scaled down to fit its box,
// the way the mockups show a full site inside a card.
export function scaledFrame(src, title, designW = 1280, cls = '') {
  const frame = h('iframe', { src, title, loading: 'lazy', tabindex: '-1', style: { width: `${designW}px` } });
  const box = h('div', { class: `frame-scaler ${cls}`.trim() }, frame);
  const fit = () => {
    const w = box.clientWidth, hgt = box.clientHeight;
    if (!w) return;
    const s = w / designW;
    frame.style.transform = `scale(${s})`;
    frame.style.height = `${Math.ceil(hgt / s)}px`;
  };
  new ResizeObserver(fit).observe(box);
  return box;
}
