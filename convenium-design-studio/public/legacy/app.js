import { selectWorkspaceState, createWorkspaceSurfaces } from './modules/workspace.js';
import { createShell } from './modules/shell.js';
import { buildOracleContext, removeOracleToken } from './modules/oracle.js';
import { mountWorkflowViews } from './modules/workflow-view.js';
import { createJourneyUI } from './modules/journey.js';
let journeyUI=null;

const state = {
  config: null,
  activeSkills: new Set(),
  variants: [],
  runs: [],
  agents: [],
  knowledge: null,
  knowledgeCategory: 'all',
  selectedSkillId: null,
  oraclePlan: null,
  oracleMessages: [],
  approvedAgents: new Set(),
  integrations: [],
  events: [],
  eventsError: null,
  systems: null,
  selectedLoadoutId: null,
  loadoutDrafts: new Map(),
  view: 'work',
  work: { projects: [], proposals: [], activeProjectId: null, activeChatId: null, detail: null }
};

const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};
const skillDefaultsVersion = 2;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const views = new Set(['work', 'architecture', 'systems', 'agents', 'knowledge', 'oracle', 'playground', 'runs']);
let comparisonTween = null;
let motionContext = null;
let oracleContext = { tokens: [], dismissed: [] };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function initMotionPreferences() {
  if (!window.gsap?.matchMedia) return;
  motionContext?.revert();
  motionContext = window.gsap.matchMedia();
  motionContext.add({
    reduceMotion: '(prefers-reduced-motion: reduce)',
    allowMotion: '(prefers-reduced-motion: no-preference)'
  }, context => {
    document.documentElement.dataset.motion = context.conditions.reduceMotion ? 'reduced' : 'full';
  });
}
function refreshIcons(root = document) {
  if (!window.lucide?.createIcons) return;
  window.lucide.createIcons({ root, attrs: { width: 16, height: 16, 'stroke-width': 1.75 } });
}
function setCommandLabel(button, label) {
  const target = button.querySelector('span');
  if (target) target.textContent = label;
  else button.textContent = label;
}
// The four-step strip was static markup: "1 - Task" stayed current through a completed run.
// A progress indicator that does not track progress is worse than none, so it now reads the
// real state.
function renderPlaygroundSteps(mode) {
  const host = $('#playground-steps');
  if (!host) return;
  const hasPrompt = ($('#experiment-prompt')?.value || '').trim().length > 2;
  const hasResults = $('#results-grid')?.children.length > 0;
  const reached = mode === 'running' ? 'run' : hasResults ? 'result' : hasPrompt ? 'setups' : 'task';
  const order = ['task', 'setups', 'run', 'result'];
  const index = order.indexOf(reached);
  for (const item of host.children) {
    const position = order.indexOf(item.dataset.step);
    item.classList.toggle('is-current', position === index);
    item.classList.toggle('is-done', position < index);
    if (position === index) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  }
  const empty = $('#results-empty');
  if (empty) empty.hidden = hasResults;
}

function setComparisonState(mode) {
  renderPlaygroundSteps(mode);
  const bar = $('.run-bar'); const track = $('#comparison-progress'); const indicator = track?.querySelector('i');
  if (!bar || !indicator) return;
  bar.dataset.state = mode;
  comparisonTween?.kill(); comparisonTween = null;
  if (!window.gsap || reduceMotion()) { indicator.style.transform = `scaleX(${mode === 'idle' ? 0 : 1})`; return; }
  if (mode === 'idle') window.gsap.set(indicator, { scaleX: 0 });
  else if (mode === 'running') comparisonTween = window.gsap.fromTo(indicator, { scaleX: .05 }, { scaleX: .76, duration: .15, ease: 'power2.out', overwrite: 'auto' });
  else comparisonTween = window.gsap.to(indicator, { scaleX: 1, duration: .15, ease: 'power2.out', overwrite: 'auto' });
}

async function api(path, options = {}) {
  if(!navigator.onLine&&options.method&&options.method!=='GET')throw new Error('Offline. Reconnect before saving; your draft is preserved.');
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
}

const defaultNodeCopy = {
  intake: ['Evidence', 'Intake & audit', 'Collects real page, source, reference, analytics, accessibility, and responsive evidence before visual direction.'],
  director: ['Orchestrator', 'Convenium.Design Design Director', 'One manager keeps ownership while selected skills contribute bounded judgment.'],
  'gate-a': ['Gate A', 'Brief approved', 'Confirms the problem, audience, constraints, success signal, and missing assets before concepts.'],
  concepts: ['Direction', 'Concept studio', 'Produces three structurally different directions, then freezes them for independent critique.'],
  'gate-b': ['Gate B', 'Direction selected', 'Records one approved direction before media production, motion planning, or implementation.'],
  build: ['Production', 'Assets & implementation', 'Activates only approved media, motion, framework, and engineering capabilities.'],
  qa: ['Gate C', 'Visual QA & handoff', 'Verifies laptop and desktop layouts, interaction states, reduced motion, runtime health, and release evidence.']
};
const nodeCopy = storage.read('convenium-design-graph-copy', structuredClone(defaultNodeCopy));

const defaultEdges = [
  { from: 'intake', to: 'director', phase: 'diagnose' },
  { from: 'director', to: 'gate-a', phase: 'diagnose' },
  { from: 'gate-a', to: 'concepts', phase: 'direct', vertical: true },
  { from: 'concepts', to: 'gate-b', phase: 'direct', vertical: true },
  { from: 'gate-b', to: 'build', phase: 'prepare' },
  { from: 'build', to: 'qa', phase: 'verify' },
  { from: 'qa', to: 'director', phase: 'verify', feedback: true }
];
let edges = storage.read('convenium-design-graph-edges', structuredClone(defaultEdges));
const defaultGraphPositions = {
  intake: { x: 3, y: 12 }, director: { x: 28, y: 34 }, 'gate-a': { x: 52, y: 12 },
  concepts: { x: 52, y: 42 }, 'gate-b': { x: 52, y: 70 }, build: { x: 76, y: 35 }, qa: { x: 76, y: 68 }
};
let graphPositions = storage.read('convenium-design-graph-positions', structuredClone(defaultGraphPositions));
let graphPhases = storage.read('convenium-design-graph-phases', {});
let selectedNodeId = 'director';

function navigate(view, { updateHash = true } = {}) {
  return shell.navigate(view, { replace: !updateHash });
}

function renderLegacyView(view) {
  state.view = view;
  if (!views.has(view)) return;
  if (view === 'architecture') requestAnimationFrame(drawConnections);
  if (view === 'runs') renderHistory();
  if (view === 'systems') renderSystems();
  if (view === 'agents') renderAgents();
  if (view === 'knowledge') renderKnowledge();
  if (view === 'oracle') { renderOracleMessages(); renderOraclePlan(); }
  if (view === 'work') renderWork();
  refreshIcons(document.getElementById(view));
}

function workspaceModel() { return selectWorkspaceState(state.work, shell.current()?.root === 'work' ? shell.current() : {}); }
function workProject() { return workspaceModel().project; }
function workChat() { return workspaceModel().chat; }
async function refreshWork({ preserve = true } = {}) {
  const workspace = await api('/api/workspace'); const oldProject = state.work.activeProjectId; const oldChat = state.work.activeChatId;
  state.work = { ...workspace, activeProjectId: preserve ? oldProject : null, activeChatId: preserve ? oldChat : null, detail: null };
  const project = workProject(); state.work.activeProjectId = project?.id || null; const chat = workChat(project); state.work.activeChatId = chat?.id || null;
  if (chat) state.work.detail = await api(`/api/chats/${chat.id}`); renderWork();
}
async function selectWorkChat(projectId, chatId, { navigateToWork = true } = {}) {
  state.work.activeProjectId = projectId; state.work.activeChatId = chatId; state.work.detail = null;
  const detail = chatId ? await api(`/api/chats/${chatId}`) : { messages: [], attachments: [] };
  if (state.work.activeProjectId !== projectId || state.work.activeChatId !== chatId) return;
  state.work.detail = detail;
  const target = `projects/${encodeURIComponent(projectId)}/work${chatId ? '/' + encodeURIComponent(chatId) : ''}`;
  workspaceSurfaces.close(false);
  if (navigateToWork && shell.current()?.path !== target) shell.navigate(target); else renderWork();
}
function renderWork() {
  shell.refresh();
  const model = workspaceModel(); const { project, chat } = model;
  $('#work-title').textContent = project?.name || 'Choose a project';
  $('#active-chat-name').textContent = chat?.name || model.recovery || 'No conversation';
  $('#work-prompt').disabled = !chat;
  $('#work-messages').replaceChildren();
  const switcher = $('#workspace-project');
  switcher.replaceChildren(...model.projects.map(p => { const o = document.createElement('option'); o.value=p.id; o.textContent=p.name; o.selected=p.id===project?.id; return o; }));
  $('#project-tabs').replaceChildren();
  if (!project || !chat) {
    $('#work-empty').hidden = false;
    $('#work-empty strong').textContent = model.recovery || 'Choose a project.';
    $('#work-composer button[type="submit"]').disabled = true;
    $('#work-status').textContent = model.recovery || 'Choose a project.';
    return;
  }
  $('#work-composer button[type="submit"]').disabled = false;
  $('#work-empty strong').textContent = 'Nothing asked yet.';
  const list = $('#project-list'); list.replaceChildren(...state.work.projects.map(item => { const button = document.createElement('button'); button.type = 'button'; button.className = `project-item${item.id === project.id ? ' is-active' : ''}`; button.innerHTML = '<span class="project-symbol"></span><span><strong></strong><small></small></span>'; button.querySelector('strong').textContent = item.name; button.querySelector('small').textContent = `${item.chats.length} conversations`; button.addEventListener('click', () => selectWorkChat(item.id, item.chats[0]?.id)); return button; }));
  const tabs = $('#project-tabs'); tabs.replaceChildren(...project.chats.map(item => { const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(item.id === chat.id)); button.className = `project-tab${item.id === chat.id ? ' is-active' : ''}`; button.textContent = item.name; button.addEventListener('click', () => selectWorkChat(project.id, item.id)); return button; }));
<<<<<<<< HEAD:convenium-design-studio/public/legacy/app.js
  const detail = model; const messages = $('#work-messages'); messages.replaceChildren(...detail.messages.map(message => { const article = document.createElement('article'); article.className = `work-message ${message.role}`; const label = document.createElement('span'); label.textContent = message.role === 'assistant' ? 'Convenium.Design' : 'You'; const text = document.createElement('p'); text.textContent = message.text; article.append(label, text); return article; }));
========
  const detail = state.work.detail || { messages: [], attachments: [] }; const messages = $('#work-messages'); messages.replaceChildren(...detail.messages.map(message => { const article = document.createElement('article'); article.className = `work-message ${message.role}`; const label = document.createElement('span'); label.textContent = message.role === 'assistant' ? 'Convenium.Design' : 'You'; const text = document.createElement('p'); text.textContent = message.text; article.append(label, text); return article; }));
>>>>>>>> origin/main:convenium-design-studio/public/app.js
  const linkedCount = detail.attachments.filter(item => item.status === 'linked').length;
  $('#work-title').textContent = project.name; $('#work-prompt').placeholder = `Ask Convenium.Design to help with ${project.name}…`; $('#context-title').textContent = chat.name; $('#context-attachments').textContent = linkedCount ? `${linkedCount} linked path${linkedCount === 1 ? '' : 's'}` : 'No sources';
  const contextCount = $('#work-context-count');
  contextCount.textContent = linkedCount;
  contextCount.classList.toggle('is-zero', linkedCount === 0);
  const activeLoadout = state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId);
  if (activeLoadout) {
    // The loadout is stated once, in the toolbar. The inspector carries what is not stated
    // anywhere else in Work and is load-bearing for what a run will do.
    $('#work-loadout-name').textContent = activeLoadout.name;
    const profile = activeLoadout.designDna
      ? (state.designDna?.profiles || []).find(item => item.profileId === activeLoadout.designDna)
      : null;
    $('#context-dna').textContent = profile ? profile.displayName : 'None attached';
  }
  // An empty conversation is a state, not an absence. It says what this surface is for and
  // offers the one action that leaves it.
  const empty = $('#work-empty');
  if (empty) empty.hidden = detail.messages.length > 0;
  const attachmentList = $('#attachment-list'); attachmentList.replaceChildren(...detail.attachments.filter(item => item.status === 'linked').map(item => { const row = document.createElement('div'); row.className = 'attachment-row'; const label = document.createElement('span'); label.textContent = `${item.name} · ${Math.ceil(item.size / 1024) || 0} KB`; const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-action'; remove.textContent = 'Unlink'; remove.addEventListener('click', () => stageProposal({ title: 'Unlink attachment', summary: `Remove the local reference “${item.name}” from this chat. The source file will not be deleted.`, affected: [item.name], operation: { type: 'unlink-attachment', chatId: chat.id, attachmentId: item.id, name: item.name, size: item.size, fileType: item.type } })); row.append(label, remove); return row; }));
  refreshIcons($('#work'));
}
// A failed send must not eat what was typed. The draft is put back and the retry is one
// click, because the alternative is a person retyping a paragraph they already wrote.
function showWorkError(error, draft) {
  const host = $('#work-error');
  host.hidden = false;
  host.replaceChildren();
  const message = document.createElement('span');
  message.textContent = 'Could not send: ' + (error?.message || 'unknown error') + '.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'quiet-action';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => {
    $('#work-prompt').value = draft;
    host.hidden = true;
    $('#work-composer').requestSubmit();
  });
  host.append(message, retry);
  $('#work-prompt').value = draft;
  $('#work-status').textContent = 'Not sent';
}

