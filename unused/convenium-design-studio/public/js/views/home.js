// Screen 01 — Home / Oracle, and screen 00 — the journey map.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, segbar, btn, label } from '../ui.js';
import { store, saveSession, currentStage, nextAction, stageStates } from '../store.js';
import { PROJECTS, GOALS, JOURNEY, BANDS } from '../fixtures/northstar.js';

const greeting = () => { const hr = new Date().getHours(); return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; };

function stageRing(tone = 'green') {
  return h('span', { class: `stage-ring ${tone}`, 'aria-hidden': 'true' }, h('i'));
}

export function renderHome() {
  const stage = currentStage();
  const idx = Math.min(stage.index ?? 0, 4);
  const next = nextAction();
  const selectedGoal = store.session.goal || 'brand';

  const strip = h('section', { class: 'card active-strip', 'data-tour': 'active-project' },
    h('div', { class: 'as-ico' }, icon('Folder')),
    h('div', { class: 'as-cell' }, h('span', { class: 'label' }, 'Active project'), h('strong', { class: 'as-title' }, 'Northstar'), h('span', { class: 'as-sub' }, 'Brand & Website')),
    h('div', { class: 'as-cell as-stage' }, h('span', { class: 'label' }, 'Current stage'),
      h('div', { class: 'as-stage-row' }, stageRing(stage.status === 'ready' ? 'amber' : 'green'),
        h('div', {}, h('strong', { class: 'as-stage-title' }, stage.title), h('span', { class: 'as-stage-sub' }, stage.sub)))),
    h('div', { class: 'as-cell as-progress' }, h('span', { class: 'label' }, 'Progress'),
      h('div', { class: 'as-progress-row' }, segbar(5, idx + 1, -1, 'Project stage progress'), h('span', { class: 'as-count' }, `${idx + 1} / 5`))));

  const goals = h('div', { class: 'goal-grid', 'data-tour': 'goals', role: 'list' }, GOALS.map(g =>
    h('a', { class: `goal-card${g.id === selectedGoal ? ' sel' : ''}`, role: 'listitem', href: '#/projects/northstar/intake', dataset: { goal: g.id },
      onclick: () => saveSession({ goal: g.id }) },
      icon(g.icon, 'goal-ico'), h('strong', {}, g.title), h('span', {}, g.text), icon('ArrowRight', 'goal-arrow'))));

  const recent = h('section', { class: 'card pad recent' },
    h('div', { class: 'card-head' }, 'Recent projects', h('a', { class: 'more', href: '#/projects' }, 'View all', icon('ArrowRight'))),
    h('div', { class: 'recent-list' }, PROJECTS.map((p, i) => {
      const stageText = i === 0 ? stage.title : p.stage;
      return h('a', { class: `recent-row${i === 0 ? ' sel' : ''}`, href: i === 0 ? '#/projects/northstar' : '#/projects' },
        icon('Folder'), h('div', {}, h('strong', {}, p.name), h('span', {}, p.kind)),
        h('span', { class: 'recent-stage' }, h('span', { class: `ring-dot ${p.tone}` }), stageText));
    })));

  const action = h('section', { class: 'card pad next', 'data-tour': 'next-action' },
    h('div', { class: 'card-head' }, icon('ArrowRight', 'green-ico'), 'Your next action'),
    h('div', { class: 'next-box' },
      h('span', { class: 'next-check' }, icon('Check')),
      h('div', { class: 'next-copy' }, h('span', { class: 'label' }, 'Northstar'), h('strong', {}, next.title), h('span', {}, next.text)),
      btn(next.cta, { href: next.href, icoRight: 'ArrowRight', tone: 'mono', attrs: { 'data-tour': 'next-cta' } })),
    h('div', { class: 'label quick-label' }, 'Quick links'),
    h('div', { class: 'quick' }, [['Plan', 'CalendarDays', '#/plan'], ['Playground', 'FlaskConical', '#/playground'], ['Agents', 'UsersRound', '#/agents'], ['Knowledge', 'BookOpen', '#/knowledge']].map(([t, ic, href]) =>
      h('a', { class: 'quick-link', href }, icon(ic), t))));

  const main = h('div', { class: 'view-home' },
    pageHead({ eyebrow: greeting(), title: 'Welcome to Convenium.Design', sub: 'Ideas  →  Agents  →  Outcomes' }),
    strip,
    h('div', { class: 'oracle-row' }, h('p', { class: 'eyebrow green oracle-label' }, '// Oracle'),
      h('a', { class: 'journey-link', href: '#/journey' }, icon('Route'), 'See how Convenium.Design builds with you', icon('ArrowRight'))),
    h('h2', { class: 'display hero' }, 'What do you want to build?'),
    h('p', { class: 'subline' }, "Tell me your goal. I'll help turn it into a plan."),
    goals,
    h('div', { class: 'home-bottom' }, recent, action));
  return { main };
}

