// Screens 07 (Work / execution) and 08 (Results / QA). The run is a deterministic demo replay
// of Run 0248: approvals advance it, nothing is executed against real infrastructure.
import { h, toast, confirmModal } from '../dom.js';
import { icon, AGENT_ICONS, toolMark } from '../icons.js';
import { tabs, btn, badge, meter, inspector, inspectorToggle, demoFlag, segbar, scaledFrame } from '../ui.js';
import { store, saveSession, agentRoster, agentSkills, skillName } from '../store.js';
import { setDockSelection } from '../shell.js';
import { RUN, QA } from '../fixtures/northstar.js';

const rr = () => import('../main.js').then(m => m.rerender());
const APPROVAL_TASK = 4;
let selectedTask = null;
let workTab = 'overview';
let resultTab = 'preview';
let device = 'desktop';

function runState() {
  const r = store.session.run;
  if (r.status === 'idle') return { status: 'replay', task: 3 };
  return r;
}
function taskStatus(i, r) {
  if (r.status === 'complete' || i < r.task) return 'done';
  if (i > r.task) return 'pending';
  if (r.status === 'cancelled') return 'cancelled';
  if (r.status === 'paused') return 'paused';
  return i === APPROVAL_TASK ? 'waiting' : 'running';
}
const TS = {
  done: ['Completed', 'green'], running: ['In progress', 'blue'], waiting: ['Waiting for approval', 'amber'], pending: ['Pending', 'grey'],
  paused: ['Paused', 'amber'], cancelled: ['Cancelled', 'coral'],
};

async function advance() {
  const r = runState();
  if (r.status === 'complete') { location.hash = '#/results/0248'; return; }
  if (r.task === APPROVAL_TASK) {
    const ok = await confirmModal({ title: 'Approve validation and continue?', body: 'The Independent Critic has prepared the test report. Approving lets the run move to Deploy (preview only). Production deployment always needs a separate approval.', confirm: 'Approve & continue' });
    if (!ok) return;
  }
  const next = r.task + 1;
  const done = next >= RUN.tasks.length;
  saveSession({ run: { status: done ? 'complete' : 'running', task: done ? RUN.tasks.length : next } });
  toast(done ? 'Run 0248 complete — results ready for review.' : `${RUN.tasks[r.task].title} completed.`, 'green', icon('CircleCheck'));
  if (done) location.hash = '#/results/0248';
}

function runHeader(r) {
  const label = r.status === 'complete' ? ['Completed', 'green'] : r.status === 'paused' ? ['Paused — by you', 'amber'] : r.status === 'cancelled' ? ['Cancelled safely', 'coral'] : r.task === APPROVAL_TASK ? ['Validation — approval required', 'amber'] : ['Implement — in progress', 'blue'];
  const doneCount = Math.min(RUN.tasks.length, r.status === 'complete' ? RUN.tasks.length : r.task);
  return h('header', { class: 'page-head run-head' },
    h('div', { class: 'titles' },
      h('div', { class: 'run-title-row' }, h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, `Run ${RUN.id}`),
        r.status === 'paused' || r.task === APPROVAL_TASK ? h('span', { class: 'pause-ico' }, icon('Pause')) : null,
        badge(label[0], label[1], null, true), r.status === 'replay' ? demoFlag('Demo replay') : null),
      h('p', { class: 'run-meta' }, `Started ${RUN.started}  •  Elapsed ${RUN.elapsed}  •  ${doneCount} of ${RUN.tasks.length} tasks complete`)),
    h('div', { class: 'head-actions' },
      btn(r.task === APPROVAL_TASK ? 'Approve & Continue' : r.status === 'complete' ? 'Open results' : 'Approve & Continue', { tone: 'green', ico: 'Play', onClick: advance, attrs: { disabled: r.status === 'cancelled' ? true : null, 'data-tour': 'run-approve' } }),
      btn(r.status === 'paused' ? 'Resume Run' : 'Pause Run', { tone: 'outline', ico: r.status === 'paused' ? 'Play' : 'Pause', attrs: { disabled: ['complete', 'cancelled'].includes(r.status) ? true : null },
        onClick: () => { const cur = runState(); saveSession({ run: { status: cur.status === 'paused' ? 'running' : 'paused', task: cur.task } }); } }),
      btn('Cancel Safely', { tone: 'danger', ico: 'Square', attrs: { disabled: ['complete', 'cancelled'].includes(r.status) ? true : null }, onClick: async () => {
        const ok = await confirmModal({ title: 'Cancel this run safely?', body: 'Completed tasks and their evidence are kept. The running task stops at its next safe point and nothing is deployed.', confirm: 'Cancel run', tone: 'danger', cancel: 'Keep running' });
        if (ok) saveSession({ run: { status: 'cancelled', task: runState().task } });
      } })));
}