async function sendWorkMessage(role, text, chatId = workChat()?.id) { if (!chatId) return; await api(`/api/chats/${chatId}/messages`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role, text }) }); const detail = await api(`/api/chats/${chatId}`); if(state.work.activeChatId===chatId){state.work.detail=detail;renderWork();} }
async function stageProposal(input) { const proposal = await api('/api/proposals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }); const dialog = $('#proposal-dialog'); dialog.dataset.proposalId = proposal.id; dialog.dataset.operation = JSON.stringify(input.operation || null); $('#proposal-title').textContent = proposal.title; $('#proposal-summary').textContent = proposal.summary; $('#proposal-affected').replaceChildren(...proposal.affected.map(item => { const li = document.createElement('li'); li.textContent = item; return li; })); dialog.showModal(); }
function updateOracleContext({ project, route, selection } = {}) {
  oracleContext = buildOracleContext({ project, route, selection, dismissed: oracleContext.dismissed });
  const host = $('#oracle-context-tokens');
  if (!host) return;
  host.replaceChildren(...oracleContext.tokens.map(token => {
    const item = document.createElement(token.removable ? 'button' : 'span');
    item.className = 'oracle-context-token'; item.dataset.tokenKind = token.kind;
    item.textContent = token.label;
    if (token.removable) {
      item.type = 'button'; item.setAttribute('aria-label', `Remove ${token.label} from Oracle context`);
      item.addEventListener('click', () => { oracleContext = removeOracleToken(oracleContext, token.id); updateOracleContext({ project, route, selection }); });
    }
    return item;
  }));
}
function toggleOracle(force) {
  const dock = $('#oracle-dock'); const trigger = $('#toggle-oracle');
  const open = typeof force === 'boolean' ? force : dock.getAttribute('aria-hidden') === 'true';
  if(open)document.dispatchEvent(new CustomEvent('apollo:surface-open',{detail:{owner:'oracle'}}));
  dock.setAttribute('aria-hidden', String(!open)); dock.inert = !open;
  trigger.setAttribute('aria-expanded', String(open));
  $('#oracle-context-name').textContent = state.view === 'work' ? 'Work' : state.view[0].toUpperCase() + state.view.slice(1);
  // The dock's answer belongs to the context it was opened in; carrying it to another view
  // would be showing someone the previous screen's advice.
  if (open) { workspaceSurfaces.close(false); $('#oracle-dock-answer').replaceChildren(); renderDockAvailability(); $('#oracle-show-how').focus(); }
  else trigger.focus();
}


// ---------------------------------------------------------------------------
// The Oracle dock, doing what its two buttons say.
//
// "Show me how" navigated to the Oracle view and prefilled a textarea. "Do it for me"
// navigated to the Oracle view and prefilled a different textarea. Neither showed anything
// and neither did anything, while the dock's own safety copy promised that Oracle "will never
// save, change, or connect anything without a visible proposal and your confirmation" - a
// promise about machinery that existed, was correct, and was wired to nothing but attachment
// unlink. The label-truth table caught both.
// ---------------------------------------------------------------------------

// What Oracle can actually do here. A view with no real mutation gets a disabled button and a
// reason, because a control that cannot act should not claim it can.
function dockAction() {
  const view = state.view;
  if (view === 'systems' || view === 'architecture') {
    const loadout = selectedLoadout();
    if (loadout && loadout.id !== state.loadouts?.activeLoadoutId) {
      return {
        title: 'Use this loadout for the next run',
        summary: `Make “${loadout.name}” the active loadout. The next run — in Work, in Playground or from a connected host — uses its eight decisions, its brief and its Design DNA.`,
        affected: [loadout.name, 'The active loadout for this workspace'],
        operation: { type: 'activate-loadout', loadoutId: loadout.id, name: loadout.name, previousId: state.loadouts?.activeLoadoutId || null },
      };
    }
    return { blocked: 'That loadout is already the active one, so there is nothing to change.' };
  }
  if (view === 'work') {
    const chat = workChat();
    const last = [...(state.work.detail?.messages || [])].reverse().find(message => message.role === 'user');
    if (chat && last) {
      return {
        title: 'Plan this request against the active loadout',
        summary: 'Route the last message through the locked pipeline and record the plan in this chat. Planning is local and spends no tokens; nothing is executed.',
        affected: [chat.name, 'One new assistant message in this chat'],
        operation: { type: 'plan-chat', projectId: state.work.activeProjectId, chatId: chat.id, prompt: last.text },
      };
    }
    return { blocked: 'Write a message first — there is nothing here to plan yet.' };
  }
  return { blocked: `Oracle has no change to propose in ${view}. Open Loadouts or Work and it will.` };
}

function renderDockAvailability() {
  const button = $('#oracle-do-it');
  if (!button) return;
  const action = dockAction();
  button.disabled = Boolean(action.blocked);
  button.title = action.blocked || action.title;
}

async function showMeHow() {
  const host = $('#oracle-dock-answer');
  host.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = 'The next step here';
  host.append(heading);
  try {
    // Plan-only is local and free, which is exactly why this never needed to be a textarea.
    const context = {
      work: 'Send this project a request. Convenium.Design routes it through the locked pipeline using the active loadout.',
      systems: 'Change one of the eight decisions, save, then compare it against the loadout you started from.',
      architecture: 'Select a stage to see what it carries this run. The route itself is locked.',
      playground: 'Give two loadouts the same task, run it small, then keep the winner.',
      knowledge: 'Pick a capability to read what it does and which slot it answers.',
      agents: 'Adjust an agent\u2019s budget or approval. The roster itself is fixed.',
      runs: 'Open a run to see the route it took, its gates and what each stage spent.',
      oracle: 'Describe a task. Planning is local and free; execution happens only when you ask.',
    }[state.view] || 'Pick a destination in the top bar to begin.';

    const list = document.createElement('ol');
    const first = document.createElement('li');
    first.innerHTML = '<strong></strong>';
    first.querySelector('strong').textContent = context;
    list.append(first);

    const loadout = state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId);
    if (loadout) {
      const second = document.createElement('li');
      const changed = (state.loadouts.slots || []).filter(slot => loadout.slots[slot.id] !== slot.default);
      second.textContent = `The active loadout is ${loadout.name} — ${changed.length ? changed.length + ' of 8 changed from default' : 'all eight at their default'}.`;
      list.append(second);
    }
    const action = dockAction();
    const third = document.createElement('li');
    third.textContent = action.blocked ? action.blocked : `“Do it for me” will propose: ${action.title}.`;
    list.append(third);
    host.append(list);

    const note = document.createElement('p');
    note.textContent = 'Nothing above was sent anywhere. This is read from the workspace you already have open.';
    host.append(note);
  } catch (error) {
    const note = document.createElement('p');
    note.textContent = 'Could not read the current context: ' + error.message;
    host.append(note);
  }
}

async function doItForMe() {
  const action = dockAction();
  const host = $('#oracle-dock-answer');
  if (action.blocked) {
    host.replaceChildren();
    const note = document.createElement('p');
    note.textContent = action.blocked;
    host.append(note);
    return;
  }
  // A real proposal, through the machinery that already existed: createProposal, the
  // dialog, resolveProposal. It mutates nothing until it is approved.
  try {
    await stageProposal(action);
  } catch (error) {
    host.replaceChildren();
    const note = document.createElement('p');
    note.textContent = 'Could not draft that proposal: ' + error.message;
    host.append(note);
  }
}

function skillToggle(skill) {
  const label = document.createElement('label');
  label.className = 'skill-row';
  label.dataset.id = skill.id;
  label.dataset.phase = skill.phase;
  label.dataset.search = `${skill.name} ${skill.description} ${skill.group}`.toLowerCase();
  label.innerHTML = `<span class="skill-copy"><strong></strong><small></small><span class="skill-meta"><span class="phase-tag"></span></span></span><span class="switch"><input type="checkbox"><span class="switch-track" aria-hidden="true"></span></span>`;
  label.querySelector('strong').textContent = skill.name;
  label.querySelector('small').textContent = skill.description;
  label.querySelector('.phase-tag').textContent = skill.phase;
  const input = label.querySelector('input');
  input.checked = state.activeSkills.has(skill.id);
  input.setAttribute('aria-label', `Enable ${skill.name}`);
  input.addEventListener('change', () => {
    input.checked ? state.activeSkills.add(skill.id) : state.activeSkills.delete(skill.id);
    persistSkills();
    animatePulse(label);
  });
  return label;
}

function persistSkills() {
  storage.write('convenium-design-active-skills', [...state.activeSkills]);
  storage.write('convenium-design-active-skills-version', skillDefaultsVersion);
  if ($('#active-skill-count')) $('#active-skill-count').textContent = state.activeSkills.size;
}

function renderSkillRegistry() {
  const list = $('#skill-list');
  list.replaceChildren(...state.config.skills.map(skillToggle));
  persistSkills();
}

function renderTools() {
  if ($('#available-tool-count')) $('#available-tool-count').textContent = state.config.mode === 'live' ? state.config.tools.filter(tool => tool.usable).length : 0;
  const rows = state.config.tools.map(tool => {
    const row = document.createElement('article');
    row.className = 'tool-row';
    row.innerHTML = `<div class="tool-row-head"><strong></strong><span class="tool-status"></span></div><p></p>`;
    row.querySelector('strong').textContent = tool.name;
    const status = row.querySelector('.tool-status');
    status.textContent = tool.status;
    status.classList.toggle('is-usable', tool.usable);
    row.querySelector('p').textContent = tool.description;
    return row;
  });
  $('#tool-list').replaceChildren(...rows);
}

function filterSkills() {
  const query = $('#skill-search').value.trim().toLowerCase();
  const phase = $('#skill-phase-filter').value;
  $$('.skill-row').forEach(row => row.classList.toggle('is-filtered', !(row.dataset.search.includes(query) && (phase === 'all' || row.dataset.phase === phase))));
}

// Which agent stands at each stage of the map. The graph node ids and the agent ids are
// two different vocabularies for the same pipeline, and nothing had ever joined them - the
// inspector's owner lookup was matching on display text and silently never matching.
const NODE_OWNER = {
  intake: 'athena-evidence',
  director: 'convenium-design-director',
  concepts: 'calliope-experience',
  build: 'hephaestus-build',
  qa: 'hermes-delivery'
};

const phaseLabels = { always: 'Orchestrate', plan: 'Plan', diagnose: 'Diagnose', direct: 'Direct', prepare: 'Prepare', build: 'Build', verify: 'Verify', synthesize: 'Synthesize' };
const phaseSequence = ['plan', 'diagnose', 'direct', 'prepare', 'build', 'verify', 'synthesize'];

function activeSystem() {
  return state.systems?.systems.find(system => system.id === state.systems.activeSystemId) || state.systems?.systems[0] || null;
}

// The pipeline is refreshed for display only; nothing on any screen can change it.
async function refreshSystems() {
  state.systems = await api('/api/systems');
  renderSystems();
  renderArchitectureAgents();
  renderTransport();
}

function renderArchitectureAgents() {
  const host = $('#architecture-agent-lanes');
  const system = activeSystem();
  const empty = $('#architecture-empty');
  if (!host) return;
  if (empty) empty.hidden = Boolean(system?.agents?.length);
  if (!system) { host.replaceChildren(); return; }
  $('#architecture-system-name').textContent = system.name;
  $('#architecture-system-count').textContent = `${system.agents.filter(agent => agent.enabled).length} active agents`;
  // The roster is fixed and no agent owns `prepare`, so that lane could only ever read
  // "No agent" - a permanently empty column stating an absence that is not a problem and
  // cannot be fixed. Only phases the pipeline actually uses are drawn.
  const phases = ['diagnose', 'direct', 'prepare', 'build', 'verify']
    .filter(phase => system.agents.some(agent => agent.phase === phase));
  host.replaceChildren(...phases.map(phase => {
    const lane = document.createElement('section'); lane.className = 'agent-lane'; lane.dataset.phase = phase;
    const heading = document.createElement('h3'); heading.textContent = phaseLabels[phase];
    const agents = system.agents.filter(agent => agent.phase === phase && agent.enabled);
    const list = document.createElement('div');
    if (!agents.length) { const empty = document.createElement('span'); empty.className = 'lane-empty'; empty.textContent = 'Paused'; list.append(empty); }
    agents.forEach(agent => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'architecture-agent';
      const name = document.createElement('strong'); name.textContent = agent.name;
      const meta = document.createElement('small');
      meta.textContent = [
        `${agent.skills.length} skill${agent.skills.length === 1 ? '' : 's'}`,
        agent.mcp.length ? `${agent.mcp.length} MCP` : null,
        agent.plugins.length ? `${agent.plugins.length} plugins` : null
      ].filter(Boolean).join(' · ');
      button.append(name, meta);
      button.addEventListener('click', () => { const slot = (state.loadouts?.slots || []).find(item => item.owner === agent.id); navigate('systems'); requestAnimationFrame(() => document.querySelector(slot ? '[data-slot="' + slot.id + '"]' : '.pipeline-strip')?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })); });
      list.append(button);
    });
    lane.append(heading, list); return lane;
  }));
}


// ---------------------------------------------------------------------------
// The transport. Band 2 of the shell: the locked route always, and run state only
// while run state is true.
//
// This is REFERENCES.md P5 - "a view of a process must show the process that ran". The data
// has been on /api/events the whole time and runPhaseTraces() already computed it; nothing
// drew it, so the pipeline map stayed an illustration of what is possible rather than an
// instrument showing what happened.
//
// The contract, from DESIGN.md:
//   no run     -> header line only, ~34px, the five names inline
//   in flight  -> the five-stage track, per-stage status and tokens
//   completed  -> header line only. A finished run is history, and history lives in Runs.
// It never shows stale run state: keeping a completed run expanded would spend ~16% of every
// viewport on every view displaying something that stopped being true.
// ---------------------------------------------------------------------------

const STAGE_ORDER = ['convenium-design-director', 'athena-evidence', 'calliope-experience', 'hephaestus-build', 'hermes-delivery'];

function liveRun() {
  // "In flight" means a run that started and has neither completed nor failed. Anything else
  // - including a run that finished ten seconds ago - is history.
  return connectedRunsFromEvents().find(run => run.status === 'in-progress') || null;
}

function stageStateFor(run, agent) {
  if (!run) return null;
  const events = run.events.filter(event => event.data?.agent === agent.name);
  if (!events.length) return { key: '', label: 'not reached', tokens: 0 };
  const failed = events.find(event => event.kind === 'run.failed');
  const paused = events.find(event => event.data?.status === 'approval-required' || event.kind === 'run.paused');
  const done = events.find(event => event.data?.status === 'completed' || event.data?.status === 'simulated');
  const tokens = events.reduce((sum, event) => sum + (Number(event.data?.tokens) || 0), 0);
  if (failed) return { key: 'is-waiting', label: 'failed', tokens };
  if (paused) return { key: 'is-waiting', label: 'waiting for approval', tokens };
  if (done) return { key: 'is-done', label: 'completed', tokens };
  return { key: 'is-live', label: 'running', tokens };
}

function renderTransport() {
  const route = $('#transport-route');
  const meta = $('#transport-meta');
  const track = $('#transport-track');
  if (!route || !meta || !track) return;

  const system = activeSystem();
  const agents = STAGE_ORDER
    .map(id => (system?.agents || []).find(agent => agent.id === id))
    .filter(Boolean);
  if (!agents.length) { route.textContent = ''; meta.textContent = 'Pipeline unavailable'; track.hidden = true; return; }

  route.textContent = agents.map(agent => agent.name).join(' \u2192 ');

  const run = liveRun();
  meta.classList.toggle('is-live', Boolean(run));
  meta.classList.remove('is-waiting');

  if (!run) {
    // No run in flight. The band is the header line and nothing else.
    track.hidden = true;
    track.replaceChildren();
    const history = connectedRunsFromEvents();
    meta.textContent = history.length
      ? 'last run ' + history[0].runId.slice(0, 7) + ' \u00b7 ' + relativeTime(history[0].updatedAt)
      : 'No run yet';
    return;
  }

  const loadout = state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId);
  const slots = state.loadouts?.slots || [];
  const tokens = run.events.reduce((sum, event) => sum + (Number(event.data?.tokens) || 0), 0);
  const ceiling = loadout?.budget?.totalTokens || 0;
  meta.textContent = tokens.toLocaleString() + (ceiling ? ' / ' + ceiling.toLocaleString() : '') + ' tok \u00b7 run ' + run.runId.slice(0, 7);

  track.hidden = false;
  track.replaceChildren(...agents.map(agent => {
    const cell = document.createElement('div');
    const stage = stageStateFor(run, agent);
    cell.className = 'transport-stage' + (stage.key ? ' ' + stage.key : '');
    if (stage.key === 'is-waiting') meta.classList.add('is-waiting');

    const phase = document.createElement('span');
    phase.className = 'stage-phase';
    phase.textContent = phaseLabels[agent.phase] || agent.phase;
    const name = document.createElement('strong');
    name.textContent = agent.name;
    const carries = document.createElement('span');
    carries.className = 'stage-carries';
    const owned = slots.filter(slot => slot.owner === agent.id);
    carries.textContent = owned.length && loadout
      ? owned.map(slot => loadout.slots[slot.id] || slot.default).join(', ')
      : agent.skills.join(', ');
    const status = document.createElement('span');
    status.className = 'stage-state';
    const dot = document.createElement('i');
    const label = document.createElement('span');
    label.textContent = stage.tokens
      ? stage.label + ' \u00b7 ' + stage.tokens.toLocaleString()
      : stage.label;
    status.append(dot, label);

    cell.append(phase, name, carries, status);
    return cell;
  }));
}

function relativeTime(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.round(seconds / 60) + ' min ago';
  if (seconds < 86400) return Math.round(seconds / 3600) + ' h ago';
  return Math.round(seconds / 86400) + ' d ago';
}

