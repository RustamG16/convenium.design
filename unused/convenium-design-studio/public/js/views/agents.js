// Agents — "one brain": radial map (light, Bennett slide 01) and neural tree (dark, Operator)
// of agents → skills, plus a profile inspector that edits the configuration draft.
import { h, titleCase } from '../dom.js';
import { icon, AGENT_ICONS } from '../icons.js';
import { pageHead, btn, badge, tag, inspector, inspectorToggle } from '../ui.js';
import { store, agentRoster, agentSkills, skillName, skills, slots } from '../store.js';
import { setDockSelection } from '../shell.js';
import { createGraph, ring, neuralNode, graphList } from '../graph.js';
import { AGENT_COPY } from '../fixtures/northstar.js';
import { ensureDraft, updateDraft, draftChanges } from '../config-draft.js';
import { testInPlayground, saveToPlan } from './configure.js';

const rr = () => import('../main.js').then(m => m.rerender());
let modeView = 'radial';
let graphRef = null;
const W = 1000, H = 640;
const TONE = { oracle: 'green', 'design-director': 'green', 'visual-analyst': 'pink', 'asset-producer': 'pink', 'design-engineer': 'blue', 'independent-critic': 'purple', 'analytics-specialist': 'grey' };
const PHASE_TONE = { always: 'coral', diagnose: 'blue', direct: 'green', prepare: 'pink', build: 'amber', verify: 'purple', unrouted: 'grey' };

