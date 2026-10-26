// Bootstrap: shell + router + views. Views are ES modules loaded on demand.
import { h, clear } from './dom.js';
import { icon } from './icons.js';
import { createRouter, RAIL } from './router.js';
import { store, loadAll, subscribe } from './store.js';
import { renderRail, renderTopstrip, renderDock, renderFooter, startClock } from './shell.js';

const VIEWS = {
  home: ['./views/home.js', 'renderHome'],
  journey: ['./views/home.js', 'renderJourney'],
  projects: ['./views/projects.js', 'renderProjects'],
  project: ['./views/projects.js', 'renderProject'],
  intake: ['./views/intake.js', 'renderIntake'],
  plan: ['./views/plan.js', 'renderPlan'],
  configure: ['./views/configure.js', 'renderConfigure'],
  playground: ['./views/playground.js', 'renderPlayground'],
  work: ['./views/run.js', 'renderWork'],
  results: ['./views/run.js', 'renderResults'],
  knowledge: ['./views/knowledge.js', 'renderKnowledge'],
  system: ['./views/system.js', 'renderSystem'],
  agents: ['./views/agents.js', 'renderAgents'],
  settings: ['./views/settings.js', 'renderSettings'],
  tutorials: ['./views/tutorials.js', 'renderTutorials'],
};

let current = null;
let cleanup = null;

async function mount(route, { keepScroll = false } = {}) {
  current = route;
  document.body.dataset.view = route.view;
  document.body.classList.remove('rail-open', 'inspector-shown');
  renderRail(route); renderTopstrip(route); renderDock(route); renderFooter();
  const main = document.getElementById('view');
  cleanup?.(); cleanup = null;
  const scroll = keepScroll ? window.scrollY : 0;
  let out;
  try {
    const entry = VIEWS[route.view];
    if (!entry) throw Object.assign(new Error('unavailable'), { unavailable: true });
    const mod = await import(entry[0]);
    if (current !== route) return;
    out = await mod[entry[1]](route);
  } catch (error) {
    out = { main: unavailable(route, error) };
  }
  if (current !== route) return;
  clear(main);
  document.documentElement.style.setProperty('--inspector-w', out.inspectorWidth || '22.5rem');
  if (out.inspector) {
    if (out.head) main.append(...[out.head].flat());
    main.append(h('div', { class: 'ins-layout' }, h('div', { class: 'ins-main' }, out.main), out.inspector));
  } else main.append(...[out.head].flat().filter(Boolean), out.main);
  main.classList.toggle('has-inspector', Boolean(out.inspector));
  document.body.classList.toggle('inspector-open', Boolean(out.inspector));
  window.scrollTo(0, scroll);
  cleanup = out.cleanup || null;
  out.onMount?.();
  if (!keepScroll) (document.getElementById('page-title') || main).focus({ preventScroll: true });
  document.dispatchEvent(new CustomEvent('apollo:view', { detail: route }));
}

function unavailable(route, error) {
  if (!error?.unavailable) console.error(error);
  return h('div', { class: 'view-unavailable' },
    h('p', { class: 'eyebrow' }, error?.unavailable ? 'Unavailable' : 'Something went wrong'),
    h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, error?.unavailable ? 'This view does not exist.' : 'This view failed to load.'),
    h('p', { class: 'subline' }, error?.unavailable ? 'The link does not identify an Convenium.Design view.' : String(error?.message || error)),
    h('p', {}, h('a', { class: 'btn', href: '#/home' }, icon('House'), 'Back to Home')));
}

export function rerender() { if (current && !document.querySelector('.modal-back')) mount(current, { keepScroll: true }); }

const router = createRouter(route => mount(route));

// Alt+1..9 jumps through the rail in its fixed order.
document.addEventListener('keydown', e => {
  if (e.altKey && !e.ctrlKey && !e.metaKey && /^[1-9]$/.test(e.key)) { e.preventDefault(); location.hash = RAIL[Number(e.key) - 1].href; }
  if (e.key === 'Escape') document.body.classList.remove('rail-open', 'inspector-shown');
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); document.getElementById('oracle-input')?.focus(); }
});
document.addEventListener('click', e => { if (document.body.classList.contains('rail-open') && !e.target.closest('.rail, .menu-btn')) document.body.classList.remove('rail-open'); });
window.addEventListener('online', () => { store.online = true; rerender(); });
window.addEventListener('offline', () => { store.online = false; rerender(); });

// Any store change re-projects the current view (debounced, scroll kept, focus untouched).
let pending = null;
subscribe(() => { clearTimeout(pending); pending = setTimeout(rerender, 30); });

window.apollo = { store, rerender, router };
router.start();
loadAll();
startClock();
import('./tour.js').then(m => m.initTours?.()).catch(() => {});