function renderOutputs(system) {
  const host = $('#output-grid');
  $('#output-count').textContent = `${system.outputs.length} output${system.outputs.length === 1 ? '' : 's'}`;
  if (!system.outputs.length) { host.innerHTML = '<div class="empty-state compact"><strong>No outputs yet.</strong><p>Runs produced by this system will collect here with their preview and trace.</p></div>'; return; }
  host.replaceChildren(...system.outputs.map(output => {
    const article = document.createElement('article'); article.className = 'output-item';
    const preview = output.previewPath ? document.createElement('img') : document.createElement('div');
    if (output.previewPath) { preview.src = `/api/systems/${system.id}/outputs/${output.id}/preview`; preview.alt = `${output.name} project preview`; preview.loading = 'lazy'; }
    else { preview.className = 'output-text-preview'; const excerpt = document.createElement('p'); excerpt.textContent = output.content || output.summary || 'Output trace saved without a visual asset.'; preview.append(excerpt); }
    const copy = document.createElement('div');
    const meta = document.createElement('span'); meta.textContent = `${output.type} · ${output.status}`;
    const title = document.createElement('h3'); title.textContent = output.name;
    const summary = document.createElement('p'); summary.textContent = output.summary;
    const run = document.createElement('small'); run.textContent = output.runId;
    copy.append(meta, title, summary, run); article.append(preview, copy); return article;
  }));
}

// ---------------------------------------------------------------------------
// Loadouts. The pipeline above them is read-only by construction: it is rendered from the
// server's roster and there is no control on this screen that can change it.
// ---------------------------------------------------------------------------

const PHASE_LABEL = { always: 'Owns the answer', diagnose: 'Diagnose', direct: 'Direct', prepare: 'Prepare', build: 'Build', verify: 'Verify' };

function selectedLoadout() {
  return state.loadouts?.loadouts.find(item => item.id === state.selectedLoadoutId)
    || state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId)
    || state.loadouts?.loadouts[0] || null;
}

async function refreshLoadouts(selectId = state.selectedLoadoutId) {
  state.loadouts = await api('/api/loadouts');
  state.selectedLoadoutId = state.loadouts.loadouts.some(item => item.id === selectId) ? selectId : state.loadouts.activeLoadoutId;
  renderSystems();
  renderArchitectureAgents();
  renderTransport();
}

function renderPipelineStrip() {
  const host = $('#pipeline-stages');
  if (!host) return;
  const system = activeSystem();
  const agents = system?.agents || [];
  host.replaceChildren(...agents.map(agent => {
    const item = document.createElement('li');
    item.className = 'pipeline-stage';
    const phase = document.createElement('span'); phase.className = 'stage-phase'; phase.textContent = PHASE_LABEL[agent.phase] || agent.phase;
    const name = document.createElement('strong'); name.textContent = agent.name;
    const role = document.createElement('p'); role.textContent = agent.description;
    const owns = document.createElement('span'); owns.className = 'stage-owns';
    const owned = (state.loadouts?.slots || []).filter(slot => slot.owner === agent.id);
    owns.textContent = owned.length ? `Owns ${owned.map(slot => slot.name).join(', ')}` : 'Owns no loadout slot';
    item.append(phase, name, role, owns);
    return item;
  }));
}

function renderLoadoutList() {
  const host = $('#loadout-list');
  if (!host || !state.loadouts) return;
  host.replaceChildren(...state.loadouts.loadouts.map(loadout => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `system-list-item${loadout.id === state.selectedLoadoutId ? ' is-selected' : ''}${loadout.id === state.loadouts.activeLoadoutId ? ' is-active-system' : ''}`;
    const title = document.createElement('strong'); title.textContent = loadout.name;
    const changed = (state.loadouts.slots || []).filter(slot => loadout.slots[slot.id] !== slot.default).length;
    const meta = document.createElement('span');
    meta.textContent = changed ? `${changed} of 8 changed from default` : 'All eight at their default';
    const stateLabel = document.createElement('small');
    stateLabel.textContent = loadout.id === state.loadouts.activeLoadoutId ? 'Active' : 'Saved';
    button.append(title, meta, stateLabel);
    button.addEventListener('click', () => { state.selectedLoadoutId = loadout.id; renderSystems(); });
    return button;
  }));
}

// One row per question. The row states what the slot decides, who owns it, and - the part
// the flat checkbox list could never say - what changes if you switch it.
function renderSlotRow(slot, loadout) {
  const row = document.createElement('div');
  row.className = 'slot-row';
  row.dataset.slot = slot.id;

  const heading = document.createElement('div'); heading.className = 'slot-heading';
  const name = document.createElement('strong'); name.textContent = slot.name;
  const question = document.createElement('p'); question.className = 'slot-question'; question.textContent = slot.question;
  const owner = document.createElement('span'); owner.className = 'slot-owner';
  const ownerAgent = activeSystem()?.agents.find(agent => agent.id === slot.owner);
  owner.textContent = ownerAgent ? ownerAgent.name : slot.owner;
  heading.append(name, question, owner);

  const control = document.createElement('div'); control.className = 'slot-control';
  const label = document.createElement('label'); label.className = 'sr-only';
  const selectId = `slot-${slot.id}`;
  label.setAttribute('for', selectId); label.textContent = slot.question;
  const select = document.createElement('select'); select.id = selectId;
  for (const candidate of slot.candidates) {
    const option = document.createElement('option');
    option.value = candidate.skill;
    option.textContent = candidate.skill === slot.default ? `${candidate.skill} (default)` : candidate.skill;
    select.append(option);
  }
  select.value = loadout.slots[slot.id] || slot.default;

  const changes = document.createElement('p'); changes.className = 'slot-changes';
  const describe = () => {
    const chosen = slot.candidates.find(candidate => candidate.skill === select.value);
    changes.textContent = chosen ? chosen.changes : '';
    row.classList.toggle('is-changed', select.value !== slot.default);
  };
  describe();
  select.addEventListener('change', () => { describe(); markLoadoutDirty(); });

  control.append(label, select, changes);
  row.append(heading, control);
  return row;
}

// Selecting another loadout used to throw away whatever had been changed, silently. The
// edits now travel with the loadout they belong to: switch away, switch back, they are
// still there and still marked unsaved. Nothing is lost and nothing has to be decided.
function captureLoadoutDraft() {
  const loadout = selectedLoadout();
  if (!loadout || !$('#loadout-form')) return;
  const form = $('#loadout-form');
  state.loadoutDrafts.set(loadout.id, {
    name: form.elements.name.value,
    description: form.elements.description.value,
    slots: readSlotSelections(),
    brief: $('#loadout-brief').value,
    tools: { mcp: $$('#loadout-tools input:checked').map(input => input.dataset.toolId), plugins: loadout.tools.plugins },
    budget: {
      totalTokens: Number($('#loadout-budget').value) || loadout.budget.totalTokens,
      approvals: Object.fromEntries($$('#approval-list input').map(input => [input.dataset.approvalFor, input.checked]))
    }
  });
}

function markLoadoutDirty() {
  captureLoadoutDraft();
  renderLoadoutStatus();
}

function renderLoadoutStatus() {
  const loadout = selectedLoadout();
  const feedback = $('#loadout-feedback');
  if (!loadout || !feedback) return;
  const dirty = state.loadoutDrafts.has(loadout.id);
  const isActive = loadout.id === state.loadouts.activeLoadoutId;
  feedback.replaceChildren();
  const message = document.createElement('span');
  message.textContent = dirty
    ? 'Unsaved changes. They are kept if you look at another loadout.'
    : (isActive ? 'Active: the next run uses this.' : 'Saved. The next run uses ' + (state.loadouts.loadouts.find(item => item.id === state.loadouts.activeLoadoutId)?.name || 'another loadout') + '.');
  feedback.append(message);
  feedback.classList.toggle('is-dirty', dirty);
  if (dirty) {
    const discard = document.createElement('button');
    discard.type = 'button';
    discard.className = 'quiet-action';
    discard.textContent = 'Discard changes';
    discard.addEventListener('click', () => {
      state.loadoutDrafts.delete(loadout.id);
      renderSystems();
    });
    feedback.append(discard);
  }
}

function readSlotSelections() {
  const slots = {};
  $$('#slot-rows .slot-row').forEach(row => {
    slots[row.dataset.slot] = row.querySelector('select').value;
  });
  return slots;
}


// ---------------------------------------------------------------------------
// Design DNA, brief, tools and budget: the rest of the loadout.
// ---------------------------------------------------------------------------

async function refreshDesignDna() {
  state.designDna = await api('/api/design-dna');
}

function renderAvoidList(avoidList) {
  // The schema's avoidList unions and is never overridden by a doctrine default, which makes
  // it the most load-bearing field in the profile. It is rendered at least as prominently as
  // the preferences, not folded into a summary line.
  const block = document.createElement('div');
  block.className = 'avoid-block';
  const heading = document.createElement('strong');
  heading.textContent = 'Never, in any run';
  const note = document.createElement('p');
  note.className = 'avoid-note';
  note.textContent = 'These union across profiles and are never overridden by a doctrine default.';
  const list = document.createElement('ul');
  list.className = 'avoid-list';
  if (!avoidList.length) {
    const item = document.createElement('li');
    item.className = 'avoid-empty';
    item.textContent = 'Nothing ruled out yet.';
    list.append(item);
  } else {
    for (const entry of avoidList) {
      const item = document.createElement('li');
      item.textContent = entry;
      list.append(item);
    }
  }
  block.append(heading, note, list);
  return block;
}

function renderProfileSummary(profile) {
  const wrap = document.createElement('div');
  wrap.className = 'dna-profile';

  const head = document.createElement('div');
  head.className = 'dna-profile-head';
  const name = document.createElement('strong');
  name.textContent = profile.displayName;
  const meta = document.createElement('span');
  meta.className = 'dna-meta';
  meta.textContent = (profile.doctrine ? profile.doctrine : 'bespoke') + ' · ' + profile.source
    + ' · confidence ' + Math.round((profile.confidence?.overall ?? 0) * 100) + '%';
  const detach = document.createElement('button');
  detach.type = 'button';
  detach.className = 'quiet-action';
  detach.textContent = 'Detach';
  detach.addEventListener('click', async () => {
    const form = $('#loadout-form');
    await api('/api/loadouts/' + selectedLoadout().id, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ designDna: '', name: form.elements.name.value })
    });
    await refreshLoadouts(selectedLoadout().id);
  });
  head.append(name, meta, detach);

  const prefs = document.createElement('dl');
  prefs.className = 'dna-prefs';
  for (const [field, value] of Object.entries(profile.explicitPreferences || {})) {
    const term = document.createElement('dt');
    term.textContent = field;
    const def = document.createElement('dd');
    def.textContent = Array.isArray(value) ? value.join(' · ') : String(value);
    prefs.append(term, def);
  }

  wrap.append(head, prefs, renderAvoidList(profile.avoidList || []));
  return wrap;
}

function renderDoctrinePicker() {
  const wrap = document.createElement('div');
  wrap.className = 'doctrine-picker';
  const intro = document.createElement('p');
  intro.className = 'dna-intro';
  intro.textContent = 'No profile attached. Pick a shipped doctrine to start from, or run an interview for something bespoke.';
  wrap.append(intro);

  const grid = document.createElement('div');
  grid.className = 'doctrine-grid';
  for (const doctrine of state.designDna?.doctrines || []) {
    const card = document.createElement('div');
    card.className = 'doctrine-card';
    const name = document.createElement('strong');
    name.textContent = doctrine.name;
    const id = document.createElement('span');
    id.className = 'doctrine-id';
    id.textContent = doctrine.id;
    const summary = document.createElement('p');
    summary.textContent = doctrine.summary;
    const avoids = document.createElement('span');
    avoids.className = 'doctrine-avoids';
    avoids.textContent = doctrine.avoidList.length + ' things it refuses';
    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'quiet-action';
    use.textContent = 'Use this doctrine';
    use.addEventListener('click', async () => {
      const loadout = selectedLoadout();
      const form = $('#loadout-form');
      try {
        const profile = await api('/api/design-dna', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ doctrine: doctrine.id, displayName: doctrine.name + ' — ' + loadout.name })
        });
        await api('/api/loadouts/' + loadout.id, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ designDna: profile.profileId, name: form.elements.name.value })
        });
        await refreshDesignDna();
        await refreshLoadouts(loadout.id);
      } catch (error) { $('#loadout-feedback').textContent = error.message; }
    });
    card.append(name, id, summary, avoids, use);
    grid.append(card);
  }
  wrap.append(grid);

  const interviews = document.createElement('div');
  interviews.className = 'interview-list';
  const interviewHeading = document.createElement('strong');
  interviewHeading.textContent = 'Or build one by interview';
  const interviewNote = document.createElement('p');
  interviewNote.className = 'dna-intro';
  interviewNote.textContent = 'These run in the agent host, not in this browser. Invoke the skill by name and it writes a schema-valid profile into library/design-dna/, where this panel will pick it up.';
  interviews.append(interviewHeading, interviewNote);
  for (const interview of state.designDna?.interviews || []) {
    const row = document.createElement('div');
    row.className = 'interview-row';
    const label = document.createElement('code');
    label.textContent = interview.id;
    const cost = document.createElement('span');
    cost.className = 'interview-cost';
    cost.textContent = interview.cost;
    const description = document.createElement('span');
    description.textContent = interview.description;
    row.append(label, cost, description);
    interviews.append(row);
  }
  wrap.append(interviews);
  return wrap;
}

function renderDesignDnaPanel(loadout) {
  const host = $('#dna-panel');
  if (!host) return;
  const profile = (state.designDna?.profiles || []).find(item => item.profileId === loadout.designDna);
  host.replaceChildren(profile ? renderProfileSummary(profile) : renderDoctrinePicker());
}

function renderLoadoutTools(loadout) {
  const host = $('#loadout-tools');
  if (!host) return;
  const available = state.systems?.inventory?.mcp || [];
  host.replaceChildren(...available.map(tool => {
    const label = document.createElement('label');
    label.className = 'tool-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = loadout.tools.mcp.includes(tool.id);
    input.disabled = tool.usable === false;
    input.addEventListener('change', markLoadoutDirty);
    input.dataset.toolId = tool.id;
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = tool.name;
    const detail = document.createElement('small');
    // The existing honest availability reporting is kept: an unavailable tool is shown
    // with its real status rather than hidden or silently disabled.
    detail.textContent = tool.usable === false
      ? (tool.status || 'unavailable') + ' — cannot be used in this environment'
      : (tool.status || 'available');
    copy.append(name, detail);
    label.append(input, copy);
    return label;
  }));
}

function renderApprovals(loadout) {
  const host = $('#approval-list');
  if (!host) return;
  const agents = activeSystem()?.agents || [];
  host.replaceChildren(...agents.map(agent => {
    const label = document.createElement('label');
    label.className = 'compact-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(loadout.budget.approvals[agent.id]);
    input.dataset.approvalFor = agent.id;
    input.addEventListener('change', markLoadoutDirty);
    const copy = document.createElement('span');
    copy.textContent = agent.name + ' pauses for approval';
    label.append(input, copy);
    return label;
  }));
}

function describeBudget(tokens) {
  // A raw number with no unit is not a budget. Translate it into the thing it buys.
  const perAgent = Math.round(tokens / 5 / 100) * 100;
  return tokens.toLocaleString() + ' tokens — roughly ' + perAgent.toLocaleString()
    + ' per agent across the five stages, or about ' + Math.round(tokens / 750).toLocaleString() + ' pages of text.';
}