export function renderWork() {
  const r = runState();
  const roster = agentRoster();
  const curIdx = Math.min(r.task, RUN.tasks.length - 1);
  const sel = selectedTask ?? curIdx;
  const t = RUN.tasks[sel];
  const st = taskStatus(sel, r);

  const timeline = h('section', { class: 'card pad timeline-card', 'data-tour': 'run-timeline' },
    h('div', { class: 'card-head' }, '// Execution timeline', h('span', { class: 'more' }, `${RUN.tasks.length} tasks`)),
    h('ol', { class: 'tl' }, RUN.tasks.map((task, i) => {
      const s = taskStatus(i, r); const [txt, tone] = TS[s];
      return h('li', { class: `tl-item ${s}` },
        h('span', { class: `tl-n ${tone}` }, task.n),
        h('span', { class: `tl-mark ${s}` }, s === 'done' ? icon('Check') : s === 'waiting' || s === 'paused' ? icon('Pause') : s === 'running' ? h('i') : null),
        i < RUN.tasks.length - 1 ? h('i', { class: `tl-line ${s === 'done' ? 'done' : ''}` }) : null,
        h('button', { type: 'button', class: `tl-card ${tone}${i === sel ? ' sel' : ''}`, onclick: () => { selectedTask = i; setDockSelection({ ico: 'FileText', label: task.title }); rr(); } },
          h('div', { class: 'tl-copy' }, h('b', {}, task.title), h('span', {}, task.text)),
          h('div', { class: 'tl-status' }, h('span', { class: `tl-st ${tone}` }, txt), h('span', { class: 'mono-sm' }, s === 'done' || s === 'running' ? task.time : '—')),
          h('div', { class: 'tl-files' }, task.files.map(f => h('span', {}, icon('FileText'), f))), icon('ArrowRight', 'tl-arrow')));
    })));

  const preview = h('section', { class: 'card pad live-preview', 'data-tour': 'run-preview' },
    h('div', { class: 'card-head' }, '// Live preview', h('span', { class: 'more' }, h('span', { class: 'live-dot' }), 'Auto-refreshing...', icon('ExternalLink'))),
    scaledFrame('/fixtures/northstar-site.html?v=mountain', 'Northstar live preview', 1180, 'site-frame live'),
    h('div', { class: 'preview-foot mono-sm' }, h('span', {}, 'Preview: http://localhost:3000'), h('span', {}, 'Last updated 1m ago ', h('span', { class: 'live-dot' }))));

  const agent = roster.find(a => a.id === t.agent) || roster[0];
  const sk = agent.id === 'oracle' ? ['olympus-design-director'] : agentSkills(agent.id);
  const budget = agent.budget ? { used: Math.round(agent.budget * 0.42), total: agent.budget } : RUN.tokens;
  const side = inspector([
    h('div', { class: 'ins-head-row' }, h('span', { class: 'label strong-label' }, '// Task details'), h('div', { class: 'pager' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous task', onclick: () => { selectedTask = Math.max(0, sel - 1); rr(); } }, icon('ChevronLeft')),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next task', onclick: () => { selectedTask = Math.min(RUN.tasks.length - 1, sel + 1); rr(); } }, icon('ChevronRight')))),
    h('div', { class: 'ins-title' }, h('span', { class: 'ico-plain big blue' }, icon('CodeXml')), h('div', {}, h('h2', {}, t.title, ' ', badge(TS[st][0], TS[st][1])), h('p', {}, t.text))),
    h('dl', { class: 'kv task-kv' },
      h('dt', {}, 'Agent'), h('dd', { class: 'agent-dd' }, h('span', { class: 'agent-ava sm' }, icon(AGENT_ICONS[agent.id] || 'User')), h('div', {}, h('b', {}, agent.name), h('small', {}, ({ oracle: 'Strategic intake & run configuration', 'design-director': 'Plan, decompose & delegate', 'asset-producer': 'Generate assets & iterations', 'design-engineer': 'Implement, integrate & package', 'independent-critic': 'Review, test & validate' })[agent.id] || '')), btn('View agent', { tone: 'outline', size: 'xs', href: `#/agents/${agent.id}`, icoRight: 'ArrowRight' })),
      h('dt', {}, 'Model'), h('dd', {}, h('span', { class: 'tool' }, toolMark('Claude Code'), 'Claude Code (Sonnet 4)')),
      h('dt', {}, 'Skills'), h('dd', { class: 'tags' }, sk.slice(0, 4).map(id => h('span', { class: 'tag' }, skillName(id)))),
      h('dt', {}, 'Tools'), h('dd', { class: 'tool-row' }, ['VS Code', 'GitHub', 'Vercel'].map(x => h('span', { class: 'tool' }, toolMark(x), x))),
      h('dt', {}, 'Permissions'), h('dd', {}, h('ul', { class: 'perm-list' }, RUN.permissions.map(p => h('li', {}, icon('Check'), p)))),
      h('dt', {}, 'Token budget'), h('dd', {}, h('span', { class: 'mono-sm' }, `${budget.used.toLocaleString()} / ${budget.total.toLocaleString()} (${Math.round(budget.used / budget.total * 100)}%)`), meter(budget.used / budget.total * 100, '', 'Token budget used')),
      h('dt', {}, `Evidence (${RUN.evidence.length})`), h('dd', { class: 'files' }, RUN.evidence.map(e => h('div', { class: 'file' }, icon('File'), h('span', {}, e.name), h('small', {}, e.size, h('br'), e.ago)))),
      h('dt', {}, 'Recent logs'), h('dd', {}, h('div', { class: 'log' }, RUN.logs.map(([tm, msg]) => h('div', {}, h('b', {}, tm), msg)))),
      h('dt', {}, 'Why this task?'), h('dd', { class: 'why' }, icon('Info'), sel === 0 ? 'Oracle starts every run by re-reading the approved intake.' : 'Previous stages completed. All required assets generated. This stage is next in the execution plan.')),
  ], { label: 'Task details' });

  const head = h('div', { class: 'view-work-head' }, runHeader(r),
    h('div', { class: 'run-tabs-row' }, tabs([['overview', 'Overview'], ['timeline', 'Timeline'], ['agents', 'Agents'], ['artifacts', 'Artifacts'], ['logs', 'Logs']], workTab, { onSelect: id => { workTab = id; rr(); } }), inspectorToggle('Task details')));
  const main = h('div', { class: 'view-work' },
    workTab === 'overview' || workTab === 'timeline' ? h('div', { class: `work-grid${workTab === 'timeline' ? ' single' : ''}` }, timeline, workTab === 'overview' ? preview : null)
      : workTab === 'agents' ? h('div', { class: 'card pad' }, h('div', { class: 'rowlist' }, roster.filter(a => RUN.tasks.some(x => x.agent === a.id)).map(a => h('a', { class: 'res-row', href: `#/agents/${a.id}` }, icon(AGENT_ICONS[a.id]), h('div', {}, h('b', {}, a.name), h('span', {}, a.responsibility)), h('span', { class: 'badge grey' }, `${RUN.tasks.filter(x => x.agent === a.id).length} task(s)`)))))
      : workTab === 'artifacts' ? h('div', { class: 'card pad' }, h('div', { class: 'files' }, RUN.tasks.flatMap(x => x.files).filter(f => f !== '—').map(f => h('div', { class: 'file' }, icon('FileText'), h('span', {}, f), h('small', {}, 'Run 0248')))))
      : h('div', { class: 'card pad' }, h('div', { class: 'log big' }, RUN.logs.map(([tm, msg]) => h('div', {}, h('b', {}, tm), msg)))));
  return { head, main, inspector: side, inspectorWidth: '24rem' };
}

