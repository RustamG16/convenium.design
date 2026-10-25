// Projects list, project workspace tabs, and screen 03 — Brief & Design DNA.
import { h, confirmModal, toast } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, projectHead, tabs, btn, banner, segbar, tag, demoFlag, emptyState, badge } from '../ui.js';
import { store, saveSession, stageStates, intakeProgress, currentStage } from '../store.js';
import { setDockSelection } from '../shell.js';
import { PROJECTS, BRIEF, DNA, DNA_TAGS, INTAKE, KNOWLEDGE } from '../fixtures/northstar.js';

const rr = () => import('../main.js').then(m => m.rerender());

export function renderProjects() {
  const stage = currentStage();
  const ws = store.data.workspace?.projects || [];
  const rows = PROJECTS.map((p, i) => h('a', { class: 'proj-row card', href: i === 0 ? '#/projects/northstar' : '#/projects', dataset: { project: p.id } },
    h('span', { class: 'ico-box' }, icon('Folder')),
    h('div', {}, h('strong', { class: 'title-sm' }, p.name), h('span', { class: 'mono-sm' }, p.kind)),
    h('span', { class: 'mono-sm' }, p.tagline),
    h('span', { class: 'recent-stage' }, h('span', { class: `ring-dot ${p.tone}` }), i === 0 ? stage.title : p.stage),
    h('div', { class: 'proj-progress' }, segbar(5, i === 0 ? Math.min(5, (stage.index ?? 0) + 1) : p.stage === 'Complete' ? 5 : 3)),
    icon('ArrowRight')));
  const main = h('div', { class: 'view-projects' },
    pageHead({ eyebrow: '// Projects', title: 'Your work, in one place.', sub: 'Every project keeps its brief, plan, runs and evidence together.', actions: [btn('New project with Oracle', { ico: 'Plus', href: '#/home' })] }),
    h('div', { class: 'proj-head-row label' }, h('span'), h('span', {}, 'Project'), h('span', {}, 'Focus'), h('span', {}, 'Stage'), h('span', {}, 'Progress'), h('span')),
    h('div', { class: 'proj-list' }, rows),
    h('p', { class: 'label proj-ws-label' }, 'Local workspace projects ', demoFlag('Recorded on this machine')),
    ws.length ? h('div', { class: 'proj-list' }, ws.map(p => h('div', { class: 'proj-row card ws' }, h('span', { class: 'ico-box' }, icon('FolderOpen')),
      h('div', {}, h('strong', { class: 'title-sans' }, p.name), h('span', { class: 'mono-sm' }, `${p.chats?.length || 0} conversation(s)`)),
      h('span', { class: 'mono-sm' }, `Updated ${new Date(p.updatedAt).toLocaleDateString()}`), h('span'), h('span'), h('a', { class: 'link', href: '/legacy/#work' }, 'Open in legacy', icon('ExternalLink')))))
      : emptyState('No local workspace projects', 'Projects created in the legacy workspace appear here.'));
  return { main };
}

function projectTabs(active) {
  return tabs([['overview', 'Overview', '#/projects/northstar/overview'], ['brief', 'Brief', '#/projects/northstar/brief'], ['research', 'Research', '#/projects/northstar/research'], ['files', 'Files', '#/projects/northstar/files'], ['activity', 'Activity', '#/projects/northstar/activity']], active, { cls: 'sans project-tabs' });
}

