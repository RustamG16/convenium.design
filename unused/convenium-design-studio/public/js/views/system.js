// Screen 10 — System / Node control. Pipeline execution graph, Operator-style neural
// architecture, and list views of agents, skills and tools.
import { h, toast, confirmModal, titleCase } from '../dom.js';
import { icon, AGENT_ICONS, toolMark } from '../icons.js';
import { btn, badge, meter, inspector, inspectorToggle, demoFlag, tag } from '../ui.js';
import { store, saveSession, agentRoster, agentSkills, skillName, skills, phases, slots } from '../store.js';
import { setDockSelection } from '../shell.js';
import { createGraph, graphList, neuralNode } from '../graph.js';
import { RUN, STAGES } from '../fixtures/northstar.js';

const rr = () => import('../main.js').then(m => m.rerender());
let selected = 'design-engineer';
let listMode = false;
let agentFilter = 'all';
let statusFilter = 'all';
let archStage = 2;
let insTab = 'overview';
let skillPhase = 'all';
let graphRef = null;
const skillOfNode = new Map();

const W = 1040, H = 560;
const TASK_OF = { oracle: 0, 'design-director': 1, 'visual-analyst': 1, 'asset-producer': 2, 'design-engineer': 3, 'independent-critic': 4, results: 5 };
const TIMES = { oracle: '12s', 'design-director': '3m 12s', 'visual-analyst': '5m 21s', 'asset-producer': '8m 46s', 'design-engineer': '7m 03s' };
const ID_TONE = { oracle: 'green', 'design-director': 'green', 'visual-analyst': 'pink', 'asset-producer': 'pink', 'design-engineer': 'blue', 'independent-critic': 'slate', results: 'green' };
const DESC = { oracle: 'Strategic intake & run configuration', 'design-director': 'Plan, decompose & delegate', 'visual-analyst': 'Reference analysis & style extraction', 'asset-producer': 'Generate assets & iterations', 'design-engineer': 'Implement, integrate & package', 'independent-critic': 'Review, test & validate', results: 'Package & deliver outputs' };

function runState() { const r = store.session.run; return r.status === 'idle' ? { status: 'replay', task: 3 } : r; }
function nodeStatus(id, r) {
  const t = TASK_OF[id];
  if (r.status === 'complete' || t < r.task) return 'completed';
  if (t > r.task) return id === 'independent-critic' && r.task === 3 ? 'waiting' : 'notstarted';
  if (r.status === 'cancelled') return 'error';
  return r.task === 4 || r.status === 'paused' || r.status === 'replay' ? 'paused' : 'running';
}
const NS = { completed: ['Completed', 'CircleCheck', 'green'], running: ['Running', 'LoaderCircle', 'blue'], paused: ['Paused', 'CirclePause', 'amber'], waiting: ['Waiting', 'CircleDot', 'amber'], notstarted: ['Pending', 'Circle', 'grey'], error: ['Error', 'CircleX', 'coral'] };

function agentCard(id, name, r) {
  const st = nodeStatus(id, r);
  const [txt, ic] = NS[st];
  const tone = st === 'paused' || st === 'running' ? 'amber' : ID_TONE[id];
  const sub = st === 'completed' ? TIMES[id] || '' : st === 'paused' ? 'Waiting for approval' : st === 'waiting' ? 'Not started' : st === 'notstarted' ? 'Not started' : 'In progress';
  const dim = (agentFilter !== 'all' && agentFilter !== id) || (statusFilter !== 'all' && statusFilter !== st);
  return h('button', { type: 'button', class: `gnode-card t-${tone}${id === selected ? ' selected' : ''}`, style: { opacity: dim ? '.28' : '1' }, 'aria-label': `${name}: ${txt}` },
    h('span', { class: 'gi' }, icon(id === 'results' ? 'Flag' : id === 'oracle' ? 'FileText' : AGENT_ICONS[id])),
    h('b', {}, name), h('p', {}, DESC[id]),
    h('span', { class: `gs${st === 'notstarted' ? ' grey' : ''}` }, icon(ic), h('span', {}, txt, h('small', {}, sub))));
}
function sat(label, ico) { return h('span', { class: 'gsat', title: label }, ico, h('span', {}, label)); }

