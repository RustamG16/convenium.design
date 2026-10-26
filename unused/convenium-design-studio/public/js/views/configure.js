// Screen 05 — Configure your agent team. Edits stay in a draft until "Save to plan".
import { h, confirmModal, toast } from '../dom.js';
import { icon, AGENT_ICONS } from '../icons.js';
import { btn, banner, tag, inspector, inspectorToggle } from '../ui.js';
import { store, agentRoster, agentSkills, skillName, slots } from '../store.js';
import { setDockSelection } from '../shell.js';
import { planHeader } from './plan.js';
import { AGENT_COPY } from '../fixtures/northstar.js';
import { ensureDraft, updateDraft, draftChanges, pushDraft, applyDraft, resetDraft } from '../config-draft.js';

let selected = 'design-engineer';
const rr = () => import('../main.js').then(m => m.rerender());
const OPTIONAL = new Set(['asset-producer', 'analytics-specialist']);
const BAR = { oracle: 'green', 'design-director': 'green', 'visual-analyst': 'blue', 'asset-producer': 'blue', 'design-engineer': 'green', 'independent-critic': 'grey', 'analytics-specialist': 'grey' };

export async function testInPlayground() {
  try { await pushDraft(); location.hash = '#/playground'; }
  catch (e) { toast(`Could not prepare the draft: ${e.message}`, 'coral', icon('TriangleAlert')); }
}

export async function saveToPlan() {
  const changes = draftChanges();
  const ok = await confirmModal({ title: 'Save configuration to the plan?', body: changes.length ? `${changes.length} change(s) will become the active production configuration: ${changes.map(c => c.kind === 'slot' ? `${c.id} → ${skillName(c.to)}` : `${c.id} ${c.key} → ${c.to}`).join('; ')}.` : 'No changes from the current configuration. The plan will record this configuration as confirmed.', confirm: 'Save to plan' });
  if (!ok) return;
  try { await applyDraft(); toast('Configuration saved to the plan.', 'green', icon('CircleCheck')); }
  catch (e) { toast(`Could not apply: ${e.message}`, 'coral', icon('TriangleAlert')); }
}