function radialModel(selected, draft) {
  const cx = W / 2, cy = H / 2;
  const roster = agentRoster();
  const nodes = [], edges = [];
  nodes.push({ id: 'core', x: cx, y: cy, w: 1, h: 1, selectable: false, el: h('span', { class: 'core-anchor' }) });
  const agents = ring(roster, cx, cy, 160);
  const sector = (Math.PI * 2) / roster.length;
  const placed = new Set();
  agents.forEach(a => {
    const isSel = a.id === selected;
    nodes.push({ id: a.id, x: a.cx, y: a.cy, w: 1, h: 1, el: neuralNode({ ico: AGENT_ICONS[a.id], label: a.name, tone: TONE[a.id], size: isSel ? 46 : 38, dim: a.enabled === false }) });
    edges.push({ from: 'core', to: a.id, tone: isSel ? 'green' : 'grey', arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', width: isSel ? 2 : 1.2 });
    const sk = a.id === 'oracle' ? ['olympus-design-director', 'convenium-design-taste-interview', 'convenium-design-style-picker'] : agentSkills(a.id, draft.slots);
    sk.forEach((sid, j) => {
      const ang = a.angle + (sk.length === 1 ? 0 : (j / (sk.length - 1) - 0.5) * sector * 0.8);
      const rad = 262 + (j % 2) * 34;
      const s = skills().find(x => x.id === sid);
      const id = `${a.id}::${sid}`; placed.add(sid);
      const n = neuralNode({ ico: s?.defaultOn ? 'Star' : 'Zap', label: s?.name || sid, tone: PHASE_TONE[s?.phase] || 'amber', size: 20, caption: isSel, title: `${s?.name || sid} — ${s?.description || ''}` });
      nodes.push({ id, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, w: 1, h: 1, el: n, skill: sid });
      edges.push({ from: a.id, to: id, tone: isSel ? 'green' : 'grey', dotted: true, arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', opacity: isSel ? 1 : .5 });
    });
  });
  // Dormant (unrouted) skills, collapsed into category clusters on the outer ring.
  const dormant = {};
  for (const s of skills()) if (!placed.has(s.id) && s.phase === 'unrouted') (dormant[s.category || s.group] ||= []).push(s);
  ring(Object.entries(dormant).map(([cat, list]) => ({ cat, list })), cx, cy, 308, -Math.PI / 2 + 0.2).forEach((c, i) => {
    const label = String(c.cat).replace(/^\d+-/, '').replace(/-/g, ' ');
    nodes.push({ id: `cluster-${i}`, x: c.cx, y: c.cy, w: 1, h: 1, el: h('button', { type: 'button', class: 'cluster', title: `${titleCase(label)} — ${c.list.length} dormant skills: ${c.list.map(x => x.name).join(', ')}` }, String(c.list.length)), cluster: c });
  });
  return { nodes, edges, background: h('div', { class: 'core-orb', style: { left: `${cx}px`, top: `${cy}px`, width: '170px', height: '170px' } }, h('img', { src: '/media/apollo/neural-core.webp', alt: '' })) };
}

function neuralModel(selected, draft) {
  const cx = W / 2, coreY = 540;
  const agent = agentRoster().find(a => a.id === selected);
  const nodes = [], edges = [];
  nodes.push({ id: 'core', x: cx, y: coreY, w: 1, h: 1, selectable: false, el: h('span', { class: 'core-anchor' }) });
  nodes.push({ id: 'agent', x: cx, y: coreY - 120, w: 1, h: 1, el: neuralNode({ ico: AGENT_ICONS[selected], label: agent?.name || selected, tone: 'green', size: 46 }) });
  edges.push({ from: 'agent', to: 'core', tone: 'white', dotted: true, arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center' });
  const sk = selected === 'oracle' ? ['olympus-design-director', 'convenium-design-taste-interview', 'convenium-design-style-picker'] : agentSkills(selected, draft.slots);
  const owned = slots().filter(sl => sl.owner === selected);
  const span = Math.min(860, sk.length * 120);
  sk.forEach((sid, j) => {
    const x = cx + (sk.length === 1 ? 0 : (j / (sk.length - 1) - 0.5) * span);
    const s = skills().find(z => z.id === sid);
    nodes.push({ id: `sk-${j}`, x, y: 300 + (j % 2) * 26, w: 1, h: 1, el: neuralNode({ ico: s?.defaultOn ? 'Star' : 'Zap', label: s?.name || sid, tone: PHASE_TONE[s?.phase] === 'grey' ? 'amber' : PHASE_TONE[s?.phase] || 'amber', size: 28, title: s?.description }), skill: sid });
    edges.push({ from: 'agent', to: `sk-${j}`, tone: 'white', arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', width: 1.2, opacity: .8 });
    const slot = owned.find(sl => (draft.slots[sl.id] || sl.default) === sid);
    if (slot) {
      const alts = slot.candidates.filter(c => c.skill !== sid);
      alts.forEach((c, k) => {
        const ax = x + (alts.length === 1 ? 0 : (k / (alts.length - 1) - 0.5) * Math.min(220, alts.length * 70));
        const id = `alt-${j}-${k}`;
        nodes.push({ id, x: ax, y: 110 + (k % 2) * 28, w: 1, h: 1, el: neuralNode({ ico: 'Repeat', label: skillName(c.skill), tone: 'grey', size: 20, title: `Swap ${slot.name} to ${skillName(c.skill)}: ${c.changes}` }), swap: { slot: slot.id, skill: c.skill } });
        edges.push({ from: `sk-${j}`, to: id, tone: 'grey', dashed: true, arrow: false, curve: 'straight', fromSide: 'center', toSide: 'center', width: 1 });
      });
    }
  });
  return { nodes, edges, background: h('div', { class: 'core-orb', style: { left: `${cx}px`, top: `${coreY}px`, width: '130px', height: '130px' } }, h('img', { src: '/media/apollo/neural-core.webp', alt: '' })) };
}

export function renderAgents(route) {
  const roster = agentRoster();
  const draft = ensureDraft();
  const selected = roster.some(a => a.id === route.params.agent) ? route.params.agent : 'design-engineer';
  const agent = roster.find(a => a.id === selected);
  const changes = draftChanges();
  const mobile = window.matchMedia('(max-width: 819px)').matches;
  graphRef?.destroy?.();

  const model = modeView === 'radial' ? radialModel(selected, draft) : neuralModel(selected, draft);
  const onSelect = id => {
    const n = model.nodes.find(x => x.id === id);
    if (roster.some(a => a.id === id)) { location.hash = `#/agents/${id}`; return; }
    if (n?.swap) { updateDraft(d => { d.slots[n.swap.slot] = n.swap.skill; }); setDockSelection({ ico: 'Repeat', label: skillName(n.swap.skill) }); return; }
    if (n?.skill) { setDockSelection({ ico: 'Zap', label: skillName(n.skill) }); }
  };
  let canvas;
  if (mobile) {
    canvas = graphList(roster.map(a => ({ id: a.id, cells: [h('span', {}, icon(AGENT_ICONS[a.id]), a.name), a.phase || a.activation, `${a.id === 'oracle' ? 3 : agentSkills(a.id, draft.slots).length} skills`, a.enabled === false ? 'Off' : 'Active'] })), id => { location.hash = `#/agents/${id}`; }, ['Agent', 'Phase', 'Skills', 'Status']);
  } else {
    const g = createGraph({ id: 'brain', width: W, height: H, nodes: model.nodes, edges: model.edges, background: model.background, onSelect });
    graphRef = g;
    canvas = h('div', { class: `gcanvas brain-canvas${modeView === 'radial' ? ' light' : ''}`, 'data-tour': 'agents-brain' },
      h('div', { class: 'gcanvas-head' }, h('div', { class: 'gcanvas-title' }, modeView === 'radial' ? '// Convenium.Design brain  ·  radial' : `// Neural  ·  ${agent.name}`,
        h('small', {}, modeView === 'radial' ? 'Core → agents → the skills each carries. Grey counts are dormant skills by category.' : 'Equipped skills, and the slot alternatives you can swap in (dashed). Click an alternative to put it in your draft.')),
        h('div', { class: 'legend' }, Object.entries({ Always: 'var(--node-coral)', Diagnose: 'var(--node-blue)', Direct: 'var(--node-green)', Prepare: 'var(--node-pink)', Build: 'var(--node-amber)', Verify: 'var(--node-purple)' }).map(([k, c]) => h('span', {}, h('i', { style: { background: c } }), k)))),
      g.root);
  }

  const rosterCards = h('div', { class: 'roster', 'data-tour': 'agents-roster' }, roster.map(a => {
    const n = a.id === 'oracle' ? 3 : agentSkills(a.id, draft.slots).length;
    return h('a', { class: `card roster-card${a.id === selected ? ' sel' : ''}`, href: `#/agents/${a.id}` },
      h('span', { class: `roster-ico t-${TONE[a.id]}` }, icon(AGENT_ICONS[a.id])),
      h('strong', {}, a.name), h('span', { class: 'mono-sm' }, AGENT_COPY[a.id]?.responsibility || a.responsibility),
      h('div', { class: 'roster-meta' }, badge(a.frontDoor ? 'Front door' : titleCase(a.phase || a.activation), a.frontDoor ? 'green' : 'grey'), h('span', { class: 'mono-sm' }, `${n} skills`), a.budget ? h('span', { class: 'mono-sm' }, `${(draft.roles?.[a.id]?.budget ?? a.budget).toLocaleString()} tk`) : null));
  }));

  const owned = slots().filter(sl => sl.owner === selected);
  const role = draft.roles?.[selected] || {};
  const copy = AGENT_COPY[selected] || {};
  const side = inspector([
    h('div', { class: 'ins-title' }, h('span', { class: `ico-tile t-${TONE[selected]}` }, icon(AGENT_ICONS[selected])),
      h('div', {}, h('h2', {}, agent.name), h('p', {}, copy.responsibility || agent.responsibility))),
    h('div', { class: 'tags ins-badges' }, badge(agent.frontDoor ? 'Front door' : agent.readOnly ? 'Read-only' : 'Writes files', agent.readOnly ? 'blue' : 'green'), badge(role.enabled === false ? 'Off for this project' : 'Active', role.enabled === false ? 'grey' : 'green'), changes.some(c => (c.kind === 'slot' ? c.owner : c.id) === selected) ? badge('Draft changes', 'amber') : null),
    h('dl', { class: 'kv kv-up' }, h('dt', {}, 'Activation'), h('dd', {}, copy.activation || agent.activation), h('dt', {}, 'Phase'), h('dd', {}, titleCase(agent.phase || 'always')), h('dt', {}, 'Delegates'), h('dd', {}, agent.canDelegate ? 'Yes' : 'No — one specialist at a time')),
    h('div', { class: 'ins-sec', 'data-tour': 'agent-slots' }, h('span', { class: 'label' }, owned.length ? 'Equipped slots (swap skills)' : 'Skills'),
      owned.length ? owned.map(sl => h('label', { class: 'field slot-field' }, h('span', { class: 'slot-q' }, h('b', {}, sl.name), ` — ${sl.question}`),
        h('select', { class: 'select', onchange: e => updateDraft(d => { d.slots[sl.id] = e.target.value; }) }, sl.candidates.map(c => h('option', { value: c.skill, selected: (draft.slots[sl.id] || sl.default) === c.skill ? true : null }, skillName(c.skill)))),
        h('small', { class: 'mono-sm' }, sl.why))) : null,
      h('div', { class: 'tags' }, (selected === 'oracle' ? ['olympus-design-director', 'convenium-design-taste-interview', 'convenium-design-style-picker'] : agentSkills(selected, draft.slots)).map(id => tag(skillName(id), '', icon('Zap'))))),
    agent.frontDoor ? h('p', { class: 'mono-sm' }, 'Oracle is the persistent assistant at the bottom of every screen. It routes requests to the Design Director and never approves, publishes or spends on its own.')
      : h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Guardrails'),
        h('label', { class: 'field' }, h('span', { class: 'mono-sm' }, 'Token budget'), h('input', { class: 'input', type: 'number', min: 500, max: 50000, step: 500, value: role.budget ?? agent.budget ?? 4000, onchange: e => updateDraft(d => { d.roles[selected] = { ...d.roles[selected], budget: Math.min(50000, Math.max(500, Number(e.target.value) || 4000)) }; }) })),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: role.approval ? true : null, onchange: e => updateDraft(d => { d.roles[selected] = { ...d.roles[selected], approval: e.target.checked }; }) }), 'Pause for my approval before acting')),
    h('div', { class: 'ins-actions two' }, btn('Test in Playground', { tone: 'outline', ico: 'Play', onClick: testInPlayground }), btn('Save to plan', { tone: 'green', ico: 'Save', onClick: saveToPlan })),
    h('p', { class: 'mono-sm' }, changes.length ? `${changes.length} draft change(s) — production unchanged until you save.` : 'Edits go to a draft. Production changes only when you save.'),
  ], { label: `${agent.name} profile` });

  const head = h('div', { class: 'view-agents-head' },
    pageHead({ eyebrow: '// Agent team', title: 'Your agents, one brain.', sub: 'See how every agent, skill and phase connects.', actions: [
      h('div', { class: 'seg light' }, h('button', { type: 'button', class: modeView === 'radial' ? 'on' : '', onclick: () => { modeView = 'radial'; rr(); } }, icon('Orbit'), 'Radial'), h('button', { type: 'button', class: modeView === 'neural' ? 'on' : '', onclick: () => { modeView = 'neural'; rr(); } }, icon('Network'), 'Neural')),
      btn('Configure team', { tone: 'outline', ico: 'SlidersHorizontal', href: '#/plan/configure' }), inspectorToggle('Profile')] }));
  const main = h('div', { class: 'view-agents' }, canvas, rosterCards);
  return { head, main, inspector: side, inspectorWidth: '24rem', cleanup: () => graphRef?.destroy?.() };
}
