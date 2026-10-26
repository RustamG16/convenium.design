// Screen 06 — Playground: Setup A (active) vs Setup B (draft), compared without touching production.
import { h, toast, confirmModal } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, btn, banner, badge, meter, demoFlag, scaledFrame } from '../ui.js';
import { store, saveSession, skillName, agentRoster } from '../store.js';
import { api } from '../api.js';
import { PLAYGROUND } from '../fixtures/northstar.js';
import { draftChanges, pushDraft, applyDraft, resetDraft } from '../config-draft.js';

let running = false;
const rr = () => import('../main.js').then(m => m.rerender());

function loadoutName(id) { return store.data.loadouts?.loadouts?.find(l => l.id === id)?.name || id || '—'; }

async function runTest() {
  running = true; rr();
  try {
    const { a, b } = await pushDraft();
    const rolesB = store.session.configDraft?.roles || {};
    const result = await api.compare({ prompt: 'Northstar brand and website: plan, build and run AI agents for real work', a, b, rolesA: {}, rolesB });
    saveSession({ comparison: { at: Date.now(), a, b, checks: result.checks, elapsedMs: result.elapsedMs, limitations: result.limitations,
      diff: result.a.steps.map((s, i) => ({ role: s.name, phase: s.phase, a: s.skills, b: result.b.steps[i]?.skills || [], budgetA: s.budget, budgetB: result.b.steps[i]?.budget, statusA: s.status, statusB: result.b.steps[i]?.status })) } });
    toast(`Test complete — ${result.checks.filter(c => c.pass).length}/${result.checks.length} contract checks passed.`, 'green', icon('FlaskConical'));
  } catch (e) { toast(`Test failed: ${e.message}`, 'coral', icon('TriangleAlert')); }
  running = false; rr();
}

function setupCard(which, data, title, sub, loadoutLabel, skillsText) {
  const isA = which === 'A';
  const rows = [
    ['User', 'Agent', h('span', {}, h('b', {}, agentRoster().find(r => r.id === data.agent)?.name || 'Design Director'), h('small', {}, isA ? 'Plan, decompose & delegate' : 'Implement, integrate & package'))],
    ['Settings', 'Skills', skillsText],
    ['Sparkles', 'Model', data.model],
    ['Wrench', 'Tools', data.tools],
    ['Clock', 'Time (est.)', data.time],
    ['Database', 'Cost (est.)', data.cost],
    ['ChartNoAxesColumn', 'Confidence', h('span', { class: 'conf' }, `${data.confidence}%`, meter(data.confidence, isA ? '' : 'blue', 'Confidence'))],
    ['FileText', 'Expected result', data.result],
  ];
  return h('section', { class: `card setup setup-${which.toLowerCase()}`, 'data-tour': `setup-${which.toLowerCase()}` },
    h('header', { class: 'setup-head' }, h('span', { class: `setup-letter ${isA ? 'green' : 'blue'}` }, which),
      h('div', {}, h('strong', {}, title), h('span', {}, sub)), badge(isA ? 'Baseline' : 'Variation', isA ? 'green' : 'blue')),
    h('div', { class: 'setup-loadout mono-sm' }, icon('Layers'), loadoutLabel),
    h('div', { class: 'setup-rows' }, rows.map(([ic, k, v]) => h('div', { class: 'setup-row' }, icon(ic), h('span', { class: 'k' }, k), h('span', { class: 'v' }, v), icon('ChevronRight', 'chev')))));
}

