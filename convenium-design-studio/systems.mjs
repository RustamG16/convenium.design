import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentDefinitions } from './agents.mjs';
import { slots as registrySlots, presets } from './skills.mjs';
import { workflow } from './workflow.mjs';
import { dataFile } from './paths.mjs';

const dataPath = dataFile('systems.json');
const slotMap=registrySlots.map(slot=>({...slot,owner:workflow.configurationSlots[slot.id]}));
const apolloRoot = fileURLToPath(new URL('../', import.meta.url));
const phases = new Set(['always', 'diagnose', 'direct', 'prepare', 'build', 'verify']);
const phaseByAgent = {
  'design-director': 'always',
  'visual-analyst': 'diagnose',
  'asset-producer': 'prepare',
  'design-engineer': 'build',
  'independent-critic': 'verify',
  'analytics-specialist': 'verify'
};

const clean = (value, max = 4000) => String(value || '').trim().slice(0, max);
const slug = value => clean(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
const stringList = (value, max = 40) => [...new Set((Array.isArray(value) ? value : []).map(item => clean(item, 100)).filter(Boolean))].slice(0, max);
const now = () => new Date().toISOString();

function defaultAgents() {
  return agentDefinitions.map(agent => ({
    ...agent,
    phase: phaseByAgent[agent.id] || 'prepare',
    mcp: [],
    plugins: [],
    instructions: `Work only within the ${agent.name} responsibility. Return a bounded phase packet to the orchestrator and do not delegate.`,
    enabled: true
  }));
}

function seedSystem() {
  const createdAt = now();
  return {
    id: 'olympus-web-system',
    name: 'Olympus Web System',
    description: 'Evidence-led website design, implementation, and bounded verification.',
    instructions: 'Plan first, activate only relevant specialists, preserve approval gates, and integrate one coherent answer.',
    createdAt,
    updatedAt: createdAt,
    agents: defaultAgents(),
    outputs: [{
      id: 'savra-threshold-ritual',
      name: 'SAVRA — The Threshold Ritual',
      type: 'Responsive website',
      status: 'Gate C pending',
      createdAt: '2026-08-10T23:28:15.190Z',
      runId: 'savra-20260810T225627Z-codex',
      summary: 'Cinematic restaurant concept built from supplied synthetic media.',
      previewPath: 'test_projects/Savra_v2/.impeccable/review/desktop.png'
    }]
  };
}

// ---------------------------------------------------------------------------
// Loadouts.
//
// The pipeline is locked: five agents, their phases, their ownership and the gates between
// them are product truth and are not editable, duplicable or deletable. Everything a user
// can actually change lives in a loadout — eight skill slots, a Design DNA profile, the
// brief, tools and MCP, and budget and approval. That split is what removes the class of
// bug that put an empty untitled system in charge of the app: there is nothing to create
// that could be empty, and the one thing in charge is frozen.
// ---------------------------------------------------------------------------

const PIPELINE_ID = 'olympus-web-system';

const slotDefaults = () => Object.fromEntries(slotMap.map(slot => [slot.id, slot.default]));

const candidateIds = slotId => {
  const slot = slotMap.find(item => item.id === slotId);
  return slot ? slot.candidates.map(candidate => candidate.skill) : [];
};

function normalizeSlots(input = {}, base = slotDefaults()) {
  const out = {};
  for (const slot of slotMap) {
    const proposed = clean(input?.[slot.id], 80);
    const allowed = candidateIds(slot.id);
    out[slot.id] = allowed.includes(proposed)
      ? proposed
      : (allowed.includes(base?.[slot.id]) ? base[slot.id] : slot.default);
  }
  return out;
}

function normalizeLoadout(input = {}, current = {}) {
  const name = clean(input.name ?? current.name, 100) || 'Untitled loadout';
  const budget = input.budget ?? current.budget ?? {};
  return {
    id: current.id || slug(input.id || name) || crypto.randomUUID(),
    name,
    description: clean(input.description ?? current.description, 700),
    slots: normalizeSlots(input.slots ?? current.slots, current.slots || slotDefaults()),
    designDna: clean(input.designDna ?? current.designDna, 120) || null,
    brief: clean(input.brief ?? current.brief, 8000),
    tools: {
      mcp: stringList(input.tools?.mcp ?? current.tools?.mcp),
      plugins: stringList(input.tools?.plugins ?? current.tools?.plugins)
    },
    budget: {
      totalTokens: Math.min(300_000, Math.max(1000, Number(budget.totalTokens) || 30_000)),
      approvals: Object.fromEntries(agentDefinitions.map(agent => [
        agent.id,
        typeof budget.approvals?.[agent.id] === 'boolean' ? budget.approvals[agent.id] : agent.approval
      ]))
    },
    // The escape hatch: anything possible with the flat 84-entry list stays possible.
    advancedSkills: stringList(input.advancedSkills ?? current.advancedSkills, 100),
    seeded: Boolean(current.seeded || input.seeded),
    createdAt: current.createdAt || now(),
    updatedAt: now()
  };
}

// The four shipped presets become four seed loadouts: a preset's skill list is read as
// answers to the eight questions, and any question it did not answer takes the default.
function seedLoadouts() {
  return presets.map(preset => {
    const chosen = new Set(preset.skills);
    const picked = {};
    for (const slot of slotMap) {
      picked[slot.id] = slot.candidates.find(candidate => chosen.has(candidate.skill))?.skill ?? slot.default;
    }
    return normalizeLoadout({
      id: preset.id,
      name: preset.name,
      description: `Migrated from the ${preset.name} preset.`,
      slots: picked,
      seeded: true
    });
  });
}

const emptyStore = () => {
  const loadouts = seedLoadouts();
  return {
    version: 2,
    activeSystemId: PIPELINE_ID,
    systems: [seedSystem()],
    activeLoadoutId: loadouts[0]?.id || null,
    loadouts,
    migrations: []
  };
};

// A system with no agents can never be the active one. This runs on every load, so a store
// already in that state repairs itself; `setActiveSystem` and `saveStore` stop it recurring.
function migrateStore(parsed) {
  const store = { ...emptyStore(), ...parsed };
  const log = Array.isArray(store.migrations) ? [...store.migrations] : [];
  const note = message => { if (!log.includes(message)) log.push(message); };

  if (!Array.isArray(store.systems) || !store.systems.length) {
    store.systems = [seedSystem()];
    note('systems store was empty; the Olympus pipeline was restored');
  }

  // The pipeline is the only system. Anything else was authored by the removed "New system"
  // button; an empty one is the bug's residue and is dropped, and one that holds recorded
  // outputs keeps them by handing them to the pipeline.
  const pipeline = store.systems.find(system => system.id === PIPELINE_ID) || store.systems[0];
  pipeline.agents = defaultAgents();
  const extras = store.systems.filter(system => system !== pipeline);
  for (const extra of extras) {
    if (extra.outputs?.length) {
      pipeline.outputs = [...(extra.outputs || []), ...(pipeline.outputs || [])].slice(0, 100);
      note(`outputs from "${extra.name}" were moved onto the Olympus pipeline`);
    }
    note(`removed the editable system "${extra.name}"; the pipeline is locked`);
  }
  if (extras.length) store.systems = [pipeline];

  if (store.activeSystemId !== pipeline.id) {
    note(`active system was "${store.activeSystemId}"; repointed to the Olympus pipeline`);
    store.activeSystemId = pipeline.id;
  }

  if (!Array.isArray(store.loadouts) || !store.loadouts.length) {
    store.loadouts = seedLoadouts();
    note('seeded four loadouts from the shipped presets');
  } else {
    store.loadouts = store.loadouts.map(loadout => normalizeLoadout(loadout, loadout));
  }
  if (!store.loadouts.some(loadout => loadout.id === store.activeLoadoutId)) {
    store.activeLoadoutId = store.loadouts[0].id;
  }

  store.version = 2;
  store.migrations = log;
  return store;
}

async function loadStore() {
  try {
    return migrateStore(JSON.parse(await readFile(dataPath, 'utf8')));
  } catch {
    return emptyStore();
  }
}

async function saveStore(store) {
  // The guard the CRITICAL defect asked for: refuse to persist a store whose active system
  // has no agents, rather than letting the app degrade into five "No agent" lanes.
  const active = store.systems.find(system => system.id === store.activeSystemId);
  if (!active?.agents?.length) throw new Error('Refusing to save: the active system has no agents.');
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function normalizeAgent(input = {}, index = 0) {
  const name = clean(input.name, 80) || `Agent ${index + 1}`;
  return {
    id: slug(input.id || name) || crypto.randomUUID(),
    name,
    description: clean(input.description, 500) || 'Custom bounded specialist.',
    phase: phases.has(input.phase) ? input.phase : 'prepare',
    activation: clean(input.activation, 500) || 'Activate when the plan requires this specialist.',
    triggers: stringList(input.triggers, 30),
    skills: stringList(input.skills),
    mcp: stringList(input.mcp),
    plugins: stringList(input.plugins),
    instructions: clean(input.instructions, 6000) || `Work only within the ${name} responsibility and return a bounded phase packet.`,
    budget: Math.min(50_000, Math.max(500, Number(input.budget) || 3000)),
    approval: Boolean(input.approval),
    priority: Math.min(100, Math.max(0, Number(input.priority) || 1)),
    enabled: input.enabled !== false
  };
}

function normalizeSystem(input, current = {}) {
  const name = clean(input.name ?? current.name, 100) || 'Untitled system';
  return {
    ...current,
    id: current.id || slug(input.id || name) || crypto.randomUUID(),
    name,
    description: clean(input.description ?? current.description, 700),
    instructions: clean(input.instructions ?? current.instructions, 8000),
    createdAt: current.createdAt || now(),
    updatedAt: now(),
    agents: (Array.isArray(input.agents) ? input.agents : current.agents || []).slice(0, 24).map(normalizeAgent),
    outputs: current.outputs || []
  };
}

function normalizeOutput(input = {}) {
  const runId = clean(input.runId, 160);
  const name = clean(input.name, 120) || (runId ? `Run ${runId}` : 'Untitled output');
  return {
    id: slug(input.id || `${name}-${runId || crypto.randomUUID()}`) || crypto.randomUUID(),
    name,
    type: clean(input.type, 80) || 'Project output',
    status: clean(input.status, 80) || 'Complete',
    createdAt: clean(input.createdAt, 80) || now(),
    runId,
    summary: clean(input.summary, 1000),
    content: clean(input.content, 30_000),
    previewPath: clean(input.previewPath, 1000)
  };
}

export async function initializeSystems() {
  const store = await loadStore();
  await saveStore(store);
  return store;
}

export async function listSystems() {
  const store = await loadStore();
  return { activeSystemId: store.activeSystemId, systems: store.systems };
}

export async function getActiveSystem() {
  const store = await loadStore();
  return store.systems.find(system => system.id === store.activeSystemId) || store.systems[0];
}

// The pipeline is frozen. These three exports stay so every `/api/systems*` contract keeps
// its shape, and they now refuse rather than author a second system nothing will execute.
const FROZEN = 'The Olympus pipeline is locked. Change a loadout instead.';

export async function createSystem() { throw new Error(FROZEN); }

export async function updateSystem(id, input = {}) {
  const store = await loadStore();
  const index = store.systems.findIndex(system => system.id === id);
  if (index < 0) throw new Error('System not found.');
  // Node layout is inspection, not authoring: a run executes the pipeline, not a graph.
  if (Array.isArray(input.agents)) throw new Error(FROZEN);
  store.systems[index] = normalizeSystem({ ...input, agents: store.systems[index].agents }, store.systems[index]);
  await saveStore(store);
  return store.systems[index];
}

export async function setActiveSystem(id) {
  const store = await loadStore();
  const target = store.systems.find(system => system.id === id);
  if (!target) throw new Error('System not found.');
  if (!target.agents?.length) throw new Error('That system has no agents and cannot be made active.');
  store.activeSystemId = id;
  await saveStore(store);
  return { activeSystemId: id };
}

export async function deleteSystem() { throw new Error(FROZEN); }

// ---------------------------------------------------------------- loadout API

export async function listLoadouts() {
  const store = await loadStore();
  return { activeLoadoutId: store.activeLoadoutId, loadouts: store.loadouts, slots: slotMap };
}

export async function getActiveLoadout() {
  const store = await loadStore();
  return store.loadouts.find(loadout => loadout.id === store.activeLoadoutId) || store.loadouts[0];
}

export async function createLoadout(input = {}) {
  const store = await loadStore();
  const source = input.sourceLoadoutId
    ? store.loadouts.find(loadout => loadout.id === input.sourceLoadoutId)
    : null;
  const base = source
    ? { ...structuredClone(source), id: undefined, name: `${source.name} copy`, seeded: false }
    : { name: 'New loadout', slots: slotDefaults() };
  const loadout = normalizeLoadout({ ...base, ...input, id: undefined });
  let candidate = loadout.id;
  let suffix = 2;
  while (store.loadouts.some(item => item.id === candidate)) candidate = `${loadout.id}-${suffix++}`;
  loadout.id = candidate;
  store.loadouts.push(loadout);
  store.activeLoadoutId = loadout.id;
  await saveStore(store);
  return { activeLoadoutId: store.activeLoadoutId, loadout };
}

export async function updateLoadout(id, input = {}) {
  const store = await loadStore();
  const index = store.loadouts.findIndex(loadout => loadout.id === id);
  if (index < 0) throw new Error('Loadout not found.');
  store.loadouts[index] = normalizeLoadout(input, store.loadouts[index]);
  await saveStore(store);
  return store.loadouts[index];
}

export async function setActiveLoadout(id) {
  const store = await loadStore();
  if (!store.loadouts.some(loadout => loadout.id === id)) throw new Error('Loadout not found.');
  store.activeLoadoutId = id;
  await saveStore(store);
  return { activeLoadoutId: id };
}

// Returns the removed record so the caller can offer an undo. Deleting a loadout is the
// only destructive action in this module, and it is reversible by construction.
export async function deleteLoadout(id) {
  const store = await loadStore();
  if (store.loadouts.length <= 1) throw new Error('Convenium.Design must keep at least one loadout.');
  const index = store.loadouts.findIndex(loadout => loadout.id === id);
  if (index < 0) throw new Error('Loadout not found.');
  const [removed] = store.loadouts.splice(index, 1);
  if (store.activeLoadoutId === id) store.activeLoadoutId = store.loadouts[0].id;
  await saveStore(store);
  return { activeLoadoutId: store.activeLoadoutId, removed, restoreIndex: index };
}

export async function restoreLoadout(loadout, restoreIndex = null) {
  const store = await loadStore();
  const restored = normalizeLoadout(loadout, loadout);
  if (store.loadouts.some(item => item.id === restored.id)) return { activeLoadoutId: store.activeLoadoutId, loadout: restored };
  const at = Number.isInteger(restoreIndex) ? Math.min(Math.max(restoreIndex, 0), store.loadouts.length) : store.loadouts.length;
  store.loadouts.splice(at, 0, restored);
  store.activeLoadoutId = restored.id;
  await saveStore(store);
  return { activeLoadoutId: store.activeLoadoutId, loadout: restored };
}

export { slotMap as loadoutSlots };

export async function recordSystemOutput(systemId, input = {}) {
  const store = await loadStore();
  const system = store.systems.find(item => item.id === systemId) || (systemId === 'savra-v2-system' ? store.systems.find(item => item.id === PIPELINE_ID) : null);
  if (!system) throw new Error('System not found.');
  const output = normalizeOutput(input);
  const existing = output.runId && system.outputs.findIndex(item => item.runId === output.runId);
  if (Number.isInteger(existing) && existing >= 0) {
    output.id = system.outputs[existing].id;
    system.outputs.splice(existing, 1, output);
  } else {
    let candidate = output.id;
    let suffix = 2;
    while (system.outputs.some(item => item.id === candidate)) candidate = `${output.id}-${suffix++}`;
    output.id = candidate;
    system.outputs.unshift(output);
  }
  system.outputs = system.outputs.slice(0, 100);
  system.updatedAt = now();
  await saveStore(store);
  return output;
}

export function agentTemplates() {
  return defaultAgents();
}

export async function getOutputPreview(systemId, outputId) {
  const store = await loadStore();
  const output = store.systems.find(system => system.id === systemId)?.outputs.find(item => item.id === outputId);
  if (!output?.previewPath) throw new Error('Preview not found.');
  // Compatibility for the shipped obsolete seed only; preserve stored user records.
  const previewPath = output.id === 'savra-threshold-ritual' && output.previewPath === 'test_projects/Savra_Restraunt/.olympus/evidence/qa/desktop-1440x900.png'
    ? 'test_projects/Savra_v2/.impeccable/review/desktop.png' : output.previewPath;
  const path = resolve(apolloRoot, previewPath);
  const rel = relative(resolve(apolloRoot), path);
  if (!rel || rel.startsWith('..')) throw new Error('Unsafe preview path.');
  const info = await stat(path);
  if (!info.isFile()) throw new Error('Preview not found.');
  const mime = extname(path).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  return { path, mime };
}