export function renderJourney() {
  const states = stageStates();
  const doneSteps = [store.session.goal ? 1 : 0, 0].length; void doneSteps;
  // Map display-stage progress onto the 11-step trip.
  const progressByStep = n => {
    const s = store.session;
    const intakeDone = states[0].status === 'completed';
    const map = { 1: Boolean(s.goal) || intakeDone, 2: intakeDone, 3: s.briefApproved, 4: s.briefApproved, 5: s.planApproved, 6: s.configApplied, 7: Boolean(s.comparison), 8: s.configApplied && s.run.status !== 'idle', 9: s.run.status === 'complete', 10: s.resultApproved, 11: s.resultApproved };
    return map[n];
  };
  const current = JOURNEY.find(st => !progressByStep(st.n))?.n ?? 12;
  const bandTone = t => ({ green: 'green', blue: 'blue', amber: 'amber' }[t]);

  const bandRow = h('div', { class: 'jr-bands' }, BANDS.map(([text, tone], i) =>
    h('div', { class: `jr-band ${tone}`, style: { gridColumn: `span ${[3, 3, 2, 3][i]}` } }, h('span', {}, text))));
  const numRow = h('div', { class: 'jr-nums' }, JOURNEY.map(st => h('div', { class: `jr-num ${bandTone(st.tone)}${st.n === current ? ' now' : ''}${progressByStep(st.n) ? ' done' : ''}` },
    h('span', {}, String(st.n)), st.n < 11 ? h('i', { class: `jr-arrow ${bandTone(JOURNEY[st.n].tone)}` }) : null)));
  const cards = h('div', { class: 'jr-cards', 'data-tour': 'journey-steps' }, JOURNEY.map(st => h('a', { class: `jr-card${st.n === current ? ' now' : ''}`, href: st.href, dataset: { step: st.n } },
    icon(st.icon, 'jr-ico'), h('strong', { class: 'jr-title' }, st.title), h('p', { class: 'jr-text' }, st.text),
    h('div', { class: 'jr-agent' }, h('span', { class: 'label' }, 'Agent'), h('div', { class: 'jr-agent-row' }, icon(st.agent === 'Independent Critic' ? 'Shield' : st.agent === 'System' ? 'Server' : st.agent === 'Design Engineer' ? 'UserCog' : 'User'),
      h('div', {}, h('b', {}, st.agent), h('small', {}, st.role)))),
    h('div', { class: 'jr-decision' }, h('span', { class: `label ${st.n === current ? 'blue' : ''}` }, 'Your decision'), h('span', { class: `jr-chip ${bandTone(st.tone)}` }, st.n === current && !progressByStep(st.n) ? h('span', { class: 'jr-spin', 'aria-label': 'In progress' }) : st.decision)))));

  const final = h('section', { class: 'card green jr-final' },
    h('div', { class: 'jr-final-a' }, icon('Flag'), h('div', {}, h('strong', {}, 'Final result'), h('span', {}, 'Real outcomes. Powered by you and Convenium.Design.'))),
    h('div', { class: 'jr-final-b' }, h('span', { class: 'jr-final-check' }, icon('Check')), h('div', {}, h('strong', {}, 'Delivered'), h('span', {}, 'Creative work, ready for real impact.'))),
    btn('View in results', { href: '#/results/0248', icoRight: 'ArrowRight', tone: 'mono' }));

  const dest = h('div', {}, h('p', { class: 'label jr-dest-label' }, 'Additional destinations'),
    h('div', { class: 'jr-dest' }, [['Knowledge', 'BookOpen', 'Find guides, best practices and learn from past work.', '#/knowledge'], ['Agents', 'UsersRound', 'Browse and manage your AI team.', '#/agents'], ['System', 'Database', 'Manage tools, integrations and infrastructure.', '#/system/0248'], ['Settings', 'Settings', 'Personalize your workspace and preferences.', '#/settings']].map(([t, ic, d, href]) =>
      h('a', { class: 'card jr-dest-card', href }, icon(ic, 'jr-dest-ico'), h('div', {}, h('strong', {}, t), h('span', {}, d)), icon('ArrowRight')))));

  const main = h('div', { class: 'view-journey' },
    pageHead({ eyebrow: 'Your journey', title: 'How Convenium.Design builds with you', sub: 'From idea to impact — together with AI agents.' }),
    h('div', { class: 'jr-scroll' }, h('div', { class: 'jr-track' }, bandRow, numRow, cards)), final, dest);
  void label;
  return { main };
}