export function renderConfigure() {
  const draft = ensureDraft();
  const roster = agentRoster();
  const changes = draftChanges();
  const changedAgents = new Set(changes.map(c => c.kind === 'slot' ? c.owner : c.id));

  const table = h('div', { class: 'cfg-table', role: 'table', 'aria-label': 'Agent team', 'data-tour': 'cfg-table' },
    h('div', { class: 'cfg-row head', role: 'row' }, ['#', 'Agent', 'Responsibility', 'Activation', 'Skills / tools / model', 'Effect', 'Permissions', ''].map(t => h('span', { role: 'columnheader' }, t))),
    roster.map((a, i) => {
      const copy = AGENT_COPY[a.id] || {};
      const isSel = a.id === selected;
      const skillIds = a.id === 'oracle' ? [] : agentSkills(a.id, draft.slots);
      const disabled = a.id !== 'oracle' && draft.roles?.[a.id]?.enabled === false;
      return h('div', { class: `cfg-row bar-${BAR[a.id]}${isSel ? ' sel' : ''}${disabled ? ' off' : ''}`, role: 'row', dataset: { agent: a.id }, onclick: () => { selected = a.id; setDockSelection({ ico: AGENT_ICONS[a.id], label: a.name }); rr(); } },
        h('span', { class: `cfg-n ${BAR[a.id]}` }, String(i + 1).padStart(2, '0')),
        h('span', { class: 'cfg-agent' }, icon(AGENT_ICONS[a.id] || 'User'), h('b', {}, a.name), changedAgents.has(a.id) ? h('span', { class: 'badge amber' }, 'Draft') : null),
        h('span', { class: 'cfg-txt' }, copy.responsibility || a.responsibility),
        h('span', { class: 'cfg-txt' }, copy.activation || a.activation),
        h('span', { class: 'cfg-chips' }, (skillIds.length ? skillIds.slice(0, 2).map(skillName) : copy.tools || []).map(t => tag(t)), skillIds.length > 2 ? tag(`+${skillIds.length - 2}`) : null, tag(copy.model || 'Claude 4')),
        h('span', { class: 'cfg-txt' }, copy.effect || '—'),
        h('span', { class: 'cfg-txt' }, copy.permissions || (a.readOnly ? 'Read-only' : 'Read/write')),
        h('span', {}, h('button', { type: 'button', class: `btn xs ${isSel ? '' : 'outline'}`, onclick: e => { e.stopPropagation(); selected = a.id; document.body.classList.add('inspector-shown'); rr(); } }, 'Edit')));
    }));

  const agent = roster.find(a => a.id === selected) || roster[0];
  const copy = AGENT_COPY[agent.id] || {};
  const role = draft.roles?.[agent.id] || {};
  const owned = slots().filter(sl => sl.owner === agent.id);
  const isOracle = agent.id === 'oracle';

  const slotEditors = owned.map(sl => h('label', { class: 'field slot-field' },
    h('span', { class: 'slot-q' }, h('b', {}, sl.name), ` — ${sl.question}`),
    h('select', { class: 'select', dataset: { slot: sl.id }, onchange: e => { updateDraft(d => { d.slots[sl.id] = e.target.value; }); } },
      sl.candidates.map(c => h('option', { value: c.skill, selected: (draft.slots[sl.id] || sl.default) === c.skill ? true : null }, skillName(c.skill)))),
    h('small', { class: 'mono-sm' }, sl.candidates.find(c => c.skill === (draft.slots[sl.id] || sl.default))?.changes || '')));

  const side = inspector([
    h('div', { class: 'ins-head-row' }, h('span', { class: 'label strong-label' }, 'Agent configuration')),
    h('div', { class: 'ins-title' }, h('span', { class: 'ico-plain big' }, icon(AGENT_ICONS[agent.id] || 'User')),
      h('div', {}, h('h2', {}, agent.name, ' ', h('span', { class: `badge ${role.enabled === false ? 'grey' : 'green'}` }, role.enabled === false ? 'Off' : 'Active')), h('p', {}, copy.responsibility || agent.responsibility))),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Overview'), h('p', { class: 'mono-sm ov-text' }, agent.responsibility || copy.effect)),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Activation condition'),
      h('div', { class: 'select static' }, `${copy.activation || agent.activation}${isOracle ? '' : ' (default)'}`),
      h('small', { class: 'mono-sm' }, isOracle ? 'Oracle is the front door: it runs whenever a project is created or updated.' : `Phase: ${agent.phase || agent.activation}. Activation is fixed by the locked workflow; only the skills and guardrails below are configurable.`)),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Model'), h('div', { class: 'select static' }, `${copy.model || 'Claude 4'} (Recommended)`), h('small', { class: 'mono-sm' }, 'Per-role model choice happens at the final implementation gate.')),
    h('div', { class: 'ins-sec', 'data-tour': 'cfg-skills' }, h('span', { class: 'label' }, 'Skills & tools'),
      owned.length ? slotEditors : h('p', { class: 'mono-sm' }, isOracle ? 'Oracle routes requests; it carries no swappable slot.' : 'This agent owns no loadout slot. Its base skills:'),
      h('div', { class: 'tags' }, (isOracle ? ['olympus-design-director'] : agentSkills(agent.id, draft.slots)).map(id => tag(skillName(id))), h('a', { class: 'link', href: '#/agents/' + agent.id }, icon('Plus'), 'All skills'))),
    isOracle ? null : h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Guardrails'),
      h('label', { class: 'field' }, h('span', { class: 'mono-sm' }, 'Token budget for this role'),
        h('input', { class: 'input', type: 'number', min: 500, max: 50000, step: 500, value: role.budget ?? agent.budget ?? 4000, dataset: { field: 'budget' }, onchange: e => updateDraft(d => { d.roles[agent.id] = { ...d.roles[agent.id], budget: Math.min(50000, Math.max(500, Number(e.target.value) || 4000)) }; }) })),
      h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: role.approval ? true : null, dataset: { field: 'approval' }, onchange: e => updateDraft(d => { d.roles[agent.id] = { ...d.roles[agent.id], approval: e.target.checked }; }) }), 'Pause for my approval before acting'),
      h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: role.enabled !== false ? true : null, disabled: OPTIONAL.has(agent.id) ? null : true, dataset: { field: 'enabled' }, onchange: e => updateDraft(d => { d.roles[agent.id] = { ...d.roles[agent.id], enabled: e.target.checked }; }) }), OPTIONAL.has(agent.id) ? 'Agent enabled for this project' : 'Required role (cannot be disabled)')),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, 'Permissions'),
      ['Read project files', agent.readOnly ? null : 'Write to project repository', 'Access integrations (APIs, services)', 'Deploy to staging (optional)', 'Deploy to production (requires approval)'].filter(Boolean).map((p, i) =>
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: i < (agent.readOnly ? 1 : 3) ? true : null, disabled: true }), p))),
    h('div', { class: 'notice green effect' }, icon('CircleCheck'), h('div', {}, h('span', { class: 'label' }, 'Expected effect'),
      h('ul', { class: 'checks' }, [copy.effect, ...owned.map(sl => sl.candidates.find(c => c.skill === (draft.slots[sl.id] || sl.default))?.changes)].filter(Boolean).slice(0, 4).map(t => h('li', {}, h('span', { class: 'check-ico done' }, icon('Check')), t))))),
  ], { label: `${agent.name} configuration` });

  const main = h('div', { class: 'view-configure' },
    h('div', { class: 'plan-title-row' },
      h('div', {}, h('p', { class: 'eyebrow' }, '// Agent team'), h('h2', { class: 'display' }, 'Configure your agent team'), h('p', { class: 'subline' }, 'Define responsibilities, activation, tools and guardrails for each agent.')),
      h('div', { class: 'plan-meta' }, inspectorToggle('Agent configuration'), changes.length ? h('button', { class: 'link', type: 'button', onclick: () => { resetDraft(); toast('Draft reset to the active configuration.', 'green', icon('RotateCcw')); } }, icon('RotateCcw'), `Reset ${changes.length} change(s)`) : h('span', {}, 'No draft changes'))),
    table);
  return { head: h('div', { class: 'view-plan-head' }, planHeaderConfigure(changes)), main, inspector: side, inspectorWidth: '22.5rem' };
}

function planHeaderConfigure(changes) {
  const [head, tabsRow] = planHeader('agents');
  const status = banner('amber', 'Draft — production unchanged', changes.length ? `${changes.length} draft change(s). Test freely; nothing is live until you save.` : 'You can configure and test freely. No changes are live.');
  const actions = h('div', { class: 'head-actions' },
    btn('Test in Playground', { tone: 'outline', ico: 'Play', onClick: testInPlayground, attrs: { 'data-tour': 'cfg-test' } }),
    btn('Save to plan', { tone: 'green', ico: 'Save', onClick: saveToPlan, attrs: { 'data-tour': 'cfg-save' } }));
  const oldStatus = head.querySelector('.banner'); oldStatus?.replaceWith(status);
  head.querySelector('.head-actions')?.replaceWith(actions);
  head.querySelector('.subline').textContent = 'AI agents for real operations  //  Oracle → Plan → Configure';
  return [head, tabsRow];
}