function pipelineModel(r) {
  const roster = agentRoster();
  const name = id => id === 'results' ? 'Results' : roster.find(a => a.id === id)?.name || titleCase(id);
  const nw = 128, nh = 132;
  const agentsPos = { oracle: [12, 214], 'design-director': [178, 214], 'visual-analyst': [356, 104], 'asset-producer': [356, 322], 'design-engineer': [548, 214], 'independent-critic': [728, 214], results: [904, 214] };
  const nodes = Object.entries(agentsPos).map(([id, [x, y]]) => ({ id, x, y, w: nw, h: nh, tone: ID_TONE[id] === 'blue' ? 'amber' : ID_TONE[id], el: agentCard(id, name(id), r) }));
  const S = (id, label, ico, x, y, parent, side) => ({ id, x, y, w: 58, h: 50, sat: true, parent, side, mini: false, el: sat(label, ico) });
  const sats = [
    S('s-vision', 'Vision', icon('Eye'), 330, 26, 'visual-analyst', 'top'), S('s-imgsearch', 'Image Search', icon('Database'), 391, 26, 'visual-analyst', 'top'), S('s-trend', 'Trend DB', icon('TrendingUp'), 452, 26, 'visual-analyst', 'top'),
    S('s-strategy', 'Strategy', icon('Target'), 12, 398, 'oracle', 'bottom'), S('s-research', 'Research', icon('Database'), 76, 398, 'oracle', 'bottom'),
    S('s-websearch', 'Web Search', icon('Search'), 178, 398, 'design-director', 'bottom'), S('s-knowledge', 'Knowledge', icon('BookOpen'), 242, 398, 'design-director', 'bottom'),
    S('s-imggen', 'Image Gen', icon('Image'), 330, 488, 'asset-producer', 'bottom'), S('s-vidgen', 'Video Gen', icon('Video'), 391, 488, 'asset-producer', 'bottom'), S('s-3d', '3D Tools', icon('Box'), 452, 488, 'asset-producer', 'bottom'),
    S('s-claude', 'Claude Code', toolMark('Claude Code'), 520, 134, 'design-engineer', 'top'), S('s-code', 'Code Tools', icon('Wrench'), 581, 134, 'design-engineer', 'top'), S('s-keys', 'API Keys', icon('KeyRound'), 642, 134, 'design-engineer', 'top'),
    S('s-eval', 'Eval Tools', icon('ChartNoAxesColumn'), 700, 134, 'independent-critic', 'top'), S('s-lint', 'Linter', icon('FileText'), 761, 134, 'independent-critic', 'top'), S('s-test', 'Test Suite', icon('FlaskConical'), 822, 134, 'independent-critic', 'top'),
  ];
  const flowOn = id => nodeStatus(id, r) === 'running';
  const edges = [
    { from: 'oracle', to: 'design-director', tone: 'blue', fromSide: 'right', toSide: 'left' },
    { from: 'design-director', to: 'visual-analyst', tone: 'blue', fromSide: 'right', toSide: 'left' },
    { from: 'design-director', to: 'asset-producer', tone: 'blue', fromSide: 'right', toSide: 'left' },
    { from: 'visual-analyst', to: 'design-engineer', tone: 'blue', fromSide: 'right', toSide: 'left' },
    { from: 'asset-producer', to: 'design-engineer', tone: 'blue', fromSide: 'right', toSide: 'left' },
    { from: 'design-engineer', to: 'independent-critic', tone: 'blue', fromSide: 'right', toSide: 'left', flow: flowOn('design-engineer') },
    { from: 'independent-critic', to: 'results', tone: 'blue', fromSide: 'right', toSide: 'left' },
    ...sats.map(s => ({ from: s.side === 'top' ? s.id : s.parent, to: s.side === 'top' ? s.parent : s.id, tone: 'grey', dashed: true, arrow: false, curve: 'straight', fromSide: 'bottom', toSide: 'top' })),
  ];
  return { nodes: [...nodes, ...sats], edges };
}