export function renderProject(route) {
  const tab = route.params.tab;
  if (tab === 'brief') return renderBrief();
  const states = stageStates();
  let content;
  if (tab === 'overview') {
    content = h('div', { class: 'overview-grid' },
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Stages'),
        h('div', { class: 'ov-stages' }, states.map(s => h('a', { class: `ov-stage ${s.status}`, href: s.index === 0 ? '#/projects/northstar/intake' : s.index === 1 ? '#/projects/northstar/brief' : s.index === 3 ? '#/plan/configure' : s.index === 4 ? '#/work/0248' : '#/plan' },
          h('span', { class: 'ov-n' }, s.n), icon(s.icon), h('div', {}, h('strong', {}, s.title), h('span', {}, s.sub)), h('span', { class: `status-text ${toneOf(s.status)}` }, s.status))))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Brief at a glance', h('a', { class: 'more', href: '#/projects/northstar/brief' }, 'Open brief', icon('ArrowRight'))),
        h('dl', { class: 'kv' }, BRIEF.slice(0, 5).flatMap(b => [h('dt', {}, b.label), h('dd', {}, b.value.split('\n')[0])]))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Intake'), h('p', { class: 'mono-sm' }, `${intakeProgress().answered} of ${INTAKE.length} questions answered.`), btn('Continue intake', { tone: 'outline', size: 'sm', href: '#/projects/northstar/intake', icoRight: 'ArrowRight' })));
  } else if (tab === 'research') {
    content = h('div', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Research & references ', demoFlag()),
      h('div', { class: 'files' }, ['competitive-analysis.md', 'customer-interviews.md', 'brand-guidelines.pdf', 'reference-websites.md'].map(f => h('div', { class: 'file' }, icon('FileText'), h('span', {}, f), h('small', {}, 'Attached')))));
  } else if (tab === 'files') {
    content = h('div', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Project files ', demoFlag()),
      h('div', { class: 'files' }, KNOWLEDGE.evidence.map(([f, ago]) => h('div', { class: 'file' }, icon('FileText'), h('span', {}, f), h('small', {}, ago)))));
  } else {
    const events = (store.data.events || []).slice(-12).reverse();
    content = h('div', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Activity'),
      events.length ? h('div', { class: 'log' }, events.map(e => h('div', {}, h('b', {}, new Date(e.at || e.timestamp || Date.now()).toLocaleTimeString()), e.summary)))
        : h('p', { class: 'mono-sm' }, 'No recorded host events yet. Oracle plans and runs appear here.'));
    import('../api.js').then(({ api }) => api.events().then(r => { const list = r.events || r; if (Array.isArray(list) && list.length && !store.data.events.length) { store.data.events = list; rr(); } }).catch(() => {}));
  }
  const main = h('div', { class: 'view-project' },
    projectHead({ sub: 'AI agents for real operations  //  Oracle → Impact', iconBox: true, actions: [btn('Open brief', { tone: 'outline', href: '#/projects/northstar/brief' })] }),
    projectTabs(tab), content);
  return { main };
}

const toneOf = s => ({ completed: 'green', approved: 'green', active: 'blue', running: 'blue', ready: 'amber', pending: 'grey', locked: 'grey' }[s] || 'grey');

function dnaLabel(d, v) {
  if (d.id === 'editorial') return v > 55 ? 'Expressive' : v < 45 ? 'Editorial' : 'Balanced';
  if (d.id === 'calm') return v > 55 ? 'Energetic' : v < 45 ? 'Calm' : 'Balanced';
  if (d.id === 'minimal') return v < 45 ? 'Minimal' : v > 55 ? 'Rich' : 'Balanced';
  if (d.id === 'safe') return v < 40 ? 'Safe' : v > 60 ? 'Bold' : 'Balanced';
  if (d.id === 'motion') return v < 35 ? 'Low' : v > 70 ? 'High' : 'Moderate';
  return v < 45 ? 'Data-informed' : v > 60 ? 'Intuitive' : 'Data-informed';
}

let editing = null;

// Brief rows the intake answered directly take the user's answer instead of the example copy.
function fromIntake(rowId) {
  const a = store.session.intake.answers;
  const map = { outcome: 'success', audience: 'audience', constraints: 'constraints', assets: 'resources', risk: 'anything' };
  const ans = a[map[rowId]];
  if (!ans) return null;
  const base = ans.summary || ans.title;
  return ans.note ? `${base} ${ans.note}` : base;
}

function renderBrief() {
  const s = store.session;
  const intakeDone = intakeProgress().answered === INTAKE.length;
  const edits = s.briefEdits || {};
  const status = s.briefApproved ? banner('green', 'Brief approved', 'Approved with Oracle · plan generated')
    : intakeDone ? banner('green', 'Brief ready', `Prepared with Oracle · Updated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`)
    : banner('amber', 'Draft — intake in progress', `${intakeProgress().answered} of ${INTAKE.length} answers confirmed. Values below are the Northstar example.`);
  const approve = s.briefApproved
    ? btn('Open master plan', { href: '#/plan', icoRight: 'ArrowRight' })
    : btn('Approve brief & create plan', { icoRight: 'ArrowRight', attrs: { 'data-tour': 'brief-approve' }, onClick: async () => {
      const ok = await confirmModal({ title: 'Approve the brief?', body: 'Convenium.Design will generate the master plan from this brief and Design DNA. Nothing is built until you approve the plan and the configuration. Changing the brief later invalidates the plan approval.', confirm: 'Approve brief', tone: 'dark' });
      if (!ok) return; saveSession({ briefApproved: true }); toast('Brief approved — master plan generated.', 'green', icon('CircleCheck')); location.hash = '#/plan';
    } });

  const rows = h('div', { class: 'rowlist brief-rows', 'data-tour': 'brief-rows' }, BRIEF.map(b => {
    const value = edits[b.id] ?? fromIntake(b.id) ?? b.value;
    const isEditing = editing === b.id;
    const valueEl = isEditing
      ? h('textarea', { class: 'textarea brief-edit', 'aria-label': `Edit ${b.label}`, rows: 3 }, value)
      : h('p', { class: 'brief-value' }, value.split('\n').map((line, i) => [i ? h('br') : null, line.startsWith('In scope:') ? [h('b', {}, 'In scope:'), line.slice(9)] : line.startsWith('Out of scope:') ? [h('b', {}, 'Out of scope:'), line.slice(13)] : line]));
    return h('div', { class: 'rowcard brief-row', dataset: { row: b.id }, onclick: () => setDockSelection({ ico: b.icon, label: b.label }) },
      h('div', { class: 'ico-plain' }, icon(b.icon)),
      h('div', {}, h('strong', { class: 'title-sm' }, b.label), h('span', { class: 'mono-sm' }, b.hint)),
      h('div', { class: 'brief-val-cell' }, valueEl),
      h('div', { class: 'cell-b brief-src' }, h('span', { class: 'mono-sm' }, 'Source'), tag(edits[b.id] ? 'Edited by you' : b.source)),
      h('div', { class: 'cell-b' }, isEditing
        ? h('button', { class: 'link', type: 'button', onclick: e => { e.stopPropagation(); const v = e.currentTarget.closest('.brief-row').querySelector('textarea').value; editing = null; saveSession({ briefEdits: { ...edits, [b.id]: v }, briefApproved: false, planApproved: false }); } }, icon('Check'), 'Save')
        : h('button', { class: 'link', type: 'button', onclick: e => { e.stopPropagation(); editing = b.id; rr(); } }, icon('PencilLine'), 'Edit')));
  }));

  const dna = h('section', { class: 'card pad dna-card', 'data-tour': 'design-dna' },
    h('div', { class: 'dna-head' }, h('div', {}, h('span', { class: 'label green' }, '// Convenium.Design Design DNA'), h('p', { class: 'dna-sub' }, 'Visual and interaction direction for Northstar.')), icon('Info')),
    DNA.map(d => {
      const v = s.dna[d.id] ?? d.value;
      const val = h('span', { class: `val ${d.tone === 'amber' ? 'amber' : d.tone === 'blue' ? 'blue' : ''}` }, dnaLabel(d, v));
      const input = h('input', { type: 'range', min: 0, max: 100, value: v, 'aria-label': `${d.left} to ${d.right}`, style: { '--thumb': d.tone === 'amber' ? 'var(--amber)' : d.tone === 'blue' ? 'var(--blue)' : 'var(--green)' },
        oninput: e => { val.textContent = dnaLabel(d, Number(e.target.value)); },
        onchange: e => saveSession({ dna: { ...store.session.dna, [d.id]: Number(e.target.value) } }) });
      return h('div', { class: 'dna-row' },
        h('div', { class: 'dna-top' }, h('span', {}, d.left), h('div', { class: 'dna-track' }, '←', input, '→'), val),
        h('div', { class: 'dna-src' }, 'Source', tag(d.source), h('span', { class: 'link' }, icon('PencilLine'), 'Edit')));
    }),
    h('span', { class: 'label dna-tags-label' }, 'Key tags'),
    h('div', { class: 'tags' }, DNA_TAGS.map((t, i) => tag(t, i === 0 ? 'green' : ''))));

  const main = h('div', { class: 'view-brief' },
    projectHead({ sub: 'AI agents for real operations  //  Oracle → Impact', iconBox: true, status, actions: [btn('Share', { tone: 'outline', ico: 'Share2', onClick: () => { navigator.clipboard?.writeText(location.href); toast('Link copied.', 'green', icon('Link')); } }), approve] }),
    projectTabs('brief'),
    h('div', { class: 'brief-grid' },
      h('div', {},
        h('div', { class: 'brief-titlebar' },
          h('div', {}, h('p', { class: 'eyebrow green' }, '// Project brief'), h('h2', { class: 'display' }, 'Clear direction. Real outcomes.'), h('p', { class: 'subline' }, 'A shared brief turns ideas into execution.')),
          h('div', { class: 'brief-updated' }, h('span', { class: 'label' }, 'Last updated'), h('span', {}, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })), h('span', {}, 'Created with Oracle'))),
        rows),
      dna));
  void badge;
  return { main };
}
