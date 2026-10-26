// Screen 04 — Master plan. Five display stages over the real 12-phase workflow.
import { h, confirmModal, toast, titleCase } from '../dom.js';
import { icon, AGENT_ICONS, toolMark } from '../icons.js';
import { projectHead, tabs, btn, banner, tag, checks, inspector, notice, inspectorToggle, demoFlag, kv } from '../ui.js';
import { store, saveSession, stageStates, phases, workflow, agentSkills, skillName, activeLoadout } from '../store.js';
import { setDockSelection } from '../shell.js';
import { STAGES } from '../fixtures/northstar.js';

let selected = null;
const rr = () => import('../main.js').then(m => m.rerender());

const STATUS = {
  completed: ['Completed', 'green'], approved: ['Approved', 'green'], ready: ['Plan ready', 'amber'], active: ['In progress', 'blue'],
  running: ['Running', 'blue'], pending: ['Pending', 'grey'], locked: ['Locked', 'grey'],
};
const STAGE_TOOLS = { discover: ['Claude Code', 'Notion'], direction: ['Claude Code', 'Notion', 'Figma MCP'], 'build-plan': ['Claude Code', 'Notion', 'GitHub', 'Slack'], configure: ['Claude Code', 'GitHub'], implement: ['Claude Code', 'GitHub', 'Vercel', 'Playwright'] };

export function planHeader(activeTab) {
  const s = store.session;
  const status = s.planApproved ? banner('green', 'Plan approved', 'Configure your agent team, then test it in Playground')
    : s.briefApproved ? banner('green', 'Plan ready — review required', `Generated from Oracle intake · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`)
    : banner('amber', 'Plan draft — brief not approved', 'Approve the brief to generate a reviewable plan.');
  const review = s.planApproved ? btn('Configure team', { href: '#/plan/configure', icoRight: 'ArrowRight' })
    : btn('Review plan', { icoRight: 'ArrowRight', attrs: { 'data-tour': 'plan-review', disabled: s.briefApproved ? null : true }, onClick: async () => {
      const ok = await confirmModal({ title: 'Approve the master plan?', body: 'Approving unlocks the Configure stage. Gate B (build) still requires a tested configuration and your explicit approval before anything is implemented.', confirm: 'Approve plan', tone: 'dark' });
      if (!ok) return; saveSession({ planApproved: true }); toast('Plan approved — Configure is unlocked.', 'green', icon('CircleCheck'));
    } });
  return [
    projectHead({ sub: 'AI agents for real operations  //  Oracle → Plan', status, actions: [btn('Share', { tone: 'outline', ico: 'Share2', onClick: () => { navigator.clipboard?.writeText(location.href); toast('Link copied.', 'green', icon('Link')); } }), review] }),
    h('div', { class: 'plan-tabs-row' }, tabs([['plan', 'Plan', '#/plan'], ['agents', 'Agents', '#/plan/configure'], ['resources', 'Resources', '#/plan/resources'], ['risks', 'Risks', '#/plan/risks'], ['settings', 'Settings', '#/plan/settings']], activeTab),
      h('div', { class: 'plan-ver' }, h('span', {}, 'v1.0'), h('i'), icon('Ellipsis'))),
  ];
}

function stageOwners(stage) {
  const ph = phases().filter(p => stage.phases.includes(p.id));
  const owners = [...new Set(ph.map(p => p.owner))];
  return { ph, owners };
}

