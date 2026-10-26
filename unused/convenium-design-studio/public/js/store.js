// Client state. Real Convenium.Design data comes from the server; the Northstar walkthrough session
// (intake answers, approvals, run progress) is a clearly labelled demo kept in localStorage.
import { api } from './api.js';
import { STAGES, INTAKE, DNA } from './fixtures/northstar.js';

const SESSION_KEY = 'apollo.v2.session';
const listeners = new Set();

const defaultSession = () => ({
  projectId: 'northstar',
  goal: null,
  intake: { answers: {}, notes: {} },
  briefApproved: false,
  planApproved: false,
  configApplied: false,
  configDraft: null,       // { slots: {slotId: skill}, roles: {agentId: {budget, approval, enabled}} }
  draftLoadoutId: null,
  baseLoadoutId: null,
  comparison: null,
  run: { status: 'idle', task: 0 },
  resultApproved: false,
  dna: Object.fromEntries(DNA.map(d => [d.id, d.value])),
  tours: {},
});

function readSession() {
  try { return { ...defaultSession(), ...JSON.parse(localStorage.getItem(SESSION_KEY) || '{}') }; }
  catch { return defaultSession(); }
}

export const store = {
  data: { config: null, health: null, agents: [], loadouts: null, knowledge: null, workspace: null, runs: [], integrations: [], events: [], plan: null },
  session: readSession(),
  online: true,
  loading: true,
  error: null,
};

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() { for (const fn of listeners) fn(store); }

export function saveSession(patch = {}) {
  store.session = { ...store.session, ...patch };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(store.session)); } catch { /* private mode: session stays in memory */ }
  emit();
}
export function resetSession() { store.session = defaultSession(); try { localStorage.removeItem(SESSION_KEY); } catch {} emit(); }

export async function loadAll() {
  store.loading = true;
  const settle = async (key, fn, map = x => x) => {
    try { store.data[key] = map(await fn()); }
    catch (error) { store.error = error.message; }
  };
  await Promise.all([
    settle('config', api.config),
    settle('health', api.health),
    settle('agents', api.agents, r => r.agents || []),
    settle('loadouts', api.loadouts),
    settle('knowledge', api.knowledge),
    settle('workspace', api.workspace),
    settle('runs', api.runs, r => r.runs || []),
    settle('integrations', api.integrations, r => r.integrations || []),
  ]);
  store.online = Boolean(store.data.health);
  store.loading = false;
  emit();
  refreshPlan();
}

export async function refreshPlan() {
  const loadoutId = store.data.loadouts?.activeLoadoutId;
  try { store.data.plan = (await api.plan('Northstar brand and website: plan, build and run AI agents for real work', loadoutId)).plan; emit(); }
  catch { /* plan preview is optional */ }
}

export async function refreshAgents() { store.data.agents = (await api.agents()).agents; emit(); }
export async function refreshLoadouts() { store.data.loadouts = await api.loadouts(); emit(); refreshPlan(); }

/* ---------- Derived selectors ---------- */

export const skills = () => store.data.config?.skills || store.data.knowledge?.skills || [];
export const skillById = id => skills().find(s => s.id === id);
export const skillName = id => skillById(id)?.name || id;
export const slots = () => store.data.loadouts?.slots || [];
export const activeLoadout = () => store.data.loadouts?.loadouts?.find(l => l.id === store.data.loadouts.activeLoadoutId) || null;
export const workflow = () => store.data.plan?.workflow || null;
export const phases = () => workflow()?.phases || [];
export const mode = () => store.data.health?.mode || (store.online ? 'unknown' : 'offline');

export function intakeProgress() {
  const answered = INTAKE.filter(q => store.session.intake.answers[q.id]).length;
  return { answered, total: INTAKE.length, current: INTAKE.find(q => !store.session.intake.answers[q.id]) || null };
}