function renderSystems() {
  if (!state.loadouts || !$('#loadout-list')) return;
  renderPipelineStrip();
  renderLoadoutList();
  const loadout = selectedLoadout();
  const form = $('#loadout-form');
  const empty = $('#loadout-empty');
  empty.hidden = Boolean(loadout);
  form.hidden = !loadout;
  $('.slot-section').hidden = !loadout;
  if (!loadout) return;

  const draft = state.loadoutDrafts.get(loadout.id);
  const shown = draft ? { ...loadout, ...draft } : loadout;
  form.elements.name.value = shown.name;
  form.elements.description.value = shown.description;
  $('#activate-loadout').textContent = loadout.id === state.loadouts.activeLoadoutId ? 'Active loadout' : 'Use this loadout';
  $('#activate-loadout').disabled = loadout.id === state.loadouts.activeLoadoutId;
  $('#delete-loadout').disabled = state.loadouts.loadouts.length <= 1;
  $('#slot-rows').replaceChildren(...state.loadouts.slots.map(slot => renderSlotRow(slot, shown)));
  renderDesignDnaPanel(loadout);
  renderLoadoutTools(shown);
  renderApprovals(shown);
  $('#loadout-brief').value = shown.brief || '';
  $('#loadout-budget').value = shown.budget.totalTokens;
  $('#budget-translation').textContent = describeBudget(shown.budget.totalTokens);
  renderLoadoutStatus();
  renderOutputs(activeSystem());
}

function drawConnections() {
  const canvas = $('#workflow-canvas');
  const svg = $('#connector-layer');
  if (!canvas || !svg || matchMedia('(max-width: 760px)').matches || !canvas.offsetParent) return;
  const bounds = canvas.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  svg.querySelectorAll('path.connection').forEach(path => path.remove());
  const phase = $('#phase-filter').value;
  edges.forEach(edge => {
    const fromElement = canvas.querySelector(`[data-node="${CSS.escape(edge.from)}"]`);
    const toElement = canvas.querySelector(`[data-node="${CSS.escape(edge.to)}"]`);
    if (!fromElement || !toElement) return;
    const from = fromElement.getBoundingClientRect();
    const to = toElement.getBoundingClientRect();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('connection');
    if (edge.feedback) path.classList.add('feedback');
    if (phase !== 'all' && edge.phase !== phase) path.classList.add('is-dimmed');
    const local = rect => ({ left: rect.left - bounds.left, right: rect.right - bounds.left, top: rect.top - bounds.top, bottom: rect.bottom - bounds.top, cx: rect.left - bounds.left + rect.width / 2, cy: rect.top - bounds.top + rect.height / 2 });
    const a = local(from); const b = local(to);
    let d;
    if (edge.feedback) {
      const bottom = Math.min(bounds.height - 20, Math.max(a.bottom, b.bottom) + 58);
      d = `M ${a.cx} ${a.bottom} C ${a.cx} ${bottom}, ${b.cx} ${bottom}, ${b.cx} ${b.bottom}`;
    } else if (edge.vertical) {
      const gap = Math.max(24, (b.top - a.bottom) / 2);
      d = `M ${a.cx} ${a.bottom} C ${a.cx} ${a.bottom + gap}, ${b.cx} ${b.top - gap}, ${b.cx} ${b.top}`;
    } else {
      const gap = Math.max(36, Math.abs(b.left - a.right) * .48);
      const startX = a.right; const endX = b.left;
      d = `M ${startX} ${a.cy} C ${startX + gap} ${a.cy}, ${endX - gap} ${b.cy}, ${endX} ${b.cy}`;
    }
    path.setAttribute('d', d);
    path.dataset.phase = edge.phase;
    svg.append(path);
  });
  animateConnections();
}

function animateConnections() {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const paths = $$('#connector-layer path.connection:not(.is-dimmed)');
  paths.forEach(path => {
    const length = path.getTotalLength();
    window.gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .15, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' });
  });
}

function animatePulse(target) {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.gsap.fromTo(target, { scale: .99 }, { scale: 1, duration: .12, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform' });
}

function selectNode(button, { animate = true } = {}) {
  selectedNodeId = button.dataset.node;
  $$('.workflow-node').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
  const [phase, title, copy] = nodeCopy[button.dataset.node];
  $('#inspector-phase').textContent = phase;
  $('#inspector-title').textContent = title;
  $('#inspector-copy').textContent = copy;
  // Selecting a stage tells you what it owns and what it is carrying on this run. It does
  // not let you rename it: the pipeline is product truth, and a node authored here would
  // never be executed by anything.
  const agent = (activeSystem()?.agents || []).find(item => item.id === NODE_OWNER[button.dataset.node]);
  const slots = (state.loadouts?.slots || []).filter(slot => agent && slot.owner === agent.id);
  const loadout = state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId);
  $('#inspector-owns').textContent = slots.length
    ? slots.map(slot => slot.name).join(', ')
    : (agent ? 'the answer — no slot to swap' : 'a gate — nothing to configure');
  $('#inspector-skills').textContent = slots.length && loadout
    ? slots.map(slot => loadout.slots[slot.id] || slot.default).join(', ')
    : (agent ? agent.skills.join(', ') : 'the run pauses here for approval');
  const openSlots = $('#inspector-open-slots');
  if (openSlots) openSlots.hidden = !slots.length;
  if (animate) animatePulse(button);
}

function persistGraph() {
  storage.write('convenium-design-graph-copy', nodeCopy);
  storage.write('convenium-design-graph-edges', edges);
  storage.write('convenium-design-graph-positions', graphPositions);
  storage.write('convenium-design-graph-phases', graphPhases);
}

function applyGraphPositions() {
  $$('.workflow-node').forEach(node => {
    const position = graphPositions[node.dataset.node] || { x: 8, y: 12 };
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
  });
  requestAnimationFrame(drawConnections);
}

function startNodeDrag(event) {
  if (event.button !== 0) return;
  const node = event.currentTarget;
  const canvas = $('#workflow-canvas');
  const canvasRect = canvas.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const grabX = event.clientX - nodeRect.left;
  const grabY = event.clientY - nodeRect.top;
  let moved = false;
  node.setPointerCapture(event.pointerId);
  node.classList.add('is-dragging');
  const move = pointer => {
    const dx = pointer.clientX - event.clientX; const dy = pointer.clientY - event.clientY;
    if (Math.hypot(dx, dy) > 5) moved = true;
    if (!moved) return;
    const maxX = Math.max(0, canvasRect.width - node.offsetWidth);
    const maxY = Math.max(0, canvasRect.height - node.offsetHeight);
    const x = Math.min(maxX, Math.max(0, pointer.clientX - canvasRect.left - grabX));
    const y = Math.min(maxY, Math.max(0, pointer.clientY - canvasRect.top - grabY));
    graphPositions[node.dataset.node] = { x: x / canvasRect.width * 100, y: y / canvasRect.height * 100 };
    node.style.left = `${graphPositions[node.dataset.node].x}%`;
    node.style.top = `${graphPositions[node.dataset.node].y}%`;
    drawConnections();
  };
  const end = () => {
    node.classList.remove('is-dragging');
    node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', end); node.removeEventListener('pointercancel', end);
    if (moved) { node.dataset.justDragged = 'true'; persistGraph(); $('#node-status').textContent = 'Node position saved locally.'; }
  };
  node.addEventListener('pointermove', move); node.addEventListener('pointerup', end); node.addEventListener('pointercancel', end);
}


function moveGraphNodeWithKeyboard(node, key, accelerated = false) {
  const canvas = $('#workflow-canvas'); const bounds = canvas.getBoundingClientRect();
  const current = graphPositions[node.dataset.node] || { x: 0, y: 0 };
  const step = accelerated ? 24 : 8;
  const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
  const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
  const maxX = Math.max(0, bounds.width - node.offsetWidth); const maxY = Math.max(0, bounds.height - node.offsetHeight);
  const nextX = Math.min(maxX, Math.max(0, current.x / 100 * bounds.width + dx));
  const nextY = Math.min(maxY, Math.max(0, current.y / 100 * bounds.height + dy));
  graphPositions[node.dataset.node] = { x: nextX / bounds.width * 100, y: nextY / bounds.height * 100 };
  node.style.left = `${graphPositions[node.dataset.node].x}%`; node.style.top = `${graphPositions[node.dataset.node].y}%`;
  persistGraph(); drawConnections(); selectNode(node, { animate: false });
  const title = node.querySelector('strong').textContent;
  $('#node-status').textContent = `${title} moved ${key.replace('Arrow', '').toLowerCase()}. Position ${Math.round(graphPositions[node.dataset.node].x)}%, ${Math.round(graphPositions[node.dataset.node].y)}%.`;
}

function bindGraphNode(node) {
  node.setAttribute('aria-roledescription', 'workflow node');
  node.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Delete Escape');
  node.addEventListener('pointerdown', startNodeDrag);
  node.addEventListener('click', event => {
    if (node.dataset.justDragged) { delete node.dataset.justDragged; return; }
    selectNode(node, { animate: event.detail !== 0 });
  });
  node.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); moveGraphNodeWithKeyboard(node, event.key, event.shiftKey); return; }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      $('#node-status').textContent = 'The pipeline is locked. Change what a stage carries in Loadouts.';
    }
  });
}



function autoLayoutGraph(animate = true) {
  const nodes = $$('.workflow-node');
  nodes.forEach((node, index) => {
    const column = index % 4; const row = Math.floor(index / 4);
    graphPositions[node.dataset.node] = { x: 3 + column * 24, y: 14 + row * 42 };
  });
  persistGraph(); applyGraphPositions();
  if (animate && window.gsap && !reduceMotion()) window.gsap.fromTo(nodes, { scale: .985 }, { scale: 1, duration: .12, ease: 'power2.out', clearProps: 'transform' });
  $('#node-status').textContent = 'Nodes arranged into a clear reading order.';
}

function resetGraph() {
  Object.keys(nodeCopy).forEach(key => delete nodeCopy[key]); Object.assign(nodeCopy, structuredClone(defaultNodeCopy));
  graphPositions = structuredClone(defaultGraphPositions); edges = structuredClone(defaultEdges);
  graphPhases = {};
  $$('.workflow-node.custom-node').forEach(node => node.remove());
  $$('.workflow-node').forEach(node => { const [phase, title, copy] = nodeCopy[node.dataset.node]; node.dataset.phase = node.dataset.node === 'director' ? 'all' : node.dataset.phase; node.querySelector('span').textContent = phase; node.querySelector('strong').textContent = title; node.querySelector('small').textContent = copy; });
  persistGraph(); applyGraphPositions(); selectNode($('.workflow-node[data-node="director"]')); $('#node-status').textContent = 'Default graph restored.';
}

function restoreGraphNodes() {
  Object.keys(nodeCopy).filter(id => !defaultNodeCopy[id]).forEach(id => {
    if ($(`.workflow-node[data-node="${CSS.escape(id)}"]`)) return;
    const [label, title, copy] = nodeCopy[id];
    const node = document.createElement('button'); node.type = 'button'; node.className = 'workflow-node custom-node';
    node.dataset.node = id; node.dataset.phase = graphPhases[id] || 'prepare'; node.setAttribute('aria-pressed', 'false');
    node.innerHTML = '<span></span><strong></strong><small></small>';
    node.querySelector('span').textContent = label; node.querySelector('strong').textContent = title; node.querySelector('small').textContent = copy;
    $('.workflow-grid').append(node);
  });
  $$('.workflow-node').forEach(node => { if (graphPhases[node.dataset.node]) node.dataset.phase = graphPhases[node.dataset.node]; });
}

function presetOptions(select) {
  select.innerHTML = '<option value="current">Current architecture selection</option>' + state.config.presets.map(preset => `<option value="${preset.id}">${preset.name}</option>`).join('') + '<option value="custom">Custom</option>';
}

// A variant is a loadout under test. The flat skill set stays available behind Advanced so
// nothing that was possible with 84 checkboxes becomes impossible, but the comparison the
// product is for is a comparison of loadouts.
function createVariant(name, loadoutId, skillIds) {
  const loadout = state.loadouts?.loadouts.find(item => item.id === loadoutId) || state.loadouts?.loadouts[0];
  return {
    id: crypto.randomUUID(),
    name,
    loadoutId: loadout?.id || null,
    skills: new Set(skillIds || resolveLoadoutSkills(loadout)),
    tools: new Set()
  };
}

// The skills a loadout actually carries: its eight answers, plus anything the user added
// through Advanced. This is the same rule agents.mjs applies server-side.
function resolveLoadoutSkills(loadout) {
  if (!loadout) return [...state.activeSkills];
  const slots = state.loadouts?.slots || [];
  const chosen = slots.map(slot => loadout.slots[slot.id] || slot.default);
  return [...new Set([...chosen, ...(loadout.advancedSkills || [])])];
}

function variantLoadout(variant) {
  return state.loadouts?.loadouts.find(item => item.id === variant.loadoutId) || null;
}

function loadoutOptions(select) {
  select.replaceChildren(...(state.loadouts?.loadouts || []).map(loadout => {
    const option = document.createElement('option');
    option.value = loadout.id;
    option.textContent = loadout.name;
    return option;
  }));
}

// Differences only. A table that repeats the six decisions both sides agree on is a table
// nobody reads; the comparison is the four lines that differ.
function renderSlotDiff() {
  const head = $('#diff-head');
  const body = $('#diff-body');
  const table = $('#diff-table');
  const empty = $('#diff-empty');
  if (!head || !state.loadouts) return;

  const loadouts = state.variants.map(variantLoadout);
  const slots = state.loadouts.slots || [];
  const differing = slots.filter(slot => {
    const values = loadouts.map(loadout => loadout ? (loadout.slots[slot.id] || slot.default) : null);
    return new Set(values).size > 1;
  });

  const identical = differing.length === 0;
  empty.hidden = !identical;
  table.hidden = identical;
  if (identical) { head.replaceChildren(); body.replaceChildren(); return; }

  const headCells = [document.createElement('th')];
  headCells[0].scope = 'col';
  headCells[0].textContent = 'Decision';
  for (const variant of state.variants) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = variant.name;
    headCells.push(cell);
  }
  head.replaceChildren(...headCells);

  body.replaceChildren(...differing.map(slot => {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    const name = document.createElement('strong');
    name.textContent = slot.name;
    const question = document.createElement('span');
    question.className = 'diff-question';
    question.textContent = slot.question;
    label.append(name, question);
    row.append(label);

    for (const loadout of loadouts) {
      const cell = document.createElement('td');
      const choice = loadout ? (loadout.slots[slot.id] || slot.default) : slot.default;
      const value = document.createElement('code');
      value.textContent = choice;
      const consequence = document.createElement('span');
      consequence.className = 'diff-consequence';
      consequence.textContent = slot.candidates.find(candidate => candidate.skill === choice)?.changes || '';
      cell.append(value, consequence);
      row.append(cell);
    }
    return row;
  }));
}