function architectureModel() {
  const stage = STAGES[archStage];
  const ph = phases().filter(p => stage.phases.includes(p.id));
  let owners = [...new Set(ph.map(p => p.owner))];
  if (!owners.length) owners = [...new Set(slots().map(s => s.owner))];
  const cx = W / 2, coreY = 440;
  const nodes = []; const edges = [];
  const background = h('div', { class: 'core-orb', style: { left: `${cx}px`, top: `${coreY}px`, width: '150px', height: '150px' } }, h('img', { src: '/media/apollo/neural-core.webp', alt: '' }));
  nodes.push({ id: 'core', x: cx, y: coreY, w: 1, h: 1, selectable: false, mini: false, el: h('span', { class: 'core-anchor' }) });
  const agentY = 300; const skillY = 120;
  owners.forEach((oid, i) => {
    const ax = cx + (i - (owners.length - 1) / 2) * Math.min(220, 760 / Math.max(1, owners.length));
    const agent = agentRoster().find(a => a.id === oid);
    nodes.push({ id: `a-${oid}`, x: ax, y: agentY, w: 1, h: 1, el: neuralNode({ ico: AGENT_ICONS[oid], label: agent?.name || oid, tone: 'green', size: 34 }) });
    edges.push({ from: `a-${oid}`, to: 'core', tone: 'white', dotted: true, arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', opacity: .8 });
    const sk = agentSkills(oid);
    const spread = Math.min(sk.length * 62, 360);
    sk.forEach((sid, j) => {
      const sx = ax + (sk.length === 1 ? 0 : (j / (sk.length - 1) - .5) * spread);
      const sy = skillY + (j % 2) * 34;
      const s = skills().find(x => x.id === sid);
      skillOfNode.set(`s-${oid}-${j}`, sid);
      nodes.push({ id: `s-${oid}-${j}`, x: sx, y: sy, w: 1, h: 1, el: neuralNode({ ico: 'Zap', label: s?.name || sid, tone: s?.defaultOn ? 'coral' : 'amber', size: 22, title: s?.description }) });
      edges.push({ from: `a-${oid}`, to: `s-${oid}-${j}`, tone: 'white', arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', width: 1, opacity: .55 });
    });
  });
  // Neighbouring stages fade at the corners, as departments do in the Operator view.
  const prev = STAGES[(archStage + STAGES.length - 1) % STAGES.length]; const next = STAGES[(archStage + 1) % STAGES.length];
  nodes.push({ id: 'prev', x: 90, y: 450, w: 1, h: 1, el: neuralNode({ ico: prev.icon, label: prev.title, tone: 'amber', size: 28 }) });
  nodes.push({ id: 'next', x: W - 90, y: 450, w: 1, h: 1, el: neuralNode({ ico: next.icon, label: next.title, tone: 'blue', size: 28 }) });
  for (const [id, x] of [['prev', 30], ['next', W - 30]]) { nodes.push({ id: `${id}-a`, x: x + (id === 'prev' ? 60 : -60), y: 300, w: 1, h: 1, selectable: false, el: h('span', { class: 'nnode t-grey dim' }, h('span', { class: 'nnode-ring', style: { '--s': '14px' } })) }); edges.push({ from: id, to: `${id}-a`, tone: 'grey', arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', width: 1, opacity: .4 }); }
  return { nodes, edges, background, stage };
}

export function renderSystem(route) {
  const tab = route.params.tab || 'pipeline';
  const r = runState();
  const roster = agentRoster();
  const mobile = window.matchMedia('(max-width: 819px)').matches;
  graphRef?.destroy?.();

  const header = h('header', { class: 'page-head run-head' },
    h('div', { class: 'titles' }, h('p', { class: 'eyebrow' }, 'System run'),
      h('div', { class: 'run-title-row' }, h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, `Run ${RUN.id}`),
        r.status === 'complete' ? badge('Completed', 'green', 'CircleCheck', true) : r.status === 'cancelled' ? badge('Cancelled', 'coral', null, true) : badge('Paused — approval required', 'amber', 'Pause', true), r.status === 'replay' ? demoFlag('Demo replay') : null),
      h('p', { class: 'run-meta' }, `Started 3 Sep 2026, 20:14  •  Elapsed 27m 16s  •  ${Math.min(r.task, 6) > 4 ? 6 : Math.min(r.task + 1, 4)}/6 agents completed`)),
    h('div', { class: 'quote' }, '"A higher standard', h('br'), 'for creative work."', h('br'), '// Convenium.Design'));

  const toolbar = h('div', { class: 'sys-toolbar', 'data-tour': 'system-tabs' },
    h('div', { class: 'sys-tabs', role: 'tablist' }, [['pipeline', 'Workflow', 'Pipeline'], ['architecture', 'Network', 'Architecture'], ['agents', 'User', 'Agents'], ['skills', 'Zap', 'Skills'], ['tools', 'Wrench', 'Tools']].map(([id, ic, t]) =>
      h('a', { role: 'tab', 'aria-selected': tab === id ? 'true' : 'false', class: tab === id ? 'on' : '', href: `#/system/${route.params.run}?tab=${id}` }, icon(ic), t))),
    tab === 'pipeline' ? h('div', { class: 'sys-filters' },
      h('div', { class: 'seg light' }, h('button', { type: 'button', class: listMode ? '' : 'on', onclick: () => { listMode = false; rr(); } }, icon('Network'), 'Graph'), h('button', { type: 'button', class: listMode ? 'on' : '', onclick: () => { listMode = true; rr(); } }, icon('List'), 'List')),
      h('select', { class: 'select sm', 'aria-label': 'Filter agents', onchange: e => { agentFilter = e.target.value; rr(); } }, h('option', { value: 'all' }, 'All Agents'), roster.map(a => h('option', { value: a.id, selected: agentFilter === a.id ? true : null }, a.name))),
      h('select', { class: 'select sm', 'aria-label': 'Filter status', onchange: e => { statusFilter = e.target.value; rr(); } }, h('option', { value: 'all' }, 'All Statuses'), Object.entries(NS).map(([k, v]) => h('option', { value: k, selected: statusFilter === k ? true : null }, v[0]))),
      h('select', { class: 'select sm', 'aria-label': 'Time range' }, h('option', {}, 'Last 24 hours'), h('option', {}, 'Last 7 days')),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fullscreen graph', onclick: () => document.querySelector('.sys-canvas')?.requestFullscreen?.() }, icon('Maximize'))) : null,
    inspectorToggle('Inspector'));

  let canvas;
  if (tab === 'pipeline') {
    const model = pipelineModel(r);
    const selectNode = id => { const n = model.nodes.find(x => x.id === id); if (n?.sat) { toast(`${n.el.textContent} — tool used by ${titleCase(n.parent)}.`, 'green', icon('Wrench')); return; } selected = id; setDockSelection({ ico: AGENT_ICONS[id] || 'Flag', label: id === 'results' ? 'Results' : roster.find(a => a.id === id)?.name }); rr(); document.body.classList.add('inspector-shown'); };
    if (listMode || mobile) {
      canvas = graphList(model.nodes.filter(n => !n.sat).map(n => { const st = nodeStatus(n.id, r); return { id: n.id, cells: [h('span', {}, icon(AGENT_ICONS[n.id] || 'Flag'), n.id === 'results' ? 'Results' : roster.find(a => a.id === n.id)?.name), DESC[n.id], NS[st][0], model.edges.filter(e => e.from === n.id && !e.dashed).map(e => e.to).join(', ') || '—'] }; }), selectNode, ['Node', 'Role', 'Status', 'Hands off to']);
    } else {
      const g = createGraph({ id: 'pipe', width: W, height: H, nodes: model.nodes, edges: model.edges, onSelect: selectNode, minimap: true });
      graphRef = g;
      g.root.querySelector('.g-zoom')?.classList.add('top');
      canvas = h('div', { class: 'gcanvas sys-canvas', 'data-tour': 'system-graph' },
        h('div', { class: 'gcanvas-head' }, h('div', { class: 'gcanvas-title' }, 'Execution graph  //  Oracle → Impact')),
        h('div', { class: 'g-phase-row' }, ['Input', 'Analysis', 'Creation', 'Engineering', 'Validation', 'Output'].map((p, i) => h('span', {}, p, i < 5 ? h('i', {}, '→') : null))),
        g.root,
        h('div', { class: 'status-legend' }, h('b', {}, 'Node status'), [['Completed', 'var(--node-green)'], ['Running', 'var(--node-blue)'], ['Waiting', 'var(--node-amber)'], ['Error', 'var(--node-coral)'], ['Not started', '#7F9592']].map(([t, c]) => h('span', {}, h('i', { style: { background: c } }), t))));
    }
  } else if (tab === 'architecture') {
    const model = architectureModel();
    const g = createGraph({ id: 'arch', width: W, height: H, nodes: model.nodes, edges: model.edges, background: model.background, zoomControls: true,
      onSelect: id => { if (id === 'prev') { archStage = (archStage + STAGES.length - 1) % STAGES.length; rr(); return; } if (id === 'next') { archStage = (archStage + 1) % STAGES.length; rr(); return; }
        if (id.startsWith('a-')) { selected = id.slice(2); rr(); document.body.classList.add('inspector-shown'); return; }
        const sid = skillOfNode.get(id); if (sid) { const s = skills().find(x => x.id === sid); toast(`${s?.name || sid}: ${s?.description || ''}`.slice(0, 180), 'green', icon('Zap')); } } });
    graphRef = g;
    canvas = h('div', { class: 'gcanvas sys-canvas neural', 'data-tour': 'system-neural' },
      h('div', { class: 'gcanvas-head' }, h('div', { class: 'gcanvas-title' }, 'Neural architecture  //  ', model.stage.title, h('small', {}, 'Stage → owning agents → skills they carry under the active loadout. Click an agent to inspect it; use the arrows to move between stages.')),
        h('div', { class: 'legend' }, h('span', {}, h('i', { style: { background: 'var(--node-green)' } }), 'Agent'), h('span', {}, h('i', { style: { background: 'var(--node-coral)' } }), 'Default-on skill'), h('span', {}, h('i', { style: { background: 'var(--node-amber)' } }), 'Skill'))),
      g.root,
      h('div', { class: 'stage-pager' }, h('button', { type: 'button', 'aria-label': 'Previous stage', onclick: () => { archStage = (archStage + STAGES.length - 1) % STAGES.length; rr(); } }, icon('ChevronLeft')), h('span', {}, model.stage.title), h('button', { type: 'button', 'aria-label': 'Next stage', onclick: () => { archStage = (archStage + 1) % STAGES.length; rr(); } }, icon('ChevronRight'))));
  } else if (tab === 'agents') {
    canvas = graphList(roster.map(a => ({ id: a.id, cells: [h('span', {}, icon(AGENT_ICONS[a.id]), a.name), a.phase || a.activation, `${a.id === 'oracle' ? 1 : agentSkills(a.id).length} skills`, a.budget ? `${a.budget.toLocaleString()} tokens` : '—'] })), id => { location.hash = `#/agents/${id}`; }, ['Agent', 'Phase', 'Skills', 'Budget']);
  } else if (tab === 'skills') {
    const all = skills().filter(s => skillPhase === 'all' || s.phase === skillPhase);
    canvas = h('div', {}, h('div', { class: 'sys-skill-filter' }, h('label', { class: 'kn-coll' }, h('span', {}, 'Phase:'), h('select', { class: 'select sm', onchange: e => { skillPhase = e.target.value; rr(); } }, ['all', 'always', 'diagnose', 'direct', 'prepare', 'build', 'verify', 'unrouted'].map(p => h('option', { value: p, selected: skillPhase === p ? true : null }, p === 'all' ? 'All phases' : titleCase(p))))), h('span', { class: 'mono-sm' }, `${all.length} of ${skills().length} skills · live registry`)),
      graphList(all.map(s => ({ id: s.id, cells: [h('span', {}, icon(s.defaultOn ? 'Star' : 'Zap'), s.name), titleCase(s.phase), s.group, s.status || (s.enabled ? 'active' : 'dormant')] })), id => { const s = skills().find(x => x.id === id); toast(`${s.name}: ${s.description}`.slice(0, 180), 'green', icon('Zap')); }, ['Skill', 'Phase', 'Group', 'Status']));
  } else {
    const cfg = store.data.config || {};
    canvas = graphList([...(cfg.tools || []).map(t => ({ id: t.id, cells: [h('span', {}, icon('Wrench'), t.name), 'Hosted tool', t.status, t.usable ? 'Usable' : 'Unavailable'] })),
      ...(cfg.plugins || []).map(p => ({ id: p.id, cells: [h('span', {}, icon('Plug'), p.name), 'Host plugin', p.status, '—'] })),
      ...(store.data.integrations || []).map(i => ({ id: i.id, cells: [h('span', {}, icon('Cable'), i.name), 'Integration', i.mode, i.detected ? 'Detected' : 'Not detected'] }))], null, ['Tool', 'Kind', 'Status', 'Availability']);
  }

  const sideAgent = selected === 'results' ? null : roster.find(a => a.id === selected) || roster.find(a => a.id === 'design-engineer');
  const st = nodeStatus(selected, r);
  const [stTxt, , stTone] = NS[st];
  const task = RUN.tasks.find(t => t.agent === selected) || RUN.tasks[3];
  const sk = sideAgent ? (sideAgent.id === 'oracle' ? ['olympus-design-director'] : agentSkills(sideAgent.id)) : [];
  const budgetTotal = sideAgent?.budget || 100000;
  const used = Math.round(budgetTotal * (st === 'completed' ? 0.86 : st === 'notstarted' || st === 'waiting' ? 0 : 0.42));
  const side = inspector([
    h('div', { class: 'ins-title sys-ins-title' }, h('span', { class: `ico-tile ${stTone}` }, icon(selected === 'results' ? 'Flag' : AGENT_ICONS[selected] || 'User')),
      h('div', {}, h('h2', {}, selected === 'results' ? 'Results' : sideAgent?.name), h('span', { class: 'id-chip' }, `ID: agent_${selected.split('-').map(x => x[0]).join('')}_01`)), badge(stTxt, stTone)),
    h('nav', { class: 'tabs sans ins-tabs' }, ['overview', 'logs', 'files', 'history'].map(t => h('button', { type: 'button', class: insTab === t ? 'on' : '', onclick: () => { insTab = t; rr(); } }, titleCase(t)))),
    insTab === 'overview' ? h('dl', { class: 'kv sys-kv' },
      h('dt', {}, 'Status'), h('dd', {}, h('span', { class: `status-line ${stTone}` }, icon(NS[st][1]), st === 'paused' ? 'Paused — approval required' : stTxt), h('small', {}, st === 'paused' ? 'Execution halted after generating initial implementation.' : st === 'completed' ? 'Finished and handed off its outputs.' : 'Not started yet; waits for its upstream gate.')),
      h('dt', {}, 'Current task'), h('dd', { class: 'task-dd' }, icon('FileText'), h('div', {}, h('b', {}, selected === 'design-engineer' ? 'Implement visual concept as a responsive web component' : task.title), h('small', {}, task.text))),
      h('dt', {}, 'Model'), h('dd', {}, h('span', { class: 'tool' }, toolMark('Claude Code'), 'Claude Code (Sonnet 4)')),
      h('dt', {}, 'Skills'), h('dd', { class: 'tags' }, sk.slice(0, 6).map(id => tag(skillName(id), '', icon('Zap')))),
      h('dt', {}, 'Tools'), h('dd', { class: 'tags' }, ['VS Code', 'GitHub', 'Figma MCP', 'Playwright', 'Terminal', 'Vercel'].map(t => h('span', { class: 'tag' }, toolMark(t), t))),
      h('dt', {}, 'Permissions'), h('dd', {}, h('ul', { class: 'perm-list' }, (sideAgent?.readOnly ? ['Read project files', 'Read outputs'] : RUN.permissions).map(p => h('li', {}, icon('Check'), p)))),
      h('dt', {}, 'Token budget'), h('dd', {}, h('span', { class: 'mono-sm' }, `${used.toLocaleString()} / ${budgetTotal.toLocaleString()} (${Math.round(used / budgetTotal * 100)}%)`), meter(used / budgetTotal * 100, '', 'Token budget used')),
      h('dt', {}, `Evidence (3)`), h('dd', { class: 'files' }, [['component_preview.tsx', '3.4 MB', '7m ago'], ['design-tokens.json', '12 KB', '8m ago'], ['screenshot.png', '1.2 MB', '9m ago']].map(([n, s, a]) => h('div', { class: 'file' }, icon('File'), h('span', {}, n), h('small', {}, s, h('br'), a)))),
      h('dt', {}, 'Why activated'), h('dd', { class: 'why' }, icon('Info'), sideAgent ? `Activation “${sideAgent.activation}”. ${sideAgent.responsibility}` : 'Collects approved outputs for Gate C.'))
      : insTab === 'logs' ? h('div', { class: 'log big' }, RUN.logs.map(([t, m]) => h('div', {}, h('b', {}, t), m)))
      : insTab === 'files' ? h('div', { class: 'files' }, task.files.map(f => h('div', { class: 'file' }, icon('FileText'), h('span', {}, f), h('small', {}, 'Run 0248'))))
      : h('div', { class: 'log big' }, h('div', {}, h('b', {}, '20:14'), 'Run started'), h('div', {}, h('b', {}, '20:26'), 'Oracle completed intake'), h('div', {}, h('b', {}, '20:44'), 'Direction approved (Gate A)')),
    h('div', { class: 'ins-actions two' },
      btn('Retry', { tone: 'outline', ico: 'RotateCcw', onClick: () => toast('Retry queued as a draft — approve in Work to run it.', 'green', icon('RotateCcw')) }),
      btn('Cancel Agent', { tone: 'danger', ico: 'CircleX', onClick: async () => { if (await confirmModal({ title: 'Cancel this agent?', body: 'The agent stops at its next safe point. Completed evidence is kept.', confirm: 'Cancel agent', tone: 'danger', cancel: 'Keep running' })) { saveSession({ run: { status: 'cancelled', task: runState().task } }); } } })),
  ], { label: 'Node inspector' });

  const main = h('div', { class: 'view-system' }, toolbar, canvas);
  return { head: header, main, inspector: side, inspectorWidth: '22rem', cleanup: () => graphRef?.destroy?.() };
}