export function renderPlan(route) {
  const tab = route.params.tab;
  if (tab !== 'plan') return renderPlanTab(tab);
  const states = stageStates();
  if (!selected) selected = (states.find(s => ['ready', 'active', 'running'].includes(s.status)) || states[0]).id;
  const sel = states.find(s => s.id === selected) || states[0];

  const stepper = h('ol', { class: 'stepper', 'data-tour': 'plan-stages' }, states.map((s, i) => {
    const [stText, tone] = STATUS[s.status];
    const isSel = s.id === sel.id;
    const marker = s.status === 'locked' ? h('span', { class: 'st-mark locked' }, icon('Lock'))
      : ['completed', 'approved'].includes(s.status) ? h('span', { class: 'st-mark done' }, icon('Check'))
      : ['ready'].includes(s.status) ? h('span', { class: 'st-mark ready' }, h('i'))
      : ['active', 'running'].includes(s.status) ? h('span', { class: 'st-mark active' }, h('i'))
      : h('span', { class: 'st-mark' });
    const doneChecks = ['completed', 'approved'].includes(s.status) ? 3 : s.status === 'ready' ? 2 : s.status === 'active' ? 1 : 0;
    return h('li', { class: `st-item ${s.status}` },
      h('span', { class: `st-n ${tone}` }, s.n), marker, i < states.length - 1 ? h('i', { class: `st-line ${['completed', 'approved'].includes(s.status) ? 'done' : ''}` }) : null,
      h('button', { type: 'button', class: `st-card ${tone}${isSel ? ' sel' : ''}`, dataset: { stage: s.id }, 'aria-pressed': isSel ? 'true' : 'false', onclick: () => { selected = s.id; setDockSelection({ ico: s.icon, label: s.title }); rr(); } },
        h('span', { class: 'ico-box' }, icon(s.icon)),
        h('div', { class: 'st-copy' }, h('strong', { class: 'title-sm' }, s.title), h('span', {}, s.text)),
        h('div', { class: 'st-status' }, h('span', { class: `status-text ${tone}` }, stText), h('span', { class: 'mono-sm' }, s.duration)),
        h('div', { class: 'st-checks' }, checks(s.checks.map((c, ci) => [c, ci < doneChecks])))));
  }));

  const { ph, owners } = stageOwners(sel);
  const ownerId = owners[owners.length - 1] || 'design-director';
  const owner = (store.data.agents || []).find(a => a.id === ownerId);
  const skills = owners.length ? [...new Set(owners.flatMap(o => agentSkills(o)))] : Object.values(activeLoadout()?.slots || {});
  const wf = workflow();
  const art = id => wf?.artifacts?.find(a => a.id === id)?.path || id;
  const inputs = [...new Set(ph.flatMap(p => p.inputs))];
  const outputs = [...new Set(ph.flatMap(p => p.outputs))];
  const gate = sel.gate ? wf?.gates?.find(g => g.id === sel.gate) : null;
  const [stText, tone] = STATUS[sel.status];
  const side = inspector([
    h('div', { class: 'ins-stage', 'data-tour': 'plan-inspector' },
      h('span', { class: 'label strong-label' }, `Stage ${sel.n}`),
      h('h2', { class: 'ins-stage-title' }, h('i', { class: `dot ${tone}` }), sel.title),
      h('span', { class: `status-text ${tone}` }, sel.status === 'ready' ? 'Plan ready — review required' : stText),
      h('p', { class: 'mono-sm' }, sel.text)),
    h('div', { class: 'ins-sec ins-agent-sec' }, h('span', { class: 'label' }, 'Assigned agent'),
      h('div', { class: 'ins-agent' }, h('span', { class: 'agent-ava' }, icon(AGENT_ICONS[ownerId] || 'User')), h('div', {}, h('b', {}, owner?.name || titleCase(ownerId)), h('span', {}, owner?.responsibility || 'Strategy to execution planning specialist.')),
        btn('View agent', { tone: 'outline', size: 'sm', href: `#/agents/${ownerId}`, icoRight: 'ArrowRight' }))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Skills'), h('div', { class: 'tags' }, skills.slice(0, 8).map(id => tag(skillName(id))))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Tools'), h('div', { class: 'tool-row' }, STAGE_TOOLS[sel.id].map(t => h('span', { class: 'tool' }, toolMark(t), t)))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Inputs'), h('div', { class: 'doc-list' }, (inputs.length ? inputs : ['Oracle intake (Northstar)']).map(i => h('span', {}, icon('FileText'), art(i))))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Deliverables'), h('div', { class: 'doc-list' }, (outputs.length ? outputs : ['Loadout configuration', 'Playground comparison']).map(o => h('span', {}, icon('FileText'), art(o))))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Phases'), h('div', { class: 'doc-list' }, (ph.length ? ph : [{ id: 'loadout slots', owner: 'you' }]).map(p => h('span', {}, icon('GitCommitHorizontal'), `${p.id} · ${titleCase(p.owner)}`)))),
    h('div', { class: 'ins-sec ins-grid' }, h('span', { class: 'label' }, 'Gate'), h('div', { class: 'gate-line' }, icon('Flag'), h('div', {}, h('b', {}, gate ? `Gate ${gate.id} — ${gate.requirement}` : 'Human review and approval'), h('span', {}, `Approve to unlock the ${STAGES[Math.min(4, (sel.index ?? 0) + 1)].title} stage.`)))),
    sel.id === 'build-plan' ? h('div', { class: 'unresolved' }, h('span', { class: 'q-badge' }, '?'), h('div', {}, h('b', {}, 'Unresolved decisions ', h('span', { class: 'count-pill' }, '2')), h('span', {}, 'Tooling stack and runtime model?')), btn('Resolve', { tone: 'outline', size: 'sm', href: '#/plan/configure', icoRight: 'ArrowRight' })) : null,
    h('div', { class: 'estimates' }, h('div', {}, icon('Clock'), h('div', {}, h('span', { class: 'label' }, 'Estimated time'), h('b', {}, sel.duration))), h('div', {}, icon('DollarSign'), h('div', {}, h('span', { class: 'label' }, 'Token budget'), h('b', {}, `${(activeLoadout()?.budget?.totalTokens || 30000).toLocaleString()} tokens`)))),
    notice({ ico: 'Lightbulb', title: 'Why this setup?', tone: 'green', text: `${owner?.name || 'The Design Director'} owns ${ph.map(p => p.id).join(', ') || 'this stage'}. Skills come from the active loadout “${activeLoadout()?.name || '—'}”; change them in Configure and test the difference in Playground before it affects production.` }),
  ], { label: `Stage ${sel.title} details` });

  const main = h('div', { class: 'view-plan' },
    h('div', { class: 'plan-title-row' },
      h('div', {}, h('p', { class: 'eyebrow' }, '// Master plan'), h('h2', { class: 'display' }, 'From intake to impact.'), h('p', { class: 'subline' }, 'A clear path. Specialized agents. Real outcomes.')),
      h('div', { class: 'plan-meta' }, inspectorToggle('Stage details'), h('span', {}, `5 stages  //  ${phases().length || 12} phases  //  ~8 weeks`))),
    stepper);
  return { head: h('div', { class: 'view-plan-head' }, planHeader('plan')), main, inspector: side, inspectorWidth: '29rem' };
}