function renderVariants() {
  const grid = $('#variant-grid');
  grid.classList.toggle('has-three', state.variants.length === 3);
  grid.replaceChildren(...state.variants.map(variant => {
    const card = $('#variant-template').content.firstElementChild.cloneNode(true);
    card.dataset.id = variant.id;
    const name = card.querySelector('.variant-name');
    name.value = variant.name;
    name.addEventListener('input', () => { variant.name = name.value; renderSlotDiff(); });

    const remove = card.querySelector('.remove-variant');
    remove.hidden = state.variants.length <= 2;
    remove.addEventListener('click', () => {
      const removed = variant;
      const index = state.variants.indexOf(variant);
      state.variants = state.variants.filter(item => item.id !== variant.id);
      renderVariants();
      offerUndo('Removed ' + removed.name + '.', async () => {
        state.variants.splice(index, 0, removed);
        renderVariants();
      });
    });

    const loadoutSelect = card.querySelector('.variant-loadout');
    loadoutOptions(loadoutSelect);
    loadoutSelect.value = variant.loadoutId || '';
    loadoutSelect.addEventListener('change', () => {
      variant.loadoutId = loadoutSelect.value;
      variant.skills = new Set(resolveLoadoutSkills(variantLoadout(variant)));
      renderVariants();
    });

    const skillsHost = card.querySelector('.variant-skills');
    state.config.skills.forEach(skill => {
      const label = document.createElement('label');
      label.className = 'variant-skill';
      label.innerHTML = '<input type="checkbox"><span></span>';
      const input = label.querySelector('input');
      input.checked = variant.skills.has(skill.id);
      label.querySelector('span').textContent = skill.name + ' · ' + skill.phase;
      input.addEventListener('change', () => {
        if (input.checked) variant.skills.add(skill.id); else variant.skills.delete(skill.id);
        updateVariantSummary(card, variant);
      });
      skillsHost.append(label);
    });

    const webSearch = card.querySelector('.variant-web-search');
    webSearch.checked = variant.tools.has('web_search');
    webSearch.disabled = state.config.mode !== 'live';
      webSearch.title = state.config.mode === 'live' ? '' : 'Available once the runtime is verified live.';
    webSearch.addEventListener('change', () => { if (webSearch.checked) variant.tools.add('web_search'); else variant.tools.delete('web_search'); });

    updateVariantSummary(card, variant);
    return card;
  }));
  $('#add-variant').hidden = state.variants.length === 3;
  renderSlotDiff();
}

function updateVariantSummary(card, variant) {
  const loadout = variantLoadout(variant);
  const slots = state.loadouts?.slots || [];
  const changed = loadout ? slots.filter(slot => (loadout.slots[slot.id] || slot.default) !== slot.default).length : 0;
  card.querySelector('.variant-count').textContent = changed
    ? changed + ' of ' + slots.length + ' changed'
    : 'All ' + slots.length + ' at default';
  const dnaName = loadout?.designDna
    ? (state.designDna?.profiles || []).find(profile => profile.profileId === loadout.designDna)?.displayName
    : null;
  card.querySelector('.variant-groups').textContent = [
    variant.skills.size + ' skills',
    dnaName ? 'DNA: ' + dnaName : 'No Design DNA'
  ].join(' · ');
}

function renderResults(run) {
  const grid = $('#results-grid');
  grid.classList.toggle('has-three', run.results.length === 3);
  const cards = run.results.map(result => {
    const card = document.createElement('article');
    card.className = 'result-card';
    const head = document.createElement('div');
    head.className = 'result-head';
    const title = document.createElement('strong'); title.textContent = result.variant.name;
    const meta = document.createElement('div'); meta.className = 'result-meta';
    const mode = document.createElement('span'); mode.className = `result-mode ${result.mode === 'live' ? 'live' : ''}`; mode.textContent = result.mode;
    meta.append(mode);
    if (!result.error) {
      meta.append(document.createTextNode(`${result.latencyMs} ms`), document.createTextNode(`${result.usage.totalTokens} tokens`), document.createTextNode(`${result.variant.skills.length} skills`));
    }
    head.append(title, meta);
    const body = document.createElement('pre'); body.className = `result-body${result.error ? ' result-error' : ''}`; body.textContent = result.error || result.text;
    card.append(head, body);
    if (!result.error) {
      const keep = document.createElement('button'); keep.type = 'button'; keep.className = 'quiet-action keep-setup'; keep.textContent = 'Keep this setup';
      // The last step of the headline workflow. It used to write a vestigial client store and
      // tell you to open the node editor - a surface that no longer exists. It now activates
      // the loadout that produced the winner, on the server, and says what it did.
      keep.addEventListener('click', async () => {
        keep.disabled = true;
        try {
          const kept = await api('/api/runs/' + run.runId + '/keep', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ variant: result.variant.name })
          });
          $$('.result-card').forEach(item => item.classList.remove('is-kept'));
          card.classList.add('is-kept');
          $$('.keep-setup').forEach(button => { button.textContent = 'Keep this setup'; button.disabled = false; });
          keep.textContent = 'Kept';
          keep.disabled = true;
          const previous = state.loadouts?.activeLoadoutId;
          if (kept.activatedLoadoutId) await refreshLoadouts(kept.activatedLoadoutId);
          await refreshRuns();
          const name = state.loadouts?.loadouts.find(item => item.id === kept.activatedLoadoutId)?.name;
          $('#run-message').textContent = name
            ? `Kept ${result.variant.name}. ${name} is now the active loadout, and the run is in Runs.`
            : `Kept ${result.variant.name}. The run is in Runs.`;
          if (kept.activatedLoadoutId && previous && previous !== kept.activatedLoadoutId) {
            offerUndo('Activated ' + (name || 'the winning loadout') + '.', async () => {
              await api('/api/loadouts/active', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: previous }) });
              await refreshLoadouts(previous);
            });
          }
          animatePulse(card);
        } catch (error) {
          keep.disabled = false;
          $('#run-message').textContent = 'Could not keep this setup: ' + error.message;
        }
      });
      card.append(keep);
    }
    return card;
  });
  grid.replaceChildren(...cards);
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) window.gsap.from(cards, { autoAlpha: 0, duration: .15, stagger: 0, ease: 'power3.out' });
}

// Runs are server-side records now. state.runs mirrors them so the rest of the view code is
// unchanged, but the mirror is never the source: B7 measured that a comparison did not
// survive a reload, because one localStorage key capped at 20 was the whole of its history.
async function refreshRuns() {
  try {
    const body = await api('/api/runs?limit=50');
    state.runs = body.runs || [];
    state.runsError = null;
  } catch (error) {
    state.runsError = error.message || 'The local run store did not respond.';
  }
  renderHistory();
  updateRunCount();
}

async function runComparison() {
  const prompt = $('#experiment-prompt').value.trim();
  if (prompt.length < 3) { $('#run-message').textContent = 'Enter a prompt with at least three characters.'; $('#experiment-prompt').focus(); return; }
  const scale = $('#run-scale').value;
  const scaleLabel = { pilot: 'pilot', standard: 'standard', full: 'full-plan' }[scale];
  const button = $('#run-comparison'); button.disabled = true; setCommandLabel(button, 'Running…'); setComparisonState('running');
  $('#run-message').textContent = `Running ${state.variants.length} ${scaleLabel} setups in parallel…`;
  try {
    const response = await fetch('/api/compare', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: $('#model-select').value,
        reasoning: $('#reasoning-select').value,
        maxOutputTokens: Number($('#max-output').value),
        mode: state.config.mode,
        variants: state.variants.map(variant => ({ name: variant.name, loadoutId: variant.loadoutId, skills: [...variant.skills], tools: [...variant.tools] }))
      })
    });
    const run = await response.json();
    if (!response.ok) throw new Error(run.error || 'Comparison failed.');
    await refreshRuns();
    $('#run-message').textContent = `${run.results.length} results ready · ${run.model} · ${run.reasoning} reasoning`;
    renderResults(run); setComparisonState('complete');
  } catch (error) {
    $('#run-message').textContent = error.message; setComparisonState('error');
  } finally {
    button.disabled = false; setCommandLabel(button, scale === 'pilot' ? 'Run pilot comparison' : scale === 'standard' ? 'Run standard comparison' : 'Run full comparison');
  }
}

// One history, not two. The split into "connected host runs" and "browser experiments"
// asked the reader to know which list a run would be in before they could look for it, and
// there is not enough MCP traffic to justify two chronologies. Source is a property of a
// row, not a reason for a second section.
function renderHistory() {
  const host = $('#run-history');
  const empty = $('#runs-empty');
  if (!host) return;

  if (state.eventsError) {
    const error = document.createElement('div');
    error.className = 'empty-state history-error';
    const title = document.createElement('strong');
    title.textContent = 'MCP run history is unavailable.';
    const detail = document.createElement('p');
    detail.textContent = state.eventsError + ' Runs made in this browser are still listed below.';
    const retry = document.createElement('button');
    retry.className = 'quiet-action';
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', refreshEvents);
    error.append(title, detail, retry);
    host.replaceChildren(error);
  } else {
    host.replaceChildren();
  }

  const connected = state.eventsError ? [] : connectedRunsFromEvents().map(run => ({
    at: run.updatedAt,
    source: 'host',
    sourceLabel: run.host,
    status: run.status,
    title: run.host,
    detail: run.runId,
    summary: run.summary,
    open: null
  }));
  const local = state.runs.map(run => ({
    at: run.createdAt,
    source: 'browser',
    sourceLabel: 'This browser',
    status: run.keptVariant ? 'kept' : 'completed',
    title: run.model || run.mode,
    detail: [
      `${run.results.length} loadout${run.results.length === 1 ? '' : 's'}`,
      run.keptVariant ? 'kept ' + run.keptVariant : null,
      run.results.some(result => result.contextSent) ? 'brief + DNA sent' : null,
    ].filter(Boolean).join(' · '),
    summary: run.prompt,
    // The stored shape nests the loadout snapshot under each result; renderResults expects
    // a `variant`. Rebuilt here so an old run opens exactly as it did when it was made.
    open: () => {
      renderResults({
        ...run,
        results: run.results.map(result => ({
          ...result,
          variant: { name: result.name, skills: result.skills || [], loadoutId: result.loadout?.id || null },
          usage: { totalTokens: result.tokens || 0 },
        })),
      });
      navigate('playground');
    }
  }));

  const rows = [...connected, ...local].sort((a, b) => new Date(b.at) - new Date(a.at));
  empty.hidden = rows.length > 0 || Boolean(state.eventsError);

  host.append(...rows.map(row => {
    const article = document.createElement('article');
    article.className = 'history-row';

    const identity = document.createElement('div');
    identity.className = 'history-identity';
    const time = document.createElement('time');
    time.dateTime = row.at;
    time.textContent = new Date(row.at).toLocaleString();
    const name = document.createElement('strong');
    name.textContent = row.title;
    const detail = document.createElement('small');
    detail.textContent = row.detail;
    identity.append(time, name, detail);

    const badges = document.createElement('div');
    badges.className = 'history-badges';
    const source = document.createElement('span');
    source.className = `history-source${row.source === 'host' ? ' is-connected' : ''}`;
    source.textContent = row.source === 'host' ? 'MCP host' : 'This browser';
    badges.append(source);
    if (row.source === 'host') {
      const status = document.createElement('span');
      status.className = `run-status status-${row.status}`;
      status.textContent = row.status.replace('-', ' ');
      badges.append(status);
    }

    const summary = document.createElement('div');
    summary.className = 'history-prompt';
    summary.textContent = row.summary || '';

    article.append(identity, badges, summary);
    if (row.open) {
      const open = document.createElement('button');
      open.className = 'quiet-action';
      open.type = 'button';
      open.textContent = 'Open results';
      open.addEventListener('click', row.open);
      article.append(open);
    }
    return article;
  }));
  updateRunCount();
}

// Runs view feedback. The view had no status line at all, so three of its four controls
// could decline silently.
function setRunsNote(text) {
  const host = $('#runs-note');
  if (host) host.textContent = text;
}

function exportRuns() {
  if (!state.runs.length && !connectedRunsFromEvents().length) {
    setRunsNote('Nothing to export yet — no runs have been recorded.');
    return;
  }
  const payload = { exportedAt: new Date().toISOString(), connectedRuns: connectedRunsFromEvents(), browserExperiments: state.runs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `convenium-design-runs-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
}

function inferEventPhase(event) {
  const declared = String(event.data?.phase || '').toLowerCase();
  if (phaseSequence.includes(declared)) return declared;
  if (event.data?.gate === 'A') return 'diagnose';
  if (event.data?.gate === 'B') return 'direct';
  if (event.data?.gate === 'C') return 'verify';
  if (event.kind === 'run.started') return 'build';
  if (event.kind === 'run.completed') return 'synthesize';
  const text = `${event.kind} ${event.summary}`.toLowerCase();
  if (event.kind === 'plan.created' || /brief|intake plan/.test(text)) return 'plan';
  if (/implement|build|production/.test(text)) return 'build';
  if (/qa|review|verify|handoff|gate c/.test(text)) return 'verify';
  if (/audit|evidence|research|inventory/.test(text)) return 'diagnose';
  if (/concept|direction|critique|gate b/.test(text)) return 'direct';
  if (/asset manifest|prepar|dependency|media mapping/.test(text)) return 'prepare';
  if (event.kind === 'artifact.created') return 'build';
  return 'plan';
}

function runPhaseTraces(events) {
  const groups = new Map(phaseSequence.map(phase => [phase, []]));
  events.forEach(event => groups.get(inferEventPhase(event)).push(event));
  const declaredSystemId = events.find(event => event.data?.systemId)?.data.systemId;
  const system = state.systems?.systems.find(item => item.id === declaredSystemId) || activeSystem();
  return phaseSequence.flatMap(phase => {
    const phaseEvents = groups.get(phase);
    if (!phaseEvents.length) return [];
    const declaredAgents = phaseEvents.map(event => event.data?.agent).filter(Boolean);
    const fallbackAgents = phase === 'plan' || phase === 'synthesize' ? ['Convenium.Design Orchestrator'] : system?.agents.filter(agent => agent.phase === phase && agent.enabled).map(agent => agent.name) || [];
    const agents = [...new Set(declaredAgents.length ? declaredAgents : fallbackAgents)];
    const tokenEvents = phaseEvents.filter(event => Number.isFinite(Number(event.data?.tokens)));
    const tokens = tokenEvents.reduce((sum, event) => sum + Number(event.data.tokens), 0);
    return [{ phase, label: phaseLabels[phase], events: phaseEvents, agents, tokens, tokensReported: tokenEvents.length > 0 }];
  });
}

function connectedRunsFromEvents() {
  const groups = new Map();
  state.events.filter(event => event.runId).forEach(event => {
    if (!groups.has(event.runId)) groups.set(event.runId, []);
    groups.get(event.runId).push(event);
  });
  return [...groups.entries()].map(([runId, events]) => {
    const ordered = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const latest = ordered.at(-1);
    const failed = [...ordered].reverse().find(event => event.kind === 'run.failed');
    const completed = [...ordered].reverse().find(event => event.kind === 'run.completed');
    const started = ordered.find(event => event.kind === 'run.started');
    const status = failed ? 'failed' : completed ? 'completed' : started ? 'in-progress' : 'activity';
    return { runId, host: started?.host || latest.host, status, createdAt: started?.createdAt || ordered[0].createdAt, updatedAt: latest.createdAt, summary: failed?.summary || completed?.summary || latest.summary, events: ordered, phases: runPhaseTraces(ordered) };
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function updateRunCount() {
  $('#run-count').textContent = connectedRunsFromEvents().length + state.runs.length;
}

function renderAgents() {
  const host = $('#agent-registry');
  if (!host) return;
  const query = ($('#agent-search')?.value || '').trim().toLowerCase();
  const categoryFilter = $('#agent-category')?.value || 'all';
  const categoryById = { 'convenium-design-director': 'Direction', 'athena-evidence': 'Research', 'calliope-experience': 'Direction', 'hephaestus-build': 'Production', 'hermes-delivery': 'Delivery' };
  const mediaById = {
    'convenium-design-director': '/media/gods/Convenium.Design/Character_202607032015.jpeg',
    'athena-evidence': '/media/gods/Athena/Character_202607032014.jpeg',
    'calliope-experience': '/media/gods/Calliope/Make_eaclty_this_picture_202607032015.jpeg',
    'hephaestus-build': '/media/gods/Hephaestus/Character_202607032015%20(1).jpeg',
    'hermes-delivery': '/media/gods/Hermes/Character_202607032015%20(3).jpeg'
  };
  const filtered = state.agents.filter(agent => {
    const category = categoryById[agent.id] || 'Direction';
    const haystack = `${agent.name} ${agent.description} ${agent.activation} ${agent.skills.join(' ')} ${category}`.toLowerCase();
    return (categoryFilter === 'all' || category === categoryFilter) && haystack.includes(query);
  });
  // The view's real empty state is #agents-empty. This used to write an inline duplicate and
  // return before ever unhiding it, so the state T9 checks for could not appear.
  const agentsEmpty = $('#agents-empty');
  if (agentsEmpty) agentsEmpty.hidden = filtered.length > 0;
  if (!filtered.length) { host.replaceChildren(); return; }
  host.replaceChildren(...filtered.map(agent => {
    const article = document.createElement('article');
    const category = categoryById[agent.id] || 'Direction';
    article.className = `agent-profile${agent.enabled ? '' : ' is-dormant'}`;
    article.innerHTML = `<div class="agent-portrait"><img src="/media/gods/Convenium.Design/Character_202607032015.jpeg" alt="" loading="lazy"><span class="agent-category"></span><span class="agent-state"></span></div><div class="agent-profile-main"><div class="agent-identity"><div><strong></strong><p></p></div></div><div class="agent-activation"><span>When this agent joins</span><p></p></div><div class="agent-skills"></div></div><div class="agent-controls"><label class="agent-budget">Token budget<input type="number" min="500" max="50000" step="500"><small class="budget-translation"></small></label><label class="compact-check"><input class="approval-toggle" type="checkbox"> <span>Pause for approval before acting</span></label><label class="switch agent-availability"><input class="agent-toggle" type="checkbox"><span class="switch-track" aria-hidden="true"></span><span class="switch-caption"></span></label></div>`;
    const portrait = article.querySelector('.agent-portrait img'); portrait.src = mediaById[agent.id] || mediaById['convenium-design-director']; portrait.alt = `${agent.name} profile portrait`;
    // The reserved box carries a CSS monogram behind the image; if the image fails, hide it
    // so the monogram is a complete substitute rather than a broken frame over an alt string.
    article.querySelector('.agent-portrait').dataset.monogram = (agent.name || '?').trim().charAt(0).toUpperCase();
    portrait.addEventListener('error', () => portrait.classList.add('is-failed'));
    article.querySelector('.agent-category').textContent = category;
    article.querySelector('.agent-state').textContent = agent.enabled ? 'Available' : 'Paused';
    article.querySelector('.agent-identity strong').textContent = agent.name;
    article.querySelector('.agent-identity p').textContent = agent.description;
    article.querySelector('.agent-activation p').textContent = agent.activation;
    const skillHost = article.querySelector('.agent-skills');
    agent.skills.forEach(id => { const span = document.createElement('span'); span.textContent = state.config.skills.find(skill => skill.id === id)?.name || id; skillHost.append(span); });
    const budget = article.querySelector('input[type="number"]'); budget.value = agent.budget;
    const approval = article.querySelector('.approval-toggle'); approval.checked = agent.approval;
    const enabled = article.querySelector('.agent-toggle'); enabled.checked = agent.enabled; enabled.setAttribute('aria-label', `Enable ${agent.name}`);
    const caption = article.querySelector('.switch-caption');
    const describeAvailability = () => { caption.textContent = enabled.checked ? 'Available' : 'Paused'; };
    describeAvailability();
    enabled.addEventListener('change', describeAvailability);
    // A budget is a number of tokens; a raw number is not a budget until it says what it buys.
    const translation = article.querySelector('.budget-translation');
    const describeAgentBudget = () => {
      const tokens = Number(budget.value) || 0;
      translation.textContent = tokens
        ? `about ${Math.max(1, Math.round(tokens / 750))} pages of reasoning for this phase`
        : 'no budget set';
    };
    describeAgentBudget();
    budget.addEventListener('input', describeAgentBudget);
    const save = async () => {
      try {
        const updated = await api(`/api/agents/${agent.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ budget: Number(budget.value), approval: approval.checked, enabled: enabled.checked }) });
        const index = state.agents.findIndex(item => item.id === agent.id); state.agents[index] = updated; renderAgents();
      } catch (error) { alert(error.message); }
    };
    budget.addEventListener('change', save); approval.addEventListener('change', save); enabled.addEventListener('change', save);
        return article;
  }));
}

