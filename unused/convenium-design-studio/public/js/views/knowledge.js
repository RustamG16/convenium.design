// Screen 09 — Knowledge / Connections. Northstar project graph, or the real skill library graph.
import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, btn, inspector, inspectorToggle, demoFlag, segbar } from '../ui.js';
import { store, skills } from '../store.js';
import { setDockSelection } from '../shell.js';
import { createGraph, graphList } from '../graph.js';
import { KNOWLEDGE } from '../fixtures/northstar.js';

const rr = () => import('../main.js').then(m => m.rerender());
let collection = 'project';
let selected = 'brief';
let query = '';
let graphRef = null;

const EDGE_TONE = { defines: 'green', informs: 'blue', aligns: 'amber', enables: 'purple', conflicts: 'coral', produces: 'blue' };
const W = 1000, H = 560;

function projectModel() {
  const nodes = KNOWLEDGE.nodes.map(n => ({ ...n, w: n.hub ? 220 : 210, h: n.hub ? 96 : 92 }));
  for (const n of nodes) { n.x = (n.x / 100) * W - n.w / 2; n.y = (n.y / 100) * H - n.h / 2; }
  return { nodes, edges: KNOWLEDGE.edges.map(e => ({ ...e, tone: EDGE_TONE[e.type], label: e.type })) };
}

// Real data: hub → 20 skill groups, sized by how many of the 84 registry skills they hold.
function libraryModel() {
  const all = skills();
  const groups = {};
  for (const s of all) (groups[s.group || 'Other'] ||= []).push(s);
  const entries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length).slice(0, 12);
  const hub = { id: 'library', type: 'Library', title: 'Convenium.Design skills', icon: 'Library', text: `${all.length} registry skills · ${all.filter(s => s.phase !== 'unrouted').length} routed`, w: 220, h: 96, x: W / 2 - 110, y: H / 2 - 48, tone: 'green', hub: true };
  const nodes = [hub];
  const edges = [];
  entries.forEach(([g, list], i) => {
    const a = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
    const routed = list.filter(s => s.phase !== 'unrouted').length;
    const n = { id: `g-${g}`, type: 'Skill group', title: g, icon: 'Boxes', text: `${list.length} skills · ${routed} routed`, w: 170, h: 78, x: W / 2 + Math.cos(a) * 380 - 85, y: H / 2 + Math.sin(a) * 210 - 39, tone: routed ? 'blue' : 'plain', skills: list };
    nodes.push(n);
    edges.push({ from: 'library', to: n.id, tone: routed ? 'blue' : 'grey', dashed: !routed, label: routed ? 'routes' : null, arrow: false });
  });
  return { nodes, edges };
}

function nodeEl(n) {
  const match = query && !`${n.title} ${n.text} ${n.type}`.toLowerCase().includes(query.toLowerCase());
  return h('button', { type: 'button', class: `gnode-card row t-${n.tone || 'plain'}${n.hub ? ' hub' : ''}${n.id === selected ? ' selected' : ''}`, style: { opacity: match ? '0.3' : '1' }, 'aria-label': `${n.title}, ${n.type}` },
    h('span', { class: 'gi' }, icon(n.icon)), h('span', { class: 'gcopy' }, h('b', {}, n.title), h('span', { class: 'gt' }, n.type), h('p', {}, n.text)));
}

