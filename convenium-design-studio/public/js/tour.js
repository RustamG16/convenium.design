// Tour engine: spotlight + totem guide card. Exposed as window.apolloTour for the recorder.
import { h, clear, reducedMotion } from './dom.js';
import { icon } from './icons.js';
import { TOURS, POSES, tourById } from './tours-data.js';
import { store, saveSession } from './store.js';

const STATE_KEY = 'apollo.v2.tour';
let state = null;      // { id, step }
let resizeHandler = null;

const layer = () => document.getElementById('tour-layer');

function waitFor(selector, timeout = 4000) {
  if (!selector) return Promise.resolve(null);
  return new Promise(resolve => {
    const start = performance.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el && el.getBoundingClientRect().width > 0) return resolve(el);
      if (performance.now() - start > timeout) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function save() { try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {} }

export async function startTour(id, step = 0) {
  if (!tourById(id)) return;
  state = { id, step };
  save();
  document.body.classList.add('touring');
  await show();
}

export function endTour(completed = false) {
  if (state && completed) saveSession({ tours: { ...store.session.tours, [state.id]: true } });
  state = null;
  try { sessionStorage.removeItem(STATE_KEY); } catch {}
  document.body.classList.remove('touring');
  clear(layer());
  if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null; }
}

export async function next() {
  if (!state) return;
  const tour = tourById(state.id);
  if (state.step >= tour.steps.length - 1) { endTour(true); if (location.hash !== '#/tutorials') location.hash = '#/tutorials'; return; }
  state.step += 1; save(); await show();
}
export async function back() { if (!state || state.step === 0) return; state.step -= 1; save(); await show(); }

async function show() {
  const tour = tourById(state.id);
  const step = tour.steps[state.step];
  const host = clear(layer());
  host.append(h('div', { class: 'tour-block' }));
  if (step.route && location.hash !== step.route) {
    location.hash = step.route;
    await new Promise(r => setTimeout(r, 60));
  }
  // let the view mount (dynamic import + data)
  await new Promise(r => setTimeout(r, 120));
  const target = await waitFor(step.target);
  if (!state || tour.steps[state.step] !== step) return;
  if (target) target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  await new Promise(r => setTimeout(r, reducedMotion() ? 0 : 280));
  render(tour, step, target);
}

function render(tour, step, target) {
  const host = clear(layer());
  const pad = 8;
  const rect = target ? target.getBoundingClientRect() : null;
  let hole;
  if (rect) {
    const L = Math.max(0, rect.left - pad), T = Math.max(0, rect.top - pad), R = Math.min(window.innerWidth, rect.right + pad), B = Math.min(window.innerHeight, rect.bottom + pad);
    hole = [
      h('div', { class: 'tour-shade', style: { left: '0', top: '0', width: '100vw', height: `${T}px` } }),
      h('div', { class: 'tour-shade', style: { left: '0', top: `${B}px`, width: '100vw', bottom: '0' } }),
      h('div', { class: 'tour-shade', style: { left: '0', top: `${T}px`, width: `${L}px`, height: `${B - T}px` } }),
      h('div', { class: 'tour-shade', style: { left: `${R}px`, top: `${T}px`, right: '0', height: `${B - T}px` } }),
      h('div', { class: 'tour-hole', style: { left: `${L}px`, top: `${T}px`, width: `${R - L}px`, height: `${B - T}px` } }),
    ];
  } else hole = h('div', { class: 'tour-dim' });
  const last = state.step === tour.steps.length - 1;
  const card = h('div', { class: `tour-card pose-${step.pose}`, role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'tour-title', dataset: { tour: tour.id, step: String(state.step) } },
    h('img', { class: 'tour-totem', src: POSES[step.pose] || POSES.wave, alt: 'Convenium.Design Totem' }),
    h('div', { class: 'tour-bubble' },
      h('div', { class: 'tour-meta' }, h('span', {}, icon(tour.icon), tour.title), h('span', {}, `${state.step + 1} / ${tour.steps.length}`)),
      h('h3', { id: 'tour-title' }, step.title),
      h('p', {}, step.text),
      step.action ? h('p', { class: 'tour-action' }, icon('MousePointerClick'), step.action) : null,
      h('div', { class: 'tour-dots', 'aria-hidden': 'true' }, tour.steps.map((_, i) => h('i', { class: i === state.step ? 'on' : i < state.step ? 'done' : '' }))),
      h('div', { class: 'tour-actions' },
        h('button', { type: 'button', class: 'link tour-skip', onclick: () => endTour(false) }, 'End tour'),
        state.step > 0 ? h('button', { type: 'button', class: 'btn outline sm', onclick: back }, icon('ArrowLeft'), 'Back') : null,
        h('button', { type: 'button', class: 'btn sm tour-next', onclick: next }, last ? 'Finish' : 'Next', icon(last ? 'Check' : 'ArrowRight')))));
  host.append(...[hole].flat(), card);
  place(card, rect, step.place);
  card.querySelector('.tour-next').focus({ preventScroll: true });
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  resizeHandler = () => { if (state) render(tour, step, step.target ? document.querySelector(step.target) : null); };
  window.addEventListener('resize', resizeHandler);
}

function place(card, rect, side = 'bottom') {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let x, y;
  if (!rect || vw < 820) { x = (vw - cw) / 2; y = rect && vw < 820 ? vh - ch - 12 : (vh - ch) / 2; }
  else {
    const gap = 18;
    if (side === 'right') { x = rect.right + gap; y = rect.top + rect.height / 2 - ch / 2; }
    else if (side === 'left') { x = rect.left - cw - gap; y = rect.top + rect.height / 2 - ch / 2; }
    else if (side === 'top') { x = rect.left + rect.width / 2 - cw / 2; y = rect.top - ch - gap; }
    else { x = rect.left + rect.width / 2 - cw / 2; y = rect.bottom + gap; }
    // flip/clamp into the viewport
    if (x + cw > vw - 12) x = side === 'right' ? rect.left - cw - gap : vw - cw - 12;
    if (x < 12) x = side === 'left' ? rect.right + gap : 12;
    if (y < 12) y = Math.min(vh - ch - 12, rect.bottom + gap);
    if (y + ch > vh - 12) y = Math.max(12, rect.top - ch - gap);
    if (x + cw > vw - 12 || x < 12) x = Math.max(12, Math.min(vw - cw - 12, x));
  }
  card.style.left = `${Math.round(x)}px`; card.style.top = `${Math.round(y)}px`;
}

function welcomePrompt() {
  if (state || store.session.tours?.welcome || store.session.tours?._dismissed) return;
  if (document.querySelector('.tour-invite')) return;
  const invite = h('div', { class: 'tour-invite', role: 'dialog', 'aria-label': 'Take the tour' },
    h('img', { src: POSES.wave, alt: '' }),
    h('div', {}, h('strong', {}, 'New to Convenium.Design?'), h('p', {}, 'I’m the Convenium.Design Totem. Let me show you around in two minutes.'),
      h('div', { class: 'tour-actions' }, h('button', { type: 'button', class: 'link', onclick: () => { invite.remove(); saveSession({ tours: { ...store.session.tours, _dismissed: true } }); } }, 'Later'),
        h('button', { type: 'button', class: 'btn sm', onclick: () => { invite.remove(); startTour('welcome'); } }, 'Start the tour', icon('ArrowRight')))));
  document.body.append(invite);
}

export function initTours() {
  window.apolloTour = { start: startTour, next, back, end: endTour, tours: TOURS, get state() { return state ? { ...state } : null; } };
  document.addEventListener('keydown', e => {
    if (!state) return;
    if (e.key === 'Escape') endTour(false);
    if (e.key === 'ArrowRight' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) next();
    if (e.key === 'ArrowLeft' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) back();
  });
  const params = new URLSearchParams(location.search);
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); } catch { return null; } })();
  if (params.get('tour')) startTour(params.get('tour'), Number(params.get('step') || 0));
  else if (saved?.id) startTour(saved.id, saved.step);
  else if (!params.has('notour')) setTimeout(welcomePrompt, 1200);
}