function renderPlanTab(tab) {
  let body;
  const cfg = store.data.config || {};
  if (tab === 'resources') {
    body = h('div', { class: 'res-grid' },
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Hosted tools'), h('div', { class: 'rowlist' }, (cfg.tools || []).map(t => h('div', { class: 'res-row' }, icon('Wrench'), h('div', {}, h('b', {}, t.name), h('span', {}, t.description)), h('span', { class: `badge ${t.usable ? 'green' : 'grey'}` }, t.usable ? 'Usable' : 'Unavailable'))))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Host plugins'), h('div', { class: 'rowlist' }, (cfg.plugins || []).map(p => h('div', { class: 'res-row' }, icon('Plug'), h('div', {}, h('b', {}, p.name), h('span', {}, p.description)), h('span', { class: 'badge grey' }, p.status))))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Presets'), h('div', { class: 'rowlist' }, (cfg.presets || []).map(p => h('div', { class: 'res-row' }, icon('Layers'), h('div', {}, h('b', {}, p.name), h('span', {}, p.skills.map(skillName).join(' · '))))))));
  } else if (tab === 'risks') {
    const plan = store.data.plan;
    body = h('div', { class: 'res-grid' },
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Recorded limitations'), h('ul', { class: 'risk-list' }, (plan?.limitations || ['Plan preview unavailable.']).map(l => h('li', {}, icon('TriangleAlert'), l)))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Dormant roles'), h('p', { class: 'mono-sm' }, 'These roles stay dormant until their activation conditions are met.'), h('div', { class: 'tags' }, (plan?.dormant || []).map(d => tag(d, '', icon('Moon'))))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Blocked steps'), h('div', { class: 'rowlist' }, (plan?.steps || []).filter(s => s.status === 'blocked').map(s => h('div', { class: 'res-row' }, icon('Lock'), h('div', {}, h('b', {}, `${s.name} · ${s.phase}`), h('span', {}, (s.blockedReasons || []).join(' ') || 'Waiting for gate approval.')))))));
  } else {
    const wf = workflow();
    body = h('div', { class: 'res-grid' },
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Workflow policy'), kv(Object.entries(wf?.policy || {}).map(([k, v]) => [titleCase(k.replace(/([A-Z])/g, ' $1')), String(v)]))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Gates'), h('div', { class: 'rowlist' }, (wf?.gates || []).map(g => h('div', { class: 'res-row' }, icon('Flag'), h('div', {}, h('b', {}, `Gate ${g.id}`), h('span', {}, g.requirement)), h('span', { class: 'badge green' }, g.provenance?.status || 'recorded'))))),
      h('section', { class: 'card pad' }, h('div', { class: 'card-head' }, 'Active loadout'), kv([['Name', activeLoadout()?.name || '—'], ['Budget', `${(activeLoadout()?.budget?.totalTokens || 0).toLocaleString()} tokens`], ['Slots', Object.entries(activeLoadout()?.slots || {}).map(([k, v]) => `${k}: ${skillName(v)}`).join(' · ')]])));
  }
  return { main: h('div', { class: 'view-plan' }, planHeader(tab), body, h('p', { class: 'mono-sm plan-note' }, h('span', { class: 'badge green' }, 'Live data'), ' Read from the Convenium.Design workflow, registry and loadouts.')) };
}
