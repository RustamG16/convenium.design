// The fixed shell: rail, top strip, footer marks and the persistent Oracle dock.
import { h, clear, fmtTime } from './dom.js';
import { icon, NAV_ICONS } from './icons.js';
import { RAIL } from './router.js';
import { store, mode, activeLoadout } from './store.js';
import { api } from './api.js';

let dockState = { selection: null, dismissed: new Set(), route: null, history: [] };

export function renderRail(route) {
  const rail = document.getElementById('rail');
  if (!rail.dataset.built) {
    rail.dataset.built = '1';
    rail.append(
      h('a', { class: 'brand', href: '#/home', 'aria-label': 'Convenium.Design home' },
        h('span', { class: 'brand-word' }, 'APOLLO', h('em', {}, '//')), h('span', { class: 'brand-sub' }, 'Build with agents')),
      h('nav', { class: 'nav', 'aria-label': 'Primary' }, RAIL.map((item, i) =>
        h('a', { href: item.href, dataset: { rail: item.id }, title: `${item.label} (Alt+${i + 1})` }, icon(NAV_ICONS[item.id]), h('span', {}, item.label)))),
      h('div', { class: 'rail-spacer', style: { flex: '1' } }),
      h('button', { class: 'rail-help', type: 'button', dataset: { action: 'open-tutorials' }, onclick: () => { location.hash = '#/tutorials'; } },
        h('img', { src: '/media/apollo/totem-head.webp', alt: '' }), h('span', {}, 'Tutorials & guide')),
      h('div', { class: 'rail-foot' }, h('span', {}, 'Higher ideas', h('br'), 'Faster execution'), h('em', {}, '//')));
  }
  for (const a of rail.querySelectorAll('[data-rail]')) {
    if (a.dataset.rail === route.rail) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

export function renderTopstrip(route) {
  const strip = clear(document.getElementById('topstrip'));
  const m = mode();
  const online = store.online;
  const dotCls = !online ? 'off' : m === 'live' ? '' : 'demo';
  const statusText = !online ? 'Oracle offline' : m === 'live' ? 'Oracle online' : 'Oracle online · demo';
  strip.append(
    h('button', { class: 'menu-btn', type: 'button', 'aria-label': 'Open navigation', onclick: () => document.body.classList.toggle('rail-open') }, icon('Menu')),
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, route.crumbs.flatMap(([text, href], i) => {
      const last = i === route.crumbs.length - 1;
      const node = href && !last ? h('a', { href }, text) : h('span', last ? { 'aria-current': 'page' } : {}, text);
      return i ? [h('span', { class: 'sep', 'aria-hidden': 'true' }, '/'), node] : [node];
    })),
    h('div', { class: 'strip-status' },
      h('span', { class: `live-dot ${dotCls}`, title: store.data.health?.modeDetail || '' }),
      h('span', { id: 'oracle-status' }, statusText),
      h('span', { class: 'divider' }),
      h('span', { class: 'when', id: 'clock' }, fmtTime()),
      h('button', { class: 'avatar', type: 'button', 'aria-label': 'Account' }, 'B')));
}

export function renderFooter() {
  if (document.querySelector('.ws-foot-left')) return;
  document.querySelector('.workspace').append(
    h('div', { class: 'ws-foot-left', 'aria-hidden': 'true' }, 'Convenium.Design v1.0.0'),
    h('div', { class: 'ws-foot-right', 'aria-hidden': 'true' }, '// Creative intelligence', h('br'), 'for a brighter tomorrow'));
}

const VIEW_CHIP = {
  home: ['House', 'Home'], journey: ['House', 'Experience'], projects: ['Folder', 'Projects'], project: ['FileText', 'Brief'], intake: ['FileText', 'Intake'],
  plan: ['CalendarDays', 'Plan'], configure: ['CodeXml', 'Configure'], playground: ['House', 'Playground'], work: ['House', 'Run 0248'], results: ['House', 'Results'],
  knowledge: ['BookOpen', 'Knowledge'], system: ['Database', 'System'], agents: ['UsersRound', 'Agents'], settings: ['Settings', 'Settings'], tutorials: ['GraduationCap', 'Tutorials'],
};

export function setDockSelection(selection) {
  dockState.selection = selection;
  if (selection) dockState.dismissed.delete(`sel:${selection.label}`);
  renderDockChips();
}

function chips() {
  const r = dockState.route;
  const list = [];
  if (r?.view !== 'projects' && r?.view !== 'settings' && r?.view !== 'tutorials' && r?.view !== 'agents') list.push({ id: 'project', ico: 'Folder', label: 'Northstar' });
  const v = VIEW_CHIP[r?.view];
  if (v) list.push({ id: 'view', ico: v[0], label: r?.view === 'project' ? (r.params.tab === 'overview' ? 'Overview' : r.params.tab[0].toUpperCase() + r.params.tab.slice(1)) : v[1] });
  if (r?.view === 'plan') list.push({ id: 'stage', ico: 'CodeXml', label: 'Build Plan' });
  if (r?.view === 'work') list.push({ id: 'task', ico: 'FileText', label: 'Implement' });
  if (dockState.selection) list.push({ id: `sel:${dockState.selection.label}`, ico: dockState.selection.ico || 'MousePointer2', label: dockState.selection.label });
  return list.filter(c => !dockState.dismissed.has(c.id));
}

function renderDockChips() {
  const top = document.querySelector('.dock-top');
  if (!top) return;
  const state = top.querySelector('.dock-state');
  for (const c of [...top.querySelectorAll('.chip')]) c.remove();
  for (const c of chips()) {
    top.insertBefore(h('span', { class: 'chip', dataset: { chip: c.id } }, icon(c.ico), c.label,
      h('button', { type: 'button', 'aria-label': `Remove ${c.label} from Oracle context`, onclick: () => { dockState.dismissed.add(c.id); renderDockChips(); } }, icon('X'))), state);
  }
}

export function renderDock(route) {
  dockState.route = route;
  if (route.view !== dockState.lastView) { dockState.selection = null; dockState.dismissed = new Set(); dockState.lastView = route.view; }
  let dock = document.getElementById('oracle-dock');
  if (!dock.dataset.built) {
    dock.dataset.built = '1';
    dock.className = 'dock';
    const input = h('input', { type: 'text', id: 'oracle-input', placeholder: 'Ask Convenium.Design anything...', 'aria-label': 'Ask Oracle', autocomplete: 'off' });
    const form = h('form', { class: 'dock-row', onsubmit: e => { e.preventDefault(); ask(input.value); input.value = ''; } },
      h('label', { class: 'dock-input' }, icon('Sparkles'), input),
      h('button', { class: 'dock-send', type: 'submit', 'aria-label': 'Send to Oracle' }, icon('Send')));
    dock.append(
      h('div', { class: 'dock-top' },
        h('button', { class: 'dock-state', type: 'button', 'aria-label': 'Show Oracle conversation', onclick: () => toggleReply() }, h('span', { class: 'live-dot' }), 'ORACLE', icon('ChevronDown'))),
      form);
  }
  const placeholder = ['intake', 'system', 'knowledge'].includes(route.view) ? 'Ask Oracle anything...' : 'Ask Convenium.Design anything...';
  document.getElementById('oracle-input').placeholder = placeholder;
  const dot = dock.querySelector('.dock-state .live-dot');
  dot.className = `live-dot ${!store.online ? 'off' : mode() === 'live' ? '' : 'demo'}`;
  renderDockChips();
}

function toggleReply(force) {
  const dock = document.getElementById('oracle-dock');
  let panel = dock.querySelector('.dock-reply');
  const show = force ?? !panel;
  if (!show) { panel?.remove(); return null; }
  if (!panel) {
    panel = h('div', { class: 'dock-reply', role: 'log', 'aria-live': 'polite' },
      h('header', {}, icon('Sparkles'), 'Oracle', h('button', { type: 'button', 'aria-label': 'Close conversation', onclick: () => toggleReply(false) }, icon('X'))));
    if (!dockState.history.length) panel.append(h('p', { class: 'muted' }, 'Ask about this screen, an agent, a skill or the next step. Oracle answers with the active configuration and never approves or publishes on its own.'));
    for (const item of dockState.history) panel.append(h('p', { class: item.who === 'you' ? 'you' : '' }, item.who === 'you' ? `› ${item.text}` : item.text));
    dock.append(panel);
  }
  return panel;
}

async function ask(text) {
  const prompt = text.trim();
  if (prompt.length < 3) return;
  const context = chips().map(c => c.label).join(' / ');
  dockState.history.push({ who: 'you', text: prompt });
  let panel = toggleReply(true); panel.remove(); panel = toggleReply(true);
  const pending = h('p', { class: 'muted' }, 'Oracle is routing your request…');
  panel.append(pending);
  try {
    const result = await api.chat(`${prompt}\n\nContext: ${context}`, activeLoadout()?.id);
    const answer = result.answer || 'No answer returned.';
    dockState.history.push({ who: 'oracle', text: answer });
    pending.replaceWith(h('p', {}, answer));
  } catch (error) {
    pending.replaceWith(h('p', { style: { color: 'var(--coral)' } }, `Oracle could not answer: ${error.message}`));
  }
  panel.scrollTop = panel.scrollHeight;
}

export function startClock() {
  setInterval(() => { const c = document.getElementById('clock'); if (c) c.textContent = fmtTime(); }, 30_000);
}