export function renderKnowledge(route) {
  const listMode = route.params.mode === 'list' || window.matchMedia('(max-width: 819px)').matches;
  const model = collection === 'project' ? projectModel() : libraryModel();
  if (!model.nodes.some(n => n.id === selected)) selected = model.nodes[1]?.id || model.nodes[0].id;
  const sel = model.nodes.find(n => n.id === selected);
  const select = id => { selected = id; const n = model.nodes.find(x => x.id === id); setDockSelection({ ico: n.icon, label: n.title }); rr(); document.body.classList.add('inspector-shown'); };

  let canvas;
  graphRef?.destroy?.();
  if (listMode) {
    canvas = graphList(model.nodes.map(n => ({ id: n.id, cells: [h('span', {}, icon(n.icon), n.title), n.type, n.text, model.edges.filter(e => e.from === n.id || e.to === n.id).map(e => e.label || e.type).filter(Boolean).join(', ') || '—'] })), select, ['Item', 'Type', 'Summary', 'Relationships']);
  } else {
    const g = createGraph({ id: 'kg', width: W, height: H, nodes: model.nodes.map(n => ({ ...n, el: nodeEl(n) })), edges: model.edges, onSelect: select, zoomControls: true });
    graphRef = g;
    canvas = h('div', { class: 'gcanvas kg-canvas', 'data-tour': 'knowledge-graph' },
      h('div', { class: 'gcanvas-head' }, h('div', { class: 'gcanvas-title' }, 'Knowledge graph', h('small', {}, collection === 'project' ? 'People, ideas, artifacts and their relationships.' : 'Skill groups from the live Convenium.Design registry.')),
        collection === 'project' ? h('div', { class: 'legend' }, Object.entries({ Defines: 'var(--node-green)', Informs: 'var(--node-blue)', Aligns: 'var(--node-amber)', Enables: 'var(--node-purple)', Conflicts: 'var(--node-coral)' }).map(([k, c]) => h('span', {}, h('i', { style: { background: c } }), k)))
          : h('div', { class: 'legend' }, h('span', {}, h('i', { style: { background: 'var(--node-blue)' } }), 'Routed'), h('span', {}, h('i', { style: { background: '#5D7A7F' } }), 'Dormant'))),
      g.root);
  }

  const relEdge = model.edges.find(e => e.from === selected || e.to === selected);
  const confidence = collection === 'project' ? 0.92 : sel.skills ? sel.skills.filter(s => s.phase !== 'unrouted').length / sel.skills.length : 1;
  const side = inspector([
    h('div', { class: 'ins-head-row' }, h('span', { class: 'label strong-label' }, 'Knowledge item'), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: () => document.body.classList.remove('inspector-shown') }, icon('X'))),
    h('div', { class: 'ins-title' }, h('span', { class: 'ico-tile green' }, icon(sel.icon === 'Folder' ? 'FileText' : sel.icon)), h('div', {}, h('h2', { class: 'kn-title' }, sel.title), h('p', { class: 'label' }, sel.type))),
    h('p', { class: 'mono-sm kn-desc' }, sel.id === 'brief' ? 'Defines the vision, goals, scope and success criteria for Northstar.' : sel.text),
    h('dl', { class: 'kv kv-up kn-kv' },
      h('dt', {}, 'Relationship'), h('dd', {}, relEdge ? [h('span', { class: `dot ${EDGE_TONE[relEdge.type] === 'purple' ? 'blue' : EDGE_TONE[relEdge.type] || 'blue'}` }), ' ', h('b', {}, (relEdge.label || relEdge.type || 'routes').replace(/^./, c => c.toUpperCase())), h('br'), h('small', {}, relEdge.type === 'defines' ? 'Defines the project and sets direction for all subsequent work.' : 'Connected through the project graph.')] : '—'),
      h('dt', {}, 'Source'), h('dd', {}, collection === 'project' ? [h('a', { class: 'link', href: '#/projects/northstar/files' }, icon('FileText'), 'northstar-brief.pdf'), h('br'), h('small', {}, 'Uploaded • Sep 3, 2026')] : [icon('Database'), ' library/registry/skills.registry.json']),
      h('dt', {}, 'Freshness'), h('dd', {}, h('span', { class: 'dot green' }), ' Up to date', h('br'), h('small', {}, collection === 'project' ? 'Last updated 3 days ago' : 'Read from the server just now')),
      h('dt', {}, 'Host support'), h('dd', {}, icon('CircleCheck'), ' Fully supported', h('br'), h('small', {}, 'Indexed and queryable')),
      h('dt', {}, 'Confidence'), h('dd', { class: 'conf-dd' }, segbar(5, Math.round(confidence * 5)), h('span', {}, `${confidence >= 0.75 ? 'High' : 'Medium'} (${confidence.toFixed(2)})`))),
    sel.skills ? h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, `Skills (${sel.skills.length})`), h('div', { class: 'tags' }, sel.skills.map(s => h('span', { class: `tag ${s.phase !== 'unrouted' ? 'blue' : ''}`, title: s.description }, s.name))))
      : h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Open evidence'), h('div', { class: 'ev-list' }, KNOWLEDGE.evidence.map(([f, ago]) => h('a', { class: 'ev-row', href: '#/projects/northstar/files' }, icon('FileText'), h('span', {}, f), h('small', {}, ago), icon('ArrowUpRight'))))),
    h('div', { class: 'ins-actions' }, btn('Open in project', { tone: 'outline', ico: 'ExternalLink', href: '#/projects/northstar/overview' }),
      btn('Ask Oracle about this', { ico: 'Sparkles', onClick: () => { const i = document.getElementById('oracle-input'); i.value = `Explain how "${sel.title}" affects the Northstar plan.`; i.focus(); } })),
  ], { label: 'Knowledge item' });

  const head = h('div', { class: 'view-knowledge-head' },
    pageHead({ eyebrow: 'Project', title: collection === 'project' ? 'Northstar' : 'Convenium.Design library', sub: 'Knowledge graph  //  Connect ideas, people, artifacts' }),
    h('div', { class: 'kn-toolbar' },
      h('label', { class: 'kn-search' }, icon('Search'), h('input', { type: 'search', placeholder: 'Search knowledge (topics, artifacts, people...)', value: query, 'aria-label': 'Search knowledge', onkeydown: e => { if (e.key === 'Enter') { query = e.target.value; rr(); } }, onchange: e => { query = e.target.value; rr(); } }), h('kbd', {}, '/')),
      h('span', { class: 'kn-sep' }),
      h('label', { class: 'kn-coll' }, h('span', {}, 'Collections:'), h('select', { class: 'select', 'aria-label': 'Collection', onchange: e => { collection = e.target.value; selected = null; rr(); } },
        h('option', { value: 'project', selected: collection === 'project' ? true : null }, 'Northstar project'), h('option', { value: 'library', selected: collection === 'library' ? true : null }, `Skill library (${skills().length})`))),
      h('div', { class: 'seg kn-seg' }, h('a', { class: listMode ? '' : 'on', href: '#/knowledge', role: 'button' }, 'Connections'), h('a', { class: listMode ? 'on' : '', href: '#/knowledge/list', role: 'button' }, 'List')),
      btn('Add Knowledge', { tone: 'blue', ico: 'Plus', onClick: () => toast('Add knowledge from the skill library in Agents, or attach files in a project chat.', 'green', icon('Info')) }),
      inspectorToggle('Item')),
    collection === 'project' ? h('p', { class: 'kn-flag' }, demoFlag('Northstar example graph')) : null);
  const main = h('div', { class: 'view-knowledge' }, canvas);
  return { head, main, inspector: side, inspectorWidth: '26rem', cleanup: () => graphRef?.destroy?.() };
}