async function refreshKnowledge(selectId = state.selectedSkillId) {
  state.knowledge = await api('/api/knowledge');
  state.config.skills = state.knowledge.skills;
  if (state.systems) state.systems.inventory.skills = state.knowledge.skills;
  state.selectedSkillId = selectId && state.knowledge.skills.some(skill => skill.id === selectId) ? selectId : state.knowledge.skills[0]?.id;
  renderSkillRegistry(); renderKnowledge(); renderVariants();
}

// Acronyms the registry writes in lower case inside an id. Expanding them is presentation
// only: the id itself is still shown, in mono, on every row.
const SKILL_ACRONYMS = new Set(['gsap', 'ui', 'ux', 'seo', 'qa', 'ai', 'api', 'mcp', 'dna', 'css', 'html', 'js', 'kb', 'pdf', 'gpt', 'webgl', 'aso', 'sms', 'crm', 'ab']);

// 60 of the 84 registry records have `name` set to the raw slug, which is why the Library
// read as a list of machine ids. This derives a readable label without touching the data.
function skillDisplayName(skill) {
  if (skill.name && skill.name !== skill.id) return skill.name;
  const words = String(skill.id).split('-');
  return words.map((word, index) => {
    if (SKILL_ACRONYMS.has(word)) return word.toUpperCase();
    if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  }).join(' ');
}

// Three states, and the difference between them is what the page is opened to find out.
function skillStatus(skill) {
  const loadout = state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId);
  const inUse = loadout
    ? Object.values(loadout.slots).includes(skill.id) || (loadout.advancedSkills || []).includes(skill.id)
    : false;
  if (inUse) return { key: 'in-use', label: 'In use' };
  if (skill.slot) return { key: 'available', label: 'Available' };
  return { key: 'unrouted', label: 'Capability library' };
}

function knowledgeGroups() {
  const slots = state.loadouts?.slots || [];
  return [
    { id: 'all', label: 'Everything', match: () => true },
    { id: 'in-use', label: 'In use by the active loadout', match: skill => skillStatus(skill).key === 'in-use' },
    ...slots.map(slot => ({ id: 'slot:' + slot.id, label: slot.name, match: skill => skill.slot === slot.id })),
    { id: 'unrouted', label: 'Capability library', match: skill => !skill.slot }
  ];
}

function renderKnowledge() {
  if (!state.knowledge || !$('#knowledge-skill-list')) return;
  $('#category-options').innerHTML = state.knowledge.categories
    .map(category => `<option value="${category.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></option>`).join('');

  const groups = knowledgeGroups();
  if (!groups.some(group => group.id === state.knowledgeCategory)) state.knowledgeCategory = 'all';
  const categoryHost = $('#category-list');
  categoryHost.replaceChildren(...groups.map(group => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `category-button${state.knowledgeCategory === group.id ? ' is-active' : ''}`;
    button.innerHTML = '<span></span><strong></strong>';
    button.querySelector('span').textContent = group.label;
    button.querySelector('strong').textContent = state.knowledge.skills.filter(group.match).length;
    button.addEventListener('click', () => { state.knowledgeCategory = group.id; renderKnowledge(); });
    return button;
  }));

  const group = groups.find(item => item.id === state.knowledgeCategory) || groups[0];
  const query = $('#knowledge-search').value.trim().toLowerCase();
  const filtered = state.knowledge.skills.filter(skill => group.match(skill)
    && `${skillDisplayName(skill)} ${skill.id} ${skill.group} ${skill.description}`.toLowerCase().includes(query));

  const skillHost = $('#knowledge-skill-list');
  const emptyHost = $('#knowledge-empty');
  emptyHost.hidden = filtered.length > 0;
  if (!filtered.length) {
    skillHost.replaceChildren();
    $('#knowledge-empty-copy').textContent = query
      ? 'No capability in "' + group.label + '" matches "' + query + '".'
      : '"' + group.label + '" holds no capabilities.';
    $('#knowledge-empty-action').textContent = query ? 'Clear the search' : 'Show everything';
  } else {
    skillHost.replaceChildren(...filtered.map(skill => {
      const status = skillStatus(skill);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `knowledge-skill${skill.id === state.selectedSkillId ? ' is-active' : ''}${skill.enabled ? '' : ' is-disabled'}`;
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = skillDisplayName(skill);
      const meta = document.createElement('p');
      meta.textContent = [skill.group, skill.phase === 'unrouted' ? null : skill.phase].filter(Boolean).join(' · ');
      const id = document.createElement('code');
      id.className = 'skill-id';
      id.textContent = skill.id;
      copy.append(title, meta, id);
      button.append(copy);
      if (status.key !== 'unrouted') {
        const badge = document.createElement('span');
        badge.className = `skill-status is-${status.key}`;
        badge.textContent = status.label;
        button.append(badge);
      }
      // A source count of zero on all 84 rows was noise; it is stated only when there is one.
      if (skill.sourceCount) {
        const count = document.createElement('span');
        count.className = 'knowledge-count';
        count.textContent = `${skill.sourceCount} source${skill.sourceCount === 1 ? '' : 's'}`;
        button.append(count);
      }
      button.addEventListener('click', () => { state.selectedSkillId = skill.id; renderKnowledge(); });
      return button;
    }));
  }
  renderKnowledgeInspector();
}