export function renderPlayground() {
  const s = store.session;
  const cmp = s.comparison;
  const changes = draftChanges();
  const aId = store.data.loadouts?.activeLoadoutId;
  const bId = s.draftLoadoutId;
  const skillsOf = (side) => {
    if (!cmp) return side === 'A' ? 'Strategic planning, content strategy, research synthesis' : 'Frontend development, UI implementation, interaction design';
    const all = [...new Set(cmp.diff.flatMap(d => d[side === 'A' ? 'a' : 'b']))];
    return all.slice(0, 5).map(skillName).join(', ') + (all.length > 5 ? ` +${all.length - 5}` : '');
  };

  const changed = cmp ? cmp.diff.filter(d => d.a.join() !== d.b.join() || d.budgetA !== d.budgetB) : [];
  const middle = h('section', { class: 'card what-changed', 'data-tour': 'what-changed' },
    h('div', { class: 'card-head' }, 'What changed and why'),
    cmp ? h('div', { class: 'wc-list' },
      changed.length ? changed.map(d => {
        const added = d.b.filter(x => !d.a.includes(x)); const removed = d.a.filter(x => !d.b.includes(x));
        return h('div', { class: 'wc-row' }, icon('UsersRound'), h('div', {}, h('b', {}, `${d.role} · ${d.phase}`),
          h('span', {}, [added.length ? `Adds ${added.map(skillName).join(', ')}.` : '', removed.length ? ` Drops ${removed.map(skillName).join(', ')}.` : '', d.budgetA !== d.budgetB ? ` Budget ${d.budgetA} → ${d.budgetB}.` : ''].join('') || 'Routing unchanged.')));
      }) : h('p', { class: 'mono-sm' }, 'Setups A and B route every phase identically. Change a slot skill in Configure to see a difference.'),
      h('div', { class: 'wc-row' }, icon('ShieldCheck'), h('div', {}, h('b', {}, 'Contract checks'), h('span', {}, cmp.checks.map(c => `${c.pass ? '✓' : '✗'} ${c.name}`).join(' · ')))),
      h('div', { class: 'wc-row' }, icon('Clock'), h('div', {}, h('b', {}, 'Planner time'), h('span', {}, `${cmp.elapsedMs} ms, deterministic. ${cmp.limitations?.[0] || ''}`))))
    : h('div', { class: 'wc-list' }, PLAYGROUND.changes.map(c => h('div', { class: 'wc-row' }, icon(c.icon), h('div', {}, h('b', {}, c.label), h('span', {}, c.text)))), h('p', { class: 'mono-sm wc-note' }, demoFlag('Example'), ' Press Run test to compare your real draft.')));

  const score = h('section', { class: 'card scorecard' },
    h('div', { class: 'score-head' }, h('span', { class: 'label strong-label' }, 'Comparison scorecard'), h('span', { class: 'setup-letter sm green' }, 'A'), h('span', { class: 'setup-letter sm blue' }, 'B')),
    PLAYGROUND.score.map(([k, a, b]) => h('div', { class: 'score-row' }, h('span', {}, k), h('span', { class: `sc ${a >= b ? 'win-a' : 'lose'}` }, a.toFixed(1)), h('span', { class: `sc ${b > a ? 'win-b' : 'lose-b'}` }, b.toFixed(1)))),
    h('p', { class: 'mono-sm score-note' }, demoFlag('Estimated'), ' Quality scores need a real run; contract checks above are measured.'));

  const prevA = h('section', { class: 'card preview-card' }, h('div', { class: 'card-head' }, h('span', { class: 'setup-letter sm green' }, 'A'), 'Preview result', h('a', { class: 'more blue', href: '#/results/0248' }, 'View full output', icon('ArrowRight'))),
    h('div', { class: 'doc-mock' }, h('div', {}, h('span', { class: 'mono-sm' }, '// Strategy'), h('strong', {}, 'Northstar brand strategy'), h('span', { class: 'doc-sub' }, 'Positioning  /  Messaging  /  Audience  /  Go-to-market')), h('div', { class: 'doc-lines' }, Array.from({ length: 7 }, () => h('i')))));
  const prevB = h('section', { class: 'card preview-card' }, h('div', { class: 'card-head' }, h('span', { class: 'setup-letter sm blue' }, 'B'), 'Preview result', h('a', { class: 'more blue', href: '#/results/0248' }, 'View full output', icon('ArrowRight'))),
    scaledFrame('/fixtures/northstar-site.html?v=dark', 'Setup B preview', 1100, 'site-frame dark'));

  const main = h('div', { class: 'view-playground' },
    h('div', { class: 'pg-head' },
      pageHead({ eyebrow: '// Playground', title: 'Test ideas. Compare outcomes.', sub: 'Run agents with different approaches. See what works.', quote: false }),
      banner('amber', 'Draft — production unchanged', "You're testing in a safe sandbox. No changes affect your plan."),
      h('div', { class: 'head-actions' },
        btn(running ? 'Running…' : 'Run test', { tone: 'green', ico: running ? 'LoaderCircle' : 'Play', onClick: runTest, attrs: { disabled: running ? true : null, 'data-tour': 'pg-run' } }),
        btn('Reset draft', { tone: 'outline', ico: 'RotateCcw', onClick: () => { resetDraft(); toast('Draft reset.', 'green', icon('RotateCcw')); } }),
        btn('Apply to plan', { ico: 'Check', attrs: { 'data-tour': 'pg-apply' }, onClick: async () => {
          const ok = await confirmModal({ title: 'Apply Setup B to the plan?', body: cmp ? `Setup B (“${loadoutName(bId)}”) becomes the active configuration. ${cmp.checks.every(c => c.pass) ? 'All contract checks passed.' : 'Some contract checks failed — review before applying.'}` : 'You have not run a test yet. Applying without a comparison skips the evidence step.', confirm: 'Apply to plan' });
          if (!ok) return;
          try { await applyDraft(); toast('Setup B applied to the plan.', 'green', icon('CircleCheck')); location.hash = '#/plan'; } catch (e) { toast(e.message, 'coral', icon('TriangleAlert')); }
        } }))),
    h('div', { class: 'pg-grid' },
      setupCard('A', PLAYGROUND.a, cmp ? loadoutName(aId) : PLAYGROUND.a.name, PLAYGROUND.a.sub, `Active loadout: ${loadoutName(aId)}`, skillsOf('A')),
      middle,
      setupCard('B', PLAYGROUND.b, cmp ? loadoutName(bId) : PLAYGROUND.b.name, PLAYGROUND.b.sub, bId ? `Draft loadout: ${loadoutName(bId)} · ${changes.length} change(s)` : 'Draft: not created yet — Run test creates it', skillsOf('B')),
      prevA, score, prevB));
  return { main };
}