// Display stage index 0..4 and status of each stage, derived only from recorded session steps.
export function stageStates() {
  const s = store.session;
  const intakeDone = intakeProgress().answered === INTAKE.length;
  const done = [intakeDone, s.briefApproved, s.planApproved, s.configApplied, s.resultApproved];
  let current = done.findIndex(d => !d);
  if (current === -1) current = STAGES.length;
  return STAGES.map((stage, i) => {
    let status = 'locked';
    if (done[i]) status = i === 1 ? 'approved' : 'completed';
    else if (i === current) status = i === 2 ? 'ready' : i === 4 && s.run.status !== 'idle' ? 'running' : 'active';
    else if (i === current + 1) status = 'pending';
    return { ...stage, status, index: i };
  });
}
export function currentStage() {
  const states = stageStates();
  return states.find(s => !['completed', 'approved'].includes(s.status)) || states[states.length - 1];
}
export function stageProgress() { return stageStates().filter(s => ['completed', 'approved'].includes(s.status)).length; }

// The next mandatory action, phrased the way Home's "Your next action" card shows it.
export function nextAction() {
  const s = store.session; const p = intakeProgress();
  if (!s.goal && p.answered === 0) return { title: 'Share your initial idea', text: "Tell me what you're building and who it's for.", cta: 'Start with Oracle', href: '#/projects/northstar/intake' };
  if (p.current) return { title: `Answer question ${p.answered + 1} of ${p.total}`, text: p.current.q, cta: 'Continue intake', href: '#/projects/northstar/intake' };
  if (!s.briefApproved) return { title: 'Approve the brief', text: 'Review what Convenium.Design believes about the project.', cta: 'Review brief', href: '#/projects/northstar/brief' };
  if (!s.planApproved) return { title: 'Review the master plan', text: 'Stages, owners, gates and decisions.', cta: 'Review plan', href: '#/plan' };
  if (!s.configApplied) return { title: 'Configure and test your team', text: 'Change agents or skills, then compare in Playground.', cta: 'Configure', href: '#/plan/configure' };
  if (s.run.status !== 'complete') return { title: 'Run the build', text: 'Watch agents execute the approved plan.', cta: 'Open run', href: '#/work/0248' };
  if (!s.resultApproved) return { title: 'Review the result', text: 'Gate C — your acceptance is required.', cta: 'Open results', href: '#/results/0248' };
  return { title: 'Delivered', text: 'Choose the next step or start a new goal.', cta: 'New goal', href: '#/home' };
}

// Agents in display order: Oracle (front door) followed by the six real workflow roles.
export function agentRoster() {
  const real = store.data.agents || [];
  const order = ['design-director', 'visual-analyst', 'asset-producer', 'design-engineer', 'independent-critic', 'analytics-specialist'];
  const sorted = order.map(id => real.find(a => a.id === id)).filter(Boolean);
  const oracle = { id: 'oracle', name: 'Oracle', responsibility: 'Strategic intake & run configuration', skills: ['olympus-design-director'], activation: 'always', readOnly: false, frontDoor: true, enabled: true, budget: null, approval: true };
  return [oracle, ...sorted];
}

// Which skills an agent carries under the active loadout (or a draft), using the plan's view
// of the workflow where possible and the role's base inventory otherwise.
export function agentSkills(agentId, slotOverrides = null) {
  const agent = (store.data.agents || []).find(a => a.id === agentId);
  if (!agent) return agentId === 'oracle' ? ['olympus-design-director', 'convenium-design-taste-interview'] : [];
  const owned = slots().filter(sl => sl.owner === agentId);
  const lo = activeLoadout();
  const chosen = { ...(lo?.slots || {}), ...(slotOverrides || {}) };
  const displaced = new Set(owned.flatMap(sl => sl.candidates.map(c => c.skill)));
  const base = agent.skills.filter(sk => !displaced.has(sk));
  const extra = owned.map(sl => chosen[sl.id] || sl.default).filter(Boolean);
  return [...new Set([...base, ...extra])];
}