function renderKnowledgeInspector() {
  const host = $('#knowledge-inspector');
  const skill = state.knowledge.skills.find(item => item.id === state.selectedSkillId);
  if (!skill) { host.innerHTML = '<div class="empty-state" data-empty-state><strong>Nothing selected.</strong><p>Pick a capability on the left to read what it does, see which slot it answers, and attach a source.</p></div>'; return; }
  host.innerHTML = `<form id="skill-editor"><div class="inspector-title"><div><h2></h2><p class="skill-folder"></p></div><label class="switch"><input name="enabled" type="checkbox"><span class="switch-track" aria-hidden="true"></span></label></div><div class="editor-grid compact"><label>Category<input name="category" list="category-options" maxlength="50"></label><label>Phase<select name="phase"><option value="always">Always</option><option value="diagnose">Diagnose</option><option value="direct">Direct</option><option value="prepare">Prepare</option><option value="build">Build</option><option value="verify">Verify</option></select></label></div><label>Description<textarea name="description" rows="3" maxlength="500"></textarea></label><label>Runtime instructions<textarea name="runtimePrompt" rows="6" maxlength="4000"></textarea></label><div class="form-status"><span class="editor-status" role="status"></span><button class="run-action" type="submit">Save skill</button></div></form><section class="source-section"><div class="panel-heading"><div><h2>Source notes</h2><p>Local Markdown evidence attached to this skill.</p></div></div><div class="source-list"></div><form class="source-form"><div class="editor-grid compact"><label>Title<input name="title" required maxlength="100" placeholder="Reference or operating note"></label><label>Type<select name="type"><option value="note">Note</option><option value="url">URL</option></select></label></div><label>Content or URL<textarea name="content" required rows="3" maxlength="20000"></textarea></label><div class="form-status"><span class="source-status" role="status"></span><button class="quiet-action" type="submit">Add source</button></div></form></section>`;
  host.querySelector('h2').textContent = skillDisplayName(skill);
  // The two taxonomies are now named for what they are: `group` is how the Library browses,
  // `folder` is where the file physically lives. Neither was explained before.
  const status = skillStatus(skill);
  const slot = (state.loadouts?.slots || []).find(item => item.id === skill.slot);
  host.querySelector('.skill-folder').textContent = [
    status.label,
    slot ? 'answers the ' + slot.name + ' slot' : 'no slot — browsable only',
    'folder: ' + skill.folder
  ].join(' · ');
  const form = host.querySelector('#skill-editor'); form.elements.enabled.checked = skill.enabled; form.elements.category.value = skill.group; form.elements.phase.value = skill.phase; form.elements.description.value = skill.description; form.elements.runtimePrompt.value = skill.runtimePrompt;
  form.addEventListener('submit', async event => {
    event.preventDefault(); const status = form.querySelector('.editor-status');
    const unchanged = form.elements.enabled.checked === skill.enabled
      && form.elements.category.value === skill.group
      && form.elements.phase.value === skill.phase
      && form.elements.description.value === skill.description
      && form.elements.runtimePrompt.value === skill.runtimePrompt;
    if (unchanged) { status.textContent = 'Nothing to save — this capability matches what is stored.'; return; }
    status.textContent = 'Saving…';
    try { await api(`/api/knowledge/skills/${skill.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled: form.elements.enabled.checked, category: form.elements.category.value, phase: form.elements.phase.value, description: form.elements.description.value, runtimePrompt: form.elements.runtimePrompt.value }) }); await refreshKnowledge(skill.id); }
    catch (error) { status.textContent = error.message; }
  });
  const sourceList = host.querySelector('.source-list');
  if (!skill.sources.length) sourceList.innerHTML = '<p class="source-empty">No source notes yet.</p>';
  else skill.sources.forEach(source => { const row = document.createElement('article'); row.innerHTML = '<div><strong></strong><small></small></div><code></code>'; row.querySelector('strong').textContent = source.title; row.querySelector('small').textContent = `${source.type} · ${new Date(source.createdAt).toLocaleDateString()}`; row.querySelector('code').textContent = source.file; sourceList.append(row); });
  const sourceForm = host.querySelector('.source-form'); sourceForm.addEventListener('submit', async event => {
    event.preventDefault(); const status = sourceForm.querySelector('.source-status'); status.textContent = 'Adding…';
    try { await api(`/api/knowledge/skills/${skill.id}/sources`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: sourceForm.elements.title.value, type: sourceForm.elements.type.value, content: sourceForm.elements.content.value }) }); await refreshKnowledge(skill.id); }
    catch (error) { status.textContent = error.message; }
  });
}

function renderOracleMessages() {
  const host = $('#oracle-messages'); if (!host) return;
  if (!state.oracleMessages.length) { host.innerHTML = '<div class="oracle-empty"><strong>Oracle is ready.</strong><p>Describe a task. Planning is local and free; execution uses the configured runtime only after you ask.</p></div>'; return; }
  host.replaceChildren(...state.oracleMessages.map(message => {
    const article = document.createElement('article'); article.className = `oracle-message ${message.role}`;
    const label = document.createElement('span'); label.textContent = message.role === 'user' ? 'You' : 'Oracle';
    const body = document.createElement('pre'); body.textContent = message.text; article.append(label, body); return article;
  })); host.scrollTop = host.scrollHeight;
}

function renderOraclePlan() {
  const host = $('#oracle-plan-view'); if (!host) return;
  if (!state.oraclePlan) { host.innerHTML = '<div class="empty-state">Write a prompt to inspect its route.</div>'; return; }
  const plan = state.oraclePlan;
  const summary = document.createElement('div'); summary.className = 'plan-summary'; summary.innerHTML = '<strong></strong><span></span>'; summary.querySelector('strong').textContent = `${plan.system?.name || 'Active system'} · ${plan.steps.length} specialist${plan.steps.length === 1 ? '' : 's'}`; summary.querySelector('span').textContent = `${plan.allocatedBudget.toLocaleString()} / ${plan.requestedBudget.toLocaleString()} tokens allocated`;
  const steps = plan.steps.map((step, index) => {
    const article = document.createElement('article'); article.className = 'plan-step';
    article.innerHTML = '<div class="plan-index"></div><div class="plan-copy"><strong></strong><p></p><div class="plan-skills"></div></div><div class="plan-budget"></div>';
    article.querySelector('.plan-index').textContent = String(index + 1).padStart(2, '0'); article.querySelector('.plan-copy strong').textContent = `${step.name} · ${phaseLabels[step.phase] || step.phase}`; article.querySelector('.plan-copy p').textContent = step.reason; article.querySelector('.plan-budget').textContent = `${step.budget.toLocaleString()} tokens`;
    const skills = article.querySelector('.plan-skills');
    [...step.skills, ...(step.mcp || []).map(id => `MCP: ${id}`), ...(step.plugins || []).map(id => `Plugin: ${id}`)].forEach(id => { const span = document.createElement('span'); span.textContent = state.config.skills.find(skill => skill.id === id)?.name || id; skills.append(span); });
    if (step.approval) { const label = document.createElement('label'); label.className = 'approval-check'; const input = document.createElement('input'); input.type = 'checkbox'; input.checked = state.approvedAgents.has(step.id); input.addEventListener('change', () => input.checked ? state.approvedAgents.add(step.id) : state.approvedAgents.delete(step.id)); label.append(input, document.createTextNode(' Approve this agent')); article.querySelector('.plan-copy').append(label); }
    return article;
  });
  const dormant = document.createElement('p'); dormant.className = 'dormant-note'; dormant.textContent = `${plan.dormant.length} dormant: ${plan.dormant.join(', ') || 'none'}`;
  // What the loadout itself contributes, shown rather than implied. The brief and the
  // avoid-list are sent ahead of every capability; before B1 they were sent nowhere, and the
  // only way to know either way was to read the server.
  const contextBlock = document.createElement('details');
  contextBlock.className = 'plan-context';
  const contextSummary = document.createElement('summary');
  contextSummary.textContent = plan.context
    ? 'Loadout context sent ahead of every capability' + (plan.designDna ? ` · ${plan.designDna.avoidCount} hard constraints` : '')
    : 'This loadout adds no context of its own';
  contextBlock.append(contextSummary);
  if (plan.context) {
    const body = document.createElement('pre');
    body.textContent = plan.context;
    contextBlock.append(body);
  } else {
    const note = document.createElement('p');
    note.textContent = 'No brief and no Design DNA are attached, so only the eight decisions change what this run does.';
    contextBlock.append(note);
  }
  host.replaceChildren(summary, ...steps, contextBlock, dormant);
}

async function askOracle(planOnly) {
  const prompt = $('#oracle-prompt').value.trim(); if (prompt.length < 3) { $('#oracle-prompt').focus(); return; }
  const button = planOnly ? $('#oracle-plan') : $('#oracle-run'); button.disabled = true; const original = button.textContent; button.textContent = planOnly ? 'Planning…' : 'Running…';
  if (!planOnly) { state.oracleMessages.push({ role: 'user', text: prompt }); renderOracleMessages(); }
  try {
    const body = { prompt, projectId: state.work.activeProjectId, budget: Number($('#oracle-budget').value), model: $('#oracle-model').value, mode: state.config.mode, approvedAgentIds: [...state.approvedAgents] };
    const result = await api(planOnly ? '/api/oracle/plan' : '/api/oracle/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    state.oraclePlan = result.plan; storage.write('convenium-design-oracle-plan', state.oraclePlan); renderOraclePlan();
    if (!planOnly) { state.oracleMessages.push({ role: 'assistant', text: result.answer }); storage.write('convenium-design-oracle-messages', state.oracleMessages.slice(-40)); renderOracleMessages(); }
    await refreshEvents();
  } catch (error) { if (!planOnly) { state.oracleMessages.push({ role: 'assistant', text: `Oracle could not complete the run: ${error.message}` }); renderOracleMessages(); } else alert(error.message); }
  finally { button.disabled = false; button.textContent = original; }
}

function renderIntegrations() {
  const host = $('#integration-list'); if (!host) return;
  host.replaceChildren(...state.integrations.map(item => {
    const article = document.createElement('article'); article.className = `integration-row ${item.detected || item.mcpConfigured ? 'is-detected' : ''}`; article.innerHTML = '<div><strong></strong><span></span></div><p></p>'; article.querySelector('strong').textContent = item.name; article.querySelector('span').textContent = item.mode.replaceAll('-', ' '); article.querySelector('p').textContent = item.detail; return article;
  }));
}

function renderHostEvents() {
  const host = $('#host-event-list'); if (!host) return;
  const empty = $('#oracle-events-empty');
  if (empty) empty.hidden = state.events.length > 0;
  if (!state.events.length) { host.replaceChildren(); return; }
  host.replaceChildren(...state.events.map(event => {
    const article = document.createElement('article'); article.className = `host-event host-${event.host}`;
    article.innerHTML = '<div><strong></strong><span></span></div><p></p><time></time>';
    article.querySelector('strong').textContent = event.host;
    article.querySelector('span').textContent = event.kind.replaceAll('.', ' ');
    article.querySelector('p').textContent = event.summary;
    const time = article.querySelector('time'); time.dateTime = event.createdAt; time.textContent = new Date(event.createdAt).toLocaleString();
    return article;
  }));
}

async function refreshEvents() {
  try {
    state.events = (await api('/api/events?limit=200')).events;
    state.eventsError = null;
  } catch (error) {
    state.eventsError = error.message || 'The local event endpoint did not respond.';
  }
  renderHostEvents();
  renderHistory();
  renderTransport();
}

// Three modes, and the badge says which one is true rather than which one is hoped for.
// "Live API ready" used to appear whenever a key existed, with nothing checking that the key
// worked or that the configured model ids resolve.
function setRuntime(mode) {
  const detail = state.config?.modeDetail || '';
  const stateEl = $('.runtime-state');
  stateEl.classList.remove('is-live', 'is-demo', 'is-error');
  stateEl.classList.add(mode === 'live' ? 'is-live' : mode === 'live-unverified' ? 'is-error' : 'is-demo');
  const label = mode === 'live' ? 'Live API verified' : mode === 'live-unverified' ? 'Live, unverified' : 'Demo mode';
  $('#runtime-label').textContent = label;
  $('#runtime-label').title = detail;
  const playground = mode === 'live'
    ? 'Live OpenAI Responses mode. Runs may incur API usage.'
    : mode === 'live-unverified'
      ? 'A key is present but the configured models are not confirmed. ' + detail + ' A live run may fail.'
      : 'Demo mode validates routing without sending data or consuming API tokens.';
  $('#playground-mode').textContent = playground;
  $('#oracle-mode').textContent = mode === 'live'
    ? 'Live OpenAI API execution. Plan-only remains local.'
    : mode === 'live-unverified'
      ? 'A key is present but unverified. Plan-only is local and always works.'
      : 'Demo execution. Plan-only is fully functional and consumes zero tokens.';
}

function bindRovingToolbar(toolbar) {
  const items = [...toolbar.querySelectorAll('button:not([disabled])')];
  items.forEach((button, index) => {
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('focus', () => items.forEach(item => item.tabIndex = item === button ? 0 : -1));
    button.addEventListener('keydown', event => {
      const current = items.indexOf(event.currentTarget);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowRight' ? (current + 1) % items.length : event.key === 'ArrowLeft' ? (current - 1 + items.length) % items.length : -1;
      if (next < 0) return;
      event.preventDefault(); items[next].focus();
    });
  });
}

async function saveSelectedLoadout(event) {
  event.preventDefault();
  const loadout = selectedLoadout();
  const form = $('#loadout-form');
  const feedback = $('#loadout-feedback');
  if (!state.loadoutDrafts.has(loadout.id)) {
    feedback.textContent = 'Nothing to save — this loadout matches what is stored.';
    return;
  }
  feedback.textContent = 'Saving…';
  try {
    await api(`/api/loadouts/${loadout.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.elements.name.value,
        description: form.elements.description.value,
        slots: readSlotSelections(),
        designDna: loadout.designDna || '',
        // fields below come from the form, which is the draft when one exists
        brief: $('#loadout-brief').value,
        tools: { mcp: $$('#loadout-tools input:checked').map(input => input.dataset.toolId), plugins: loadout.tools.plugins },
        budget: {
          totalTokens: Number($('#loadout-budget').value) || loadout.budget.totalTokens,
          approvals: Object.fromEntries($$('#approval-list input').map(input => [input.dataset.approvalFor, input.checked]))
        }
      })
    });
    state.loadoutDrafts.delete(loadout.id);
    await refreshLoadouts(loadout.id);
  } catch (error) { feedback.textContent = error.message; }
}

async function createNewLoadout(sourceLoadoutId) {
  try {
    const result = await api('/api/loadouts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sourceLoadoutId ? { sourceLoadoutId } : {})
    });
    await refreshLoadouts(result.loadout.id);
    navigate('systems');
    $('#loadout-form').elements.name.focus();
    $('#loadout-form').elements.name.select();
  } catch (error) { $('#loadout-feedback').textContent = error.message; }
}

// Undo, not a confirmation dialog. DESIGN.md's Undo Rule is explicit that a dialog asking
// "are you sure" is not an undo: it makes the user decide before they can see the result.
// The delete happens, and the way back stays on screen until the next action.
function offerUndo(message, restore) {
  const host = $('#undo-bar');
  if (!host) return;
  host.hidden = false;
  host.querySelector('.undo-message').textContent = message;
  const button = host.querySelector('.undo-action');
  const clone = button.cloneNode(true);
  button.replaceWith(clone);
  clone.addEventListener('click', async () => {
    host.hidden = true;
    await restore();
  });
}

function dismissUndo() {
  const host = $('#undo-bar');
  if (host) host.hidden = true;
}

