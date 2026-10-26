// Settings — "A model per seat": routing lanes, guardrails, environment, notifications.
import { h, toast, confirmModal } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, btn, banner, tag } from '../ui.js';
import { store, activeLoadout, workflow, resetSession, mode } from '../store.js';

const LANE_KEY = 'apollo.v2.lanes';
const NOTE_KEY = 'apollo.v2.notifications';
const WORK = [
  ['decompose', 'Decomposition, architecture, judgement', 'green'],
  ['review', 'Briefs, review, merge decisions', 'green'],
  ['build', 'Codegen, tests, execution loops', 'blue'],
  ['bulk', 'Bulk refactors, crawls, long reads', 'amber'],
  ['watch', 'Watchers, classification, triage', 'purple'],
];
const read = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || '{}') }; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function renderSettings() {
  const models = store.data.config?.models || store.data.health?.models || [];
  const lanes = read(LANE_KEY, { decompose: models[0], review: models[0], build: models[1] || models[0], bulk: models[2] || models[0], watch: models[2] || models[0] });
  const notes = read(NOTE_KEY, { input: true, approval: true, complete: true, failure: true, digest: false });
  const lo = activeLoadout(); const policy = workflow()?.policy || {}; const plan = store.data.plan;
  const m = mode();

  const routing = h('section', { class: 'card set-card', id: 'routing', 'data-tour': 'settings-routing' },
    h('p', { class: 'eyebrow green' }, '// Token optimization · routing'),
    h('h2', { class: 'set-title' }, 'A model per seat.'),
    h('div', { class: 'lane-table', role: 'table' },
      h('div', { class: 'lane-row head', role: 'row' }, h('span', {}, 'Work'), h('span', {}, 'Lane')),
      WORK.map(([id, text, tone]) => h('div', { class: 'lane-row', role: 'row' }, h('span', {}, text),
        h('label', { class: 'lane-pick' }, h('i', { class: `sq ${tone}` }), h('select', { 'aria-label': `Model lane for ${text}`, onchange: e => { lanes[id] = e.target.value; write(LANE_KEY, lanes); toast('Lane preference saved locally.', 'green', icon('Check')); } }, models.map(mm => h('option', { value: mm, selected: lanes[id] === mm ? true : null }, mm.toUpperCase()))))))),
    h('p', { class: 'set-note' }, 'Routing is the cheapest optimization you have: nothing about the task changes, only which meter it lands on. Lane choices here are a local preference; runs use the server’s configured models (', models.join(', ') || 'none', ').'));

  const guard = h('section', { class: 'set-block', id: 'guardrails', 'data-tour': 'settings-guardrails' },
    h('p', { class: 'eyebrow green' }, '// Guardrails + the honest limit'),
    h('h2', { class: 'set-title' }, 'What stops it running away.'),
    h('div', { class: 'guard-grid' },
      [['Depth cap', 'One specialist at a time. No nested delegation; a worker can ask for a decision, never take one.'],
        ['Per-run budget', `The active loadout “${lo?.name || '—'}” carries ${(lo?.budget?.totalTokens || 30000).toLocaleString()} tokens. Overrun stops and asks.`],
        ['Repair cycles', `At most ${policy.maxRepairCycles ?? 2} author-fix / critic-review cycles, then residual tradeoffs are presented.`],
        ['Read-only workers', `At most ${plan?.maxReadOnlyWorkers ?? policy.maxReadOnlyWorkers ?? 2} parallel read-only specialists; author and critic always run sequentially.`]].map(([t, d]) =>
        h('div', { class: 'card guard' }, h('strong', {}, t), h('p', {}, d)))),
    h('div', { class: 'card green guard-note' }, h('span', { class: 'label green' }, '// Where this stops earning its keep'), h('p', {}, 'Gates A, B and C always need you. Oracle can propose, compare and explain; it cannot approve, publish, spend or change production on its own.')));

  const env = h('section', { class: 'card set-card', id: 'environment' },
    h('div', { class: 'card-head' }, 'Environment'),
    banner(m === 'live' ? 'green' : 'amber', m === 'live' ? 'Live — models confirmed' : m === 'offline' ? 'Offline' : 'Demo — nothing is sent', store.data.health?.modeDetail || 'Server status unavailable.'),
    h('div', { class: 'rowlist env-list' }, (store.data.integrations || []).map(i => h('div', { class: 'res-row' }, icon(i.id.includes('claude') ? 'Bot' : i.id.includes('openai') ? 'Sparkles' : 'Cable'),
      h('div', {}, h('b', {}, i.name), h('span', {}, i.detail)), h('span', { class: `badge ${i.detected ? 'green' : 'grey'}` }, i.detected ? 'Detected' : 'Not detected')))));

  const notif = h('section', { class: 'card set-card', id: 'notifications' },
    h('div', { class: 'card-head' }, 'Notifications'),
    h('p', { class: 'mono-sm' }, 'Monitoring stays quiet unless something needs you.'),
    [['input', 'When Oracle needs an answer'], ['approval', 'When a gate needs approval'], ['complete', 'When a run completes'], ['failure', 'When something fails or is blocked'], ['digest', 'Daily digest of unchanged projects']].map(([k, t]) =>
      h('label', { class: 'toggle-row' }, h('span', {}, t), h('span', { class: 'switch' }, h('input', { type: 'checkbox', checked: notes[k] ? true : null, onchange: e => { notes[k] = e.target.checked; write(NOTE_KEY, notes); } }), h('span')))));

  const danger = h('section', { class: 'card set-card' }, h('div', { class: 'card-head' }, 'Walkthrough data'),
    h('p', { class: 'mono-sm' }, 'The Northstar intake, approvals and run replay are a local demo kept in this browser. Agents, skills, loadouts and budgets are real Convenium.Design data on the server.'),
    h('div', { class: 'tags' }, tag('Session: this browser'), tag('Server: convenium-design-studio/data')),
    h('div', { class: 'set-actions' }, btn('Reset Northstar walkthrough', { tone: 'danger', ico: 'RotateCcw', onClick: async () => { if (await confirmModal({ title: 'Reset the walkthrough?', body: 'Intake answers, approvals and the run replay return to the start. Server data (agents, loadouts) is not touched.', confirm: 'Reset', tone: 'danger' })) { resetSession(); toast('Walkthrough reset.', 'green', icon('RotateCcw')); } } }),
      btn('Open legacy studio', { tone: 'outline', ico: 'ExternalLink', href: '/legacy/' })));

  const main = h('div', { class: 'view-settings' },
    pageHead({ eyebrow: '// Settings', title: 'Routing. Guardrails. Environment.', sub: 'Expensive tokens plan. Cheap tokens type.' }),
    h('nav', { class: 'set-nav' }, [['routing', 'Routing'], ['guardrails', 'Guardrails'], ['environment', 'Environment'], ['notifications', 'Notifications']].map(([id, t]) => h('a', { href: `#/settings`, onclick: e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, t))),
    h('div', { class: 'set-grid' }, routing, h('div', { class: 'set-col' }, env, notif)), guard, danger);
  return { main };
}
