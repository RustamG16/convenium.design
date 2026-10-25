// One graph engine for every node view: System pipeline, Knowledge connections and the
// Operator-style neural/radial brain maps. Deterministic layouts only; nodes are real DOM
// (focusable buttons) with SVG edges underneath, and every graph has a list twin.
import { h } from './dom.js';
import { icon } from './icons.js';

const SVGNS = 'http://www.w3.org/2000/svg';

function anchor(n, side) {
  switch (side) {
    case 'left': return [n.x, n.y + n.h / 2];
    case 'right': return [n.x + n.w, n.y + n.h / 2];
    case 'top': return [n.x + n.w / 2, n.y];
    case 'bottom': return [n.x + n.w / 2, n.y + n.h];
    default: return [n.x + n.w / 2, n.y + n.h / 2];
  }
}

function autoSides(a, b) {
  const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
  const dy = (b.y + b.h / 2) - (a.y + a.h / 2);
  if (Math.abs(dx) > Math.abs(dy) * 0.9) return dx > 0 ? ['right', 'left'] : ['left', 'right'];
  return dy > 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

export function edgePath(a, b, fromSide, toSide, curve = 'bezier') {
  const [s1, s2] = fromSide && toSide ? [fromSide, toSide] : autoSides(a, b);
  const [x1, y1] = anchor(a, s1);
  const [x2, y2] = anchor(b, s2);
  if (curve === 'straight') return { d: `M${x1},${y1} L${x2},${y2}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2] };
  const horizontal = s1 === 'left' || s1 === 'right';
  const k = horizontal ? Math.max(30, Math.abs(x2 - x1) * 0.5) : Math.max(24, Math.abs(y2 - y1) * 0.5);
  const c1 = horizontal ? [x1 + (s1 === 'right' ? k : -k), y1] : [x1, y1 + (s1 === 'bottom' ? k : -k)];
  const c2 = horizontal ? [x2 + (s2 === 'left' ? -k : k), y2] : [x2, y2 + (s2 === 'top' ? -k : k)];
  // Midpoint of the cubic at t = .5
  const mid = [0.125 * x1 + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * x2, 0.125 * y1 + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * y2];
  return { d: `M${x1},${y1} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`, mid };
}

/**
 * createGraph({ width, height, nodes, edges, title, legend, onSelect, minimap, zoomControls })
 * nodes: { id, x, y, w, h, el (HTMLElement), tone, label }
 * edges: { from, to, tone, dashed, label, flow, fromSide, toSide, arrow, curve, width, opacity }
 */
export function createGraph(opts) {
  const { width, height, nodes, edges = [], onSelect = null, minimap = false, zoomControls = true, className = '', background = null } = opts;
  const byId = new Map(nodes.map(n => [n.id, n]));
  let scale = 1, tx = 0, ty = 0, fitted = 1;

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'g-edges');
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(SVGNS, 'defs');
  for (const tone of ['green', 'blue', 'amber', 'coral', 'pink', 'purple', 'grey', 'white']) {
    const m = document.createElementNS(SVGNS, 'marker');
    m.setAttribute('id', `arrow-${tone}-${opts.id || 'g'}`); m.setAttribute('viewBox', '0 0 10 10'); m.setAttribute('refX', '8.5'); m.setAttribute('refY', '5');
    m.setAttribute('markerWidth', '7'); m.setAttribute('markerHeight', '7'); m.setAttribute('orient', 'auto-start-reverse');
    const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', 'M0,0 L10,5 L0,10 z'); p.setAttribute('class', `arrowhead t-${tone}`);
    m.append(p); defs.append(m);
  }
  svg.append(defs);

  const labels = h('div', { class: 'g-labels' });
  const edgeEls = [];
  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) continue;
    const { d, mid } = edgePath(a, b, e.fromSide, e.toSide, e.curve);
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', `g-edge t-${e.tone || 'blue'}${e.dashed ? ' dashed' : ''}${e.dotted ? ' dotted' : ''}${e.flow ? ' flow' : ''}`);
    if (e.width) path.style.strokeWidth = e.width;
    if (e.opacity) path.style.opacity = e.opacity;
    if (e.arrow !== false) path.setAttribute('marker-end', `url(#arrow-${e.tone || 'blue'}-${opts.id || 'g'})`);
    path.dataset.from = e.from; path.dataset.to = e.to;
    svg.append(path);
    edgeEls.push(path);
    if (e.label) labels.append(h('span', { class: `g-edge-label t-${e.tone || 'blue'}`, style: { left: `${mid[0]}px`, top: `${mid[1]}px` } }, e.label));
  }

  const nodeLayer = h('div', { class: 'g-nodes' });
  for (const n of nodes) {
    const el = n.el;
    el.classList.add('g-node');
    el.dataset.node = n.id;
    Object.assign(el.style, { left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: n.autoH ? 'auto' : `${n.h}px` });
    if (onSelect && n.selectable !== false) {
      el.addEventListener('click', ev => { ev.stopPropagation(); select(n.id); });
      el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n.id); } });
      if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') el.setAttribute('tabindex', '0');
    }
    nodeLayer.append(el);
  }

  const world = h('div', { class: 'g-world', style: { width: `${width}px`, height: `${height}px` } }, background, svg, labels, nodeLayer);
  const viewport = h('div', { class: `g-viewport ${className}`.trim() }, world);
  const zoomLabel = h('span', { class: 'g-zoom-val' }, '100%');

  function apply() {
    world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round((scale / fitted) * 100)}%`;
    updateMini();
  }
  function fit() {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width) return;
    const s = Math.min(rect.width / width, rect.height / height);
    fitted = scale = s;
    tx = (rect.width - width * s) / 2; ty = (rect.height - height * s) / 2;
    apply();
  }
  function zoom(f) {
    const rect = viewport.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const ns = Math.max(fitted * 0.5, Math.min(fitted * 2.5, scale * f));
    tx = cx - (cx - tx) * (ns / scale); ty = cy - (cy - ty) * (ns / scale); scale = ns; apply();
  }
  // Drag to pan (layout only — dragging never changes execution).
  let drag = null;
  viewport.addEventListener('pointerdown', ev => { if (ev.target.closest('.g-node, button, a')) return; drag = { x: ev.clientX, y: ev.clientY, tx, ty }; viewport.setPointerCapture(ev.pointerId); viewport.classList.add('panning'); });
  viewport.addEventListener('pointermove', ev => { if (!drag) return; tx = drag.tx + ev.clientX - drag.x; ty = drag.ty + ev.clientY - drag.y; apply(); });
  viewport.addEventListener('pointerup', () => { drag = null; viewport.classList.remove('panning'); });
  viewport.addEventListener('wheel', ev => { if (!ev.ctrlKey) return; ev.preventDefault(); zoom(ev.deltaY < 0 ? 1.1 : 0.9); }, { passive: false });

  const controls = zoomControls ? h('div', { class: 'g-zoom' },
    h('button', { type: 'button', 'aria-label': 'Zoom out', onclick: () => zoom(0.85) }, icon('Minus')), zoomLabel,
    h('button', { type: 'button', 'aria-label': 'Zoom in', onclick: () => zoom(1.18) }, icon('Plus')),
    h('button', { type: 'button', 'aria-label': 'Fit to view', onclick: fit }, icon('Maximize'))) : null;

  let mini = null, miniView = null;
  if (minimap) {
    const ms = 150 / width;
    mini = h('div', { class: 'g-minimap', 'aria-hidden': 'true' }, h('div', { class: 'g-mini-head' }, 'Minimap', icon('Maximize2')));
    const msvg = document.createElementNS(SVGNS, 'svg');
    msvg.setAttribute('viewBox', `0 0 ${width} ${height}`); msvg.setAttribute('class', 'g-mini-svg');
    for (const n of nodes) {
      if (n.mini === false) continue;
      const r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', n.x); r.setAttribute('y', n.y); r.setAttribute('width', n.w); r.setAttribute('height', n.h);
      r.setAttribute('class', `t-${n.tone || 'grey'}`); msvg.append(r);
    }
    miniView = document.createElementNS(SVGNS, 'rect'); miniView.setAttribute('class', 'g-mini-view'); msvg.append(miniView);
    mini.append(msvg);
    void ms;
  }
  function updateMini() {
    if (!miniView) return;
    const rect = viewport.getBoundingClientRect();
    miniView.setAttribute('x', -tx / scale); miniView.setAttribute('y', -ty / scale);
    miniView.setAttribute('width', rect.width / scale); miniView.setAttribute('height', rect.height / scale);
  }

  function select(id) {
    for (const n of nodes) n.el.classList.toggle('selected', n.id === id);
    for (const p of edgeEls) p.classList.toggle('hot', p.dataset.from === id || p.dataset.to === id);
    onSelect?.(id);
  }

  const root = h('div', { class: 'g-root' }, viewport, controls, mini);
  const ro = new ResizeObserver(() => fit());
  ro.observe(viewport);
  return { root, viewport, world, fit, zoom, select, edges: edgeEls, nodes, destroy: () => ro.disconnect() };
}

/* ---------- Layout helpers ---------- */

// Radial rings: items laid around a centre at the given radius, starting at angle0 (radians).
export function ring(items, cx, cy, radius, angle0 = -Math.PI / 2, spread = Math.PI * 2) {
  const n = items.length;
  return items.map((item, i) => {
    const a = angle0 + (spread === Math.PI * 2 ? (i / n) * spread : n === 1 ? spread / 2 : (i / (n - 1)) * spread);
    return { ...item, cx: cx + Math.cos(a) * radius, cy: cy + Math.sin(a) * radius, angle: a };
  });
}

// Small Operator-style node: glowing ring with an icon and a mono caption below.
export function neuralNode({ ico = 'User', label, tone = 'green', size = 30, caption = true, title = null, dim = false }) {
  return h('button', { type: 'button', class: `nnode t-${tone}${dim ? ' dim' : ''}`, 'aria-label': title || label, title: title || label, style: { '--s': `${size}px` } },
    h('span', { class: 'nnode-ring' }, icon(ico)), caption ? h('span', { class: 'nnode-cap' }, label) : null);
}

// List twin of any graph: same node ids, keyboard-reachable, used on mobile and in List mode.
export function graphList(rows, onSelect, columns = ['Node', 'Type', 'Status']) {
  return h('div', { class: 'g-list', role: 'table', 'aria-label': 'Graph as list' },
    h('div', { class: 'g-list-row head', role: 'row' }, columns.map(c => h('span', { role: 'columnheader' }, c))),
    rows.map(r => h('button', { type: 'button', class: 'g-list-row', role: 'row', dataset: { node: r.id }, onclick: () => onSelect?.(r.id) },
      r.cells.map((c, i) => h('span', { role: 'cell', class: i === 0 ? 'first' : '' }, c)))));
}