export function renderResults() {
  const s = store.session;
  const approved = s.resultApproved;
  const head = h('header', { class: 'page-head run-head' },
    h('div', { class: 'titles' },
      h('div', { class: 'run-title-row' }, h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, `Run ${RUN.id}`), badge(approved ? 'Approved' : 'Completed', 'green', 'CircleCheck', true), s.run.status === 'complete' ? null : demoFlag('Demo run')),
      h('p', { class: 'run-meta' }, `Generated ${RUN.started}  •  4/6 agents completed  •  27m 16s`)),
    h('div', { class: 'head-actions' },
      btn('Compare version', { tone: 'outline', ico: 'ArrowLeftRight', href: '#/playground' }),
      btn('Export', { tone: 'outline', ico: 'Download', onClick: () => { const blob = new Blob([JSON.stringify({ run: RUN, qa: QA, session: { approved } }, null, 2)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'apollo-run-0248.json' }); a.click(); } }),
      btn('Deploy preview', { tone: 'outline', ico: 'ExternalLink', onClick: () => window.open('/fixtures/northstar-site.html?v=concrete', '_blank') }),
      h('span', { class: 'head-sep' }),
      btn('Request changes', { tone: 'outline', ico: 'MessageSquare', onClick: () => { document.getElementById('oracle-input').focus(); document.getElementById('oracle-input').value = 'Request changes on Run 0248: '; } }),
      btn(approved ? 'Result approved' : 'Approve result', { tone: 'green', ico: 'Check', attrs: { disabled: approved ? true : null, 'data-tour': 'result-approve' }, onClick: async () => {
        const ok = await confirmModal({ title: 'Approve the result? (Gate C)', body: 'Your acceptance closes Gate C. Execution completion, technical verification and your acceptance are recorded separately; the critic noted 2 limitations.', confirm: 'Approve result' });
        if (ok) { saveSession({ resultApproved: true }); toast('Gate C passed — result approved.', 'green', icon('CircleCheck')); }
      } })));

  let body;
  if (resultTab === 'preview') {
    body = h('div', { class: 'result-preview', 'data-tour': 'result-preview' },
      h('div', { class: 'rp-head' }, h('div', {}, h('span', { class: 'label strong-label' }, 'Final responsive website'), h('p', { class: 'mono-sm' }, `This is the generated output from Run ${RUN.id}. Preview and verify before approval.`)),
        h('div', { class: 'seg' }, h('button', { type: 'button', class: device === 'desktop' ? 'on' : '', onclick: () => { device = 'desktop'; rr(); } }, icon('Monitor'), 'Desktop'), h('button', { type: 'button', class: device === 'mobile' ? 'on' : '', onclick: () => { device = 'mobile'; rr(); } }, icon('Smartphone'), 'Mobile'))),
      h('div', { class: `rp-frame ${device}` }, scaledFrame('/fixtures/northstar-site.html?v=concrete', 'Final responsive website preview', device === 'mobile' ? 390 : 1280, 'site-frame')));
  } else if (resultTab === 'qa') {
    body = h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'QA & tests'), qaList());
  } else if (resultTab === 'evidence') {
    body = h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Evidence'), h('div', { class: 'files' }, RUN.evidence.map(e => h('div', { class: 'file' }, icon('File'), h('span', {}, e.name), h('small', {}, `${e.size} · ${e.ago}`)))));
  } else if (resultTab === 'changes') {
    body = h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, '12 files changed'), h('div', { class: 'files' }, ['src/app/page.tsx', 'src/app/layout.tsx', 'src/components/Hero.tsx', 'src/components/Logos.tsx', 'src/styles/tokens.css', 'public/hero.webp'].map(f => h('div', { class: 'file' }, icon('FileDiff'), h('span', {}, f), h('small', {}, '+ modified')))));
  } else {
    body = h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Agent logs'), h('div', { class: 'log big' }, RUN.tasks.map(t => h('div', {}, h('b', {}, t.n), `${t.title} — ${t.status === 'done' ? 'completed' : 'see run'}`))));
  }

  const side = inspector([
    h('div', { class: 'ins-head-row' }, h('span', { class: 'label strong-label' }, 'Run details'), h('a', { class: 'link', href: '#/work/0248' }, 'View run', icon('ArrowRight'))),
    h('dl', { class: 'kv run-kv' }, h('dt', {}, 'Version'), h('dd', {}, 'v0.1.0'), h('dt', {}, 'Completed'), h('dd', {}, '3 Sep 2026, 20:14 (27m 16s)'), h('dt', {}, 'Producing agents'), h('dd', {}, 'Design Director, Visual Analyst, Asset Producer, Design Engineer')),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Inputs & references'), [['Oracle intake (Northstar)', 3], ['Brand & product docs', 5], ['Reference websites', 4]].map(([t, n]) => h('details', { class: 'exp' }, h('summary', {}, icon('FileText'), t, h('span', {}, `${n} items`), icon('ChevronDown')), h('p', { class: 'mono-sm' }, 'Recorded with the run.')))),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Plan & design'), [['Plan hash', 'pln_9f3a2c1e'], ['Design hash', 'dsg_7c8d4e9b']].map(([k, v]) => h('div', { class: 'hash-row' }, icon('FileText'), h('span', {}, k), h('code', {}, v), h('button', { class: 'icon-btn sm', type: 'button', 'aria-label': `Copy ${k}`, onclick: () => { navigator.clipboard?.writeText(v); toast(`${k} copied.`, 'green', icon('Copy')); } }, icon('Copy'))))),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Changes (from previous)'), h('div', { class: 'hash-row' }, icon('FileText'), h('span', {}, '12 files changed'), h('button', { class: 'link', type: 'button', onclick: () => { resultTab = 'changes'; rr(); } }, 'View changes', icon('ArrowRight')))),
    h('div', { class: 'ins-sec', 'data-tour': 'result-qa' }, h('span', { class: 'label' }, 'Quality & verification'), qaList()),
    h('div', { class: `gate-c ${approved ? 'green' : 'amber'}` }, h('span', { class: 'gate-ico' }, icon(approved ? 'CircleCheck' : 'CircleDot')), h('div', {}, h('b', {}, approved ? 'Gate C — accepted by you' : 'Gate C — awaiting user review'), h('span', {}, icon('Clock'), approved ? 'Delivered. Choose the next step with Oracle.' : 'Final review required to move to Implement.'))),
  ], { label: 'Run details' });

  const main = h('div', { class: 'view-results' }, body);
  void segbar;
  return { head: h('div', { class: 'view-results-head' }, head, h('div', { class: 'run-tabs-row' }, tabs([['preview', 'Preview'], ['evidence', 'Evidence'], ['changes', 'Changes'], ['qa', 'QA & Tests'], ['logs', 'Agent logs']], resultTab, { onSelect: id => { resultTab = id; rr(); } }), inspectorToggle('Run details'))), main, inspector: side, inspectorWidth: '26.5rem' };
}

function qaList() {
  return h('div', { class: 'qa-list' }, QA.map(q => h('div', { class: 'qa-row' }, icon(q.icon), h('span', { class: 'qa-label' }, q.label, q.note && q.verdict !== 'VIEW' ? h('small', {}, ` ${q.note}`) : null),
    h('span', { class: 'qa-score' }, q.verdict === 'VIEW' ? [h('span', { class: 'qa-dot amber' }, '!'), q.note] : [h('span', { class: `qa-dot ${q.tone}` }, icon('Check')), q.score ?? '']),
    q.verdict === 'VIEW' ? h('a', { class: 'link', href: '#/system/0248' }, 'View', icon('ArrowRight')) : h('span', { class: `badge ${q.tone}` }, q.verdict))));
}