function bindEvents() {
  $$('[data-view-target]').forEach(button => button.addEventListener('click', event => navigate(button.dataset.viewTarget, { animate: event.detail !== 0 })));
  $$('.workflow-node').forEach(bindGraphNode);
  bindRovingToolbar($('.node-tools'));
  $('#auto-layout').addEventListener('click', event => autoLayoutGraph(event.detail !== 0));
  $('#reset-layout').addEventListener('click', () => {
    const previous = { positions: structuredClone(graphPositions), phases: structuredClone(graphPhases) };
    resetGraph();
    offerUndo('Reset the map layout.', () => {
      graphPositions = previous.positions; graphPhases = previous.phases;
      persistGraph(); applyGraphPositions(); drawConnections();
    });
  });
  $('#toggle-oracle').addEventListener('click', () => toggleOracle()); $('#close-oracle').addEventListener('click', () => {
    // The dock's close button lives inside the dock, so it is only reachable when the dock is
    // open - except to a keyboard or a script. Say so rather than doing nothing.
    if ($('#oracle-dock').getAttribute('aria-hidden') === 'true') { $('#toggle-oracle').focus(); return; }
    toggleOracle(false);
  });
  $('#oracle-show-how').addEventListener('click', showMeHow);
  $('#oracle-do-it').addEventListener('click', doItForMe);
  $('#oracle-text-mode').addEventListener('click', () => { $('#oracle-text-mode').setAttribute('aria-pressed', 'true'); $('#oracle-context-input').focus(); });
  $('#new-project').addEventListener('click', async () => { try { const created = await api('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }); state.work.projects = (await api('/api/workspace')).projects; await selectWorkChat(created.project.id, created.chat.id); $('#work-prompt').focus(); } catch (error) { $('#work-status').textContent = error.message; } });
  $('#new-chat').addEventListener('click', async () => { const project = workProject(); if (!project) return; try { const chat = await api(`/api/projects/${project.id}/chats`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }); state.work.projects = (await api('/api/workspace')).projects; await selectWorkChat(project.id, chat.id); } catch (error) { $('#work-status').textContent = error.message; } });
  $('#work-empty-action').addEventListener('click', () => $('#work-prompt').focus());
  $('#work-composer').addEventListener('focusin', () => $('#work-composer').scrollIntoView({ block: 'nearest', behavior: 'instant' }));
  $('#work-composer').addEventListener('submit', async event => {
    event.preventDefault();
    const input = $('#work-prompt');
    const prompt = input.value.trim();
    if (!prompt) {
      $('#work-status').textContent = 'Write a message first.';
      input.focus();
      return;
    }
    const error = $('#work-error');
    error.hidden = true;
    const draft = prompt;
    const originChatId=workChat()?.id;
    try {
      await sendWorkMessage('user', prompt, originChatId);
      if(state.work.activeChatId===originChatId){input.value = '';$('#work-status').textContent = 'Preparing local demo response…';}
      window.setTimeout(async () => {
        try {
          await sendWorkMessage('assistant', 'Demo response: I can turn this into a reviewed plan, keep the project context visible, and route any mutation through Oracle for your approval.', originChatId);
          if(state.work.activeChatId===originChatId)$('#work-status').textContent = 'Demo responses stay local';
        } catch (replyError) { if(state.work.activeChatId===originChatId)showWorkError(replyError, draft); }
      }, 180);
    } catch (sendError) { if(state.work.activeChatId===originChatId)showWorkError(sendError, draft); }
  });
  $('#work-prompt').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#work-composer').requestSubmit(); } });
  $('#work-context').addEventListener('click', () => { workspaceSurfaces.open($('#work-inspector'), $('#work-context')); $('#work-context').setAttribute('aria-expanded','true'); });
  $('#close-context').addEventListener('click', () => { workspaceSurfaces.close(); $('#work-context').setAttribute('aria-expanded','false'); });
  $('#workspace-open').addEventListener('click', () => workspaceSurfaces.open($('.project-sidebar'), $('#workspace-open')));
  $('#workspace-close').addEventListener('click', () => workspaceSurfaces.close());
  $('#workspace-project').addEventListener('change', event => { const p=state.work.projects.find(p=>p.id===event.target.value); selectWorkChat(p.id,p.chats[0]?.id); });
  $('.attachment-button').addEventListener('click', () => $('#work-file-picker').click());
  $('#work-file-picker').addEventListener('change', async event => { const chat = workChat(); const files = [...event.target.files]; if (!chat || !files.length) return; try { for (const file of files) await api(`/api/chats/${chat.id}/attachments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: file.name, size: file.size, type: file.type }) }); state.work.detail = await api(`/api/chats/${chat.id}`); renderWork(); $('#work-status').textContent = `${files.length} local reference${files.length === 1 ? '' : 's'} linked`; } catch (error) { $('#work-status').textContent = error.message; } finally { event.target.value = ''; } });
  $('#proposal-dialog').addEventListener('close', async event => { const dialog = event.currentTarget; const approved = dialog.returnValue === 'approve'; const proposalId = dialog.dataset.proposalId; if (!proposalId) return; try { await api(`/api/proposals/${proposalId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ approved }) }); const operation = JSON.parse(dialog.dataset.operation || 'null'); if (approved && operation?.type === 'activate-loadout') {
        await api('/api/loadouts/active', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: operation.loadoutId }) });
        await refreshLoadouts(operation.loadoutId);
        $('#work-status').textContent = operation.name + ' is now the active loadout.';
        if (operation.previousId) offerUndo('Activated ' + operation.name + '.', async () => {
          await api('/api/loadouts/active', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: operation.previousId }) });
          await refreshLoadouts(operation.previousId);
        });
      } else if (approved && operation?.type === 'plan-chat') {
        const planned = await api('/api/oracle/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: operation.prompt, projectId: operation.projectId, budget: state.loadouts?.loadouts.find(item => item.id === state.loadouts.activeLoadoutId)?.budget?.totalTokens || 30000 }) });
        state.oraclePlan = planned.plan; renderOraclePlan();
        const route = planned.plan.steps.map((step, index) => `${String(index + 1).padStart(2, '0')}  ${step.name} — ${step.skills.join(', ')} (${step.budget.toLocaleString()} tokens)`).join('\n');
        await sendWorkMessage('assistant', `Planned route for “${operation.prompt.slice(0, 80)}”\n\n${route}\n\nDormant: ${planned.plan.dormant.join(', ') || 'none'}.\nNo tokens were spent — this is the plan, not the answer.`, operation.chatId);
        $('#work-status').textContent = 'Plan recorded in this chat. Nothing was executed.';
      } else if (approved && operation?.type === 'unlink-attachment') { await api(`/api/chats/${operation.chatId}/attachments/${operation.attachmentId}`, { method: 'DELETE' }); state.work.detail = await api(`/api/chats/${operation.chatId}`); renderWork(); $('#work-status').textContent = 'Attachment unlinked. Source file was not changed.'; offerUndo(`Unlinked “${operation.name}”.`, async () => { await api(`/api/chats/${operation.chatId}/attachments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: operation.name, size: operation.size, type: operation.fileType }) }); state.work.detail = await api(`/api/chats/${operation.chatId}`); renderWork(); $('#work-status').textContent = 'Attachment re-linked.'; }); } else if (!approved) $('#work-status').textContent = 'Change cancelled. Nothing was persisted.'; } catch (error) { $('#work-status').textContent = error.message; } finally { delete dialog.dataset.proposalId; delete dialog.dataset.operation; } });
  $('#project-search').addEventListener('input', event => $$('.project-item').forEach(item => item.hidden = !item.textContent.toLowerCase().includes(event.target.value.trim().toLowerCase())));
  $('#phase-filter').addEventListener('change', () => {
    const phase = $('#phase-filter').value;
    $$('.workflow-node').forEach(node => node.style.opacity = phase === 'all' || node.dataset.phase === phase || node.dataset.phase === 'all' ? '1' : '.3');
    $$('.agent-lane').forEach(lane => lane.style.opacity = phase === 'all' || lane.dataset.phase === phase ? '1' : '.28');
    drawConnections();
  });
  $('#skill-search').addEventListener('input', filterSkills);
  $('#skill-phase-filter').addEventListener('change', filterSkills);
  $('#knowledge-search').addEventListener('input', renderKnowledge);
  $('#agent-search').addEventListener('input', renderAgents);
  $('#agent-category').addEventListener('change', renderAgents);
  $('#show-add-skill').addEventListener('click', () => { $('#add-skill-form').classList.remove('is-hidden'); $('#add-skill-form').elements.name.focus(); });
  $('#cancel-add-skill').addEventListener('click', () => $('#add-skill-form').classList.add('is-hidden'));
  $('#add-skill-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const status = $('#add-skill-status'); status.textContent = 'Creating folder…';
    try {
      const created = await api('/api/knowledge/skills', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.elements.name.value, category: form.elements.category.value, phase: form.elements.phase.value, description: form.elements.description.value, runtimePrompt: form.elements.runtimePrompt.value }) });
      form.reset(); form.classList.add('is-hidden'); state.knowledgeCategory = created.group; await refreshKnowledge(created.id);
    } catch (error) { status.textContent = error.message; }
  });
  $('#oracle-plan').addEventListener('click', () => askOracle(true));
  $('#oracle-form').addEventListener('submit', event => { event.preventDefault(); askOracle(false); });
  $('#oracle-clear').addEventListener('click', () => {
    const previous = { messages: state.oracleMessages, plan: state.oraclePlan, approved: new Set(state.approvedAgents) };
    state.oracleMessages = []; state.oraclePlan = null; state.approvedAgents.clear();
    storage.write('convenium-design-oracle-messages', []); storage.write('convenium-design-oracle-plan', null);
    renderOracleMessages(); renderOraclePlan();
    offerUndo('Cleared the Oracle conversation.', () => {
      state.oracleMessages = previous.messages; state.oraclePlan = previous.plan; state.approvedAgents = previous.approved;
      storage.write('convenium-design-oracle-messages', previous.messages); storage.write('convenium-design-oracle-plan', previous.plan);
      renderOracleMessages(); renderOraclePlan();
    });
  });
  // Refresh with nothing new looked identical to Refresh being broken.
  const announceRefresh = async (target, label) => {
    const before = state.events.length;
    await refreshEvents();
    const gained = state.events.length - before;
    const host = $(target);
    if (host) host.textContent = gained > 0
      ? gained + ' new ' + label + (gained === 1 ? '' : 's') + '.'
      : 'Up to date — no new ' + label + 's.';
  };
  $('#refresh-events').addEventListener('click', () => announceRefresh('#oracle-mode', 'event'));
  $('#refresh-runs').addEventListener('click', async () => {
    const before = state.runs.length + connectedRunsFromEvents().length;
    await refreshEvents();
    await refreshRuns();
    const after = state.runs.length + connectedRunsFromEvents().length;
    setRunsNote(after > before ? (after - before) + ' new run' + (after - before === 1 ? '' : 's') + '.' : 'Up to date — no new runs.');
  });
  $('#reset-skills').addEventListener('click', () => {
    const previous = new Set(state.activeSkills);
    state.activeSkills = new Set(state.config.skills.filter(skill => skill.defaultOn).map(skill => skill.id));
    renderSkillRegistry();
    offerUndo('Reset the skill registry to its defaults.', () => {
      state.activeSkills = previous;
      renderSkillRegistry();
    });
  });
  $('#add-variant').addEventListener('click', () => { if (state.variants.length < 3) { state.variants.push(createVariant('Setup C', state.loadouts?.loadouts[2]?.id)); renderVariants(); } });
  $('#run-comparison').addEventListener('click', runComparison);
  $('#run-scale').addEventListener('change', event => {
    const values = { pilot: 700, standard: 1600, full: 3000 }; const labels = { pilot: 'Run pilot comparison', standard: 'Run standard comparison', full: 'Run full comparison' };
    $('#max-output').value = values[event.target.value]; setCommandLabel($('#run-comparison'), labels[event.target.value]); setComparisonState('idle');
    $('#run-message').textContent = event.target.value === 'pilot' ? 'Pilot mode limits cost before full implementation.' : event.target.value === 'standard' ? 'Standard mode gives each setup more room.' : 'Full-plan mode uses the largest test budget.';
  });
  $('#experiment-prompt').addEventListener('input', () => $('#prompt-length').textContent = `${$('#experiment-prompt').value.length.toLocaleString()} / 20,000`);
  $('#clear-prompt').addEventListener('click', () => {
    const previous = $('#experiment-prompt').value;
    if (!previous) return;
    $('#experiment-prompt').value = '';
    $('#experiment-prompt').dispatchEvent(new Event('input', { bubbles: true }));
    offerUndo('Cleared the task.', () => {
      $('#experiment-prompt').value = previous;
      $('#experiment-prompt').dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  $('#export-runs').addEventListener('click', exportRuns);
  // A confirmation dialog is not an undo: it asks before you can see the result. The clear
  // happens, and the way back stays on screen.
  $('#clear-runs').addEventListener('click', async () => {
    if (!state.runs.length) { setRunsNote('Nothing to clear — no runs are stored in this workspace.'); return; }
    try {
      const { removed } = await api('/api/runs', { method: 'DELETE' });
      await refreshRuns();
      setRunsNote('Cleared ' + removed.length + ' run' + (removed.length === 1 ? '' : 's') + '.');
      offerUndo('Cleared ' + removed.length + ' local run' + (removed.length === 1 ? '' : 's') + '. Connected MCP runs were untouched.', async () => {
        await api('/api/runs/restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ runs: removed }) });
        await refreshRuns();
      });
    } catch (error) { $('#run-message').textContent = error.message; }
  });
  $('#loadout-form').addEventListener('submit', saveSelectedLoadout);
  $('#new-loadout').addEventListener('click', () => createNewLoadout());
  $('#loadout-empty-action').addEventListener('click', () => createNewLoadout());
  $('#duplicate-loadout').addEventListener('click', () => createNewLoadout(selectedLoadout()?.id));
  $('#activate-loadout').addEventListener('click', async () => {
    const loadout = selectedLoadout();
    try {
      await api('/api/loadouts/active', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: loadout.id }) });
      await refreshLoadouts(loadout.id);
    } catch (error) { $('#loadout-feedback').textContent = error.message; }
  });
  $('#delete-loadout').addEventListener('click', async () => {
    const loadout = selectedLoadout();
    try {
      const result = await api('/api/loadouts/' + loadout.id, { method: 'DELETE' });
      await refreshLoadouts(result.activeLoadoutId);
      offerUndo('Deleted the loadout ' + result.removed.name + '.', async () => {
        await api('/api/loadouts/restore', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ loadout: result.removed, restoreIndex: result.restoreIndex })
        });
        await refreshLoadouts(result.removed.id);
      });
    } catch (error) { $('#loadout-feedback').textContent = error.message; }
  });
  $('#loadout-brief').addEventListener('input', markLoadoutDirty);
  $('#loadout-budget').addEventListener('input', event => {
    $('#budget-translation').textContent = describeBudget(Number(event.target.value) || 0);
    markLoadoutDirty();
  });
  $('#architecture-empty-action').addEventListener('click', () => refreshSystems());
  $('#agents-empty-action').addEventListener('click', () => { $('#agent-category').value = 'all'; renderAgents(); });
  $('#knowledge-empty-action').addEventListener('click', () => {
    $('#knowledge-search').value = '';
    state.knowledgeCategory = 'all';
    renderKnowledge();
  });
  $('#results-empty-action').addEventListener('click', () => $('#run-comparison').click());
  $('#experiment-prompt').addEventListener('input', () => renderPlaygroundSteps('idle'));
  // The two shortcuts the chrome advertises. A <kbd> hint for a handler that does not exist
  // is the interface telling the user something untrue.
  const shortcutGlyph = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? 'Cmd' : 'Ctrl';
  const oracleHint = $('#oracle-shortcut');
  const searchHint = $('#search-shortcut');
  if (oracleHint) oracleHint.textContent = shortcutGlyph + ' K';
  if (searchHint) searchHint.textContent = shortcutGlyph + ' /';
  window.addEventListener('keydown', event => {
    const modifier = event.metaKey || event.ctrlKey;
    if (!modifier) return;
    if (event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggleOracle();
    } else if (event.key === '/') {
      event.preventDefault();
      navigate('work');
      requestAnimationFrame(() => $('#project-search')?.focus());
    }
  });
  $('#undo-dismiss').addEventListener('click', dismissUndo);
  const observer = new ResizeObserver(() => requestAnimationFrame(drawConnections)); observer.observe($('#workflow-canvas'));
  window.addEventListener('resize', drawConnections, { passive: true });
}

async function init() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Configuration endpoint unavailable.');
    state.config = await response.json();
    const [knowledge, agents, integrationData, eventData, systemsData, loadoutData, dnaData] = await Promise.all([api('/api/knowledge'), api('/api/agents'), api('/api/integrations'), api('/api/events?limit=200'), api('/api/systems'), api('/api/loadouts'), api('/api/design-dna')]);
    state.knowledge = knowledge; state.agents = agents.agents; state.integrations = integrationData.integrations;
    state.events = eventData.events;
    state.systems = systemsData;
    state.loadouts = loadoutData; state.selectedLoadoutId = loadoutData.activeLoadoutId;
    state.designDna = dnaData;
    state.selectedSkillId = knowledge.skills[0]?.id || null;
    state.oracleMessages = storage.read('convenium-design-oracle-messages', []);
    state.oraclePlan = storage.read('convenium-design-oracle-plan', null);
    const stored = storage.read('convenium-design-active-skills', null);
    const storedVersion = storage.read('convenium-design-active-skills-version', 0);
    const configuredIds = new Set(state.config.skills.map(skill => skill.id));
    const defaults = state.config.skills.filter(skill => skill.defaultOn).map(skill => skill.id);
    state.activeSkills = new Set(stored && storedVersion >= skillDefaultsVersion ? stored.filter(id => configuredIds.has(id)) : defaults);
    // No longer read from localStorage: the store is server-side. The old key is left in
    // place rather than deleted, so a person who had runs there can still find them in
    // devtools until they clear it themselves.
    state.runs = [];
    await refreshWork({ preserve: false });
    await refreshRuns();
    state.variants = [createVariant('Setup A', loadoutData.loadouts[0]?.id), createVariant('Setup B', loadoutData.loadouts[1]?.id || loadoutData.loadouts[0]?.id)];
    $('#model-select').innerHTML = state.config.models.map(model => `<option value="${model}"${model === 'gpt-5.6-terra' ? ' selected' : ''}>${model}</option>`).join('');
    $('#oracle-model').innerHTML = state.config.models.map(model => `<option value="${model}"${model === 'gpt-5.6-terra' ? ' selected' : ''}>${model}</option>`).join('');
    $('#integration-recommendation').textContent = integrationData.recommendation;
    restoreGraphNodes(); applyGraphPositions();
    renderSkillRegistry(); renderTools(); renderVariants(); renderAgents(); renderSystems(); renderArchitectureAgents(); renderKnowledge(); renderOracleMessages(); renderIntegrations(); renderHostEvents(); renderTransport(); setRuntime(state.config.mode); bindEvents(); refreshIcons(); initMotionPreferences(); setComparisonState('idle');
    updateRunCount();
    $('#experiment-prompt').dispatchEvent(new Event('input'));
    await mountWorkflowViews();
    journeyUI=createJourneyUI({navigate:target=>shell.navigate(target),closeSurfaces:()=>{workspaceSurfaces.close(false);toggleOracle(false);},onState:(projectId,journey)=>{
      const project=state.work.projects.find(p=>p.id===projectId);if(!project)return;
      const approved=gate=>journey.approvals.some(a=>a.gate===gate&&a.status==='approved');
      project.stage=approved('C')?'Continue':journey.artifacts.some(a=>a.kind==='output')?'Results review':approved('B')?'Execution approved':journey.artifacts.some(a=>a.kind==='plan')?'Configure and test':approved('A')?'Master Plan':'Intake';
      project.nextAction=approved('C')?'Choose the next goal':journey.artifacts.some(a=>a.kind==='output')?'Review output and fixture checks':approved('B')?'Review local fixture execution':journey.artifacts.some(a=>a.kind==='plan')?'Test configuration and approve execution':approved('A')?'Commit the plan and numeric design':'Describe or confirm the project goal';
      shell.refresh();
    }});
    shell.ready();
    requestAnimationFrame(drawConnections);
    window.setInterval(() => { if (state.view === 'oracle' || state.view === 'runs') refreshEvents(); }, 5000);
  } catch (error) {
    $('.runtime-state').classList.add('is-error'); $('#runtime-label').textContent = 'Runtime unavailable';
<<<<<<<< HEAD:convenium-design-studio/public/legacy/app.js
    shell.fail(error);
========
    document.querySelector('main').innerHTML = `<div class="empty-state"><h1>Convenium.Design Studio could not start.</h1><p>${error.message}</p><p>Run the local server, then reload this page.</p></div>`;
>>>>>>>> origin/main:convenium-design-studio/public/app.js
  }
}

const shell = createShell({
  snapshot: () => ({ projects: state.work.projects, activeProjectId: state.work.activeProjectId, activeChatId: state.work.activeChatId, config: state.config, runs: state.runs }),
  renderLegacy: renderLegacyView,
  selectProject: async (projectId, chatId) => {
    const project = state.work.projects.find(item => item.id === projectId);
    if (project?.chats?.length && (!chatId || project.chats.some(c=>c.id===chatId))) await selectWorkChat(project.id, chatId || project.chats[0].id, { navigateToWork: false });
    else { state.work.activeProjectId = projectId; state.work.activeChatId = null; state.work.detail = null; shell.refresh(); }
  },
  openOracle: toggleOracle,
  createProject: () => $('#new-project').click(),
  updateOracleContext,
  renderJourney:(route,project)=>journeyUI?.render(route,project),
});
const workspaceSurfaces = createWorkspaceSurfaces({ closeOracle: () => toggleOracle(false) });
document.addEventListener('apollo:surface-open',event=>{if(event.detail.owner!=='oracle' && $('#oracle-dock').getAttribute('aria-hidden')==='false')toggleOracle(false);});
init();


