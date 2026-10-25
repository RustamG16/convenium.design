// Configuration drafts: change agents and skills freely; production changes only on apply.
// Slot skill choices become a real (non-active) loadout so Playground can compare them with
// the server's deterministic planner; role settings are written to /api/agents on apply.
import { api } from './api.js';
import { store, saveSession, activeLoadout, slots, refreshAgents, refreshLoadouts } from './store.js';

export function currentRoleSettings() {
  return Object.fromEntries((store.data.agents || []).map(a => [a.id, { budget: a.budget, approval: a.approval, enabled: a.enabled }]));
}

export function ensureDraft() {
  if (store.session.configDraft) return store.session.configDraft;
  if (!store.data.agents?.length || !store.data.loadouts) return { slots: { ...(activeLoadout()?.slots || {}) }, roles: currentRoleSettings() };
  const draft = { slots: { ...(activeLoadout()?.slots || {}) }, roles: currentRoleSettings() };
  saveSession({ configDraft: draft, baseLoadoutId: store.data.loadouts?.activeLoadoutId || null });
  return draft;
}

export function updateDraft(mutator) {
  const draft = structuredClone(ensureDraft());
  mutator(draft);
  saveSession({ configDraft: draft, configApplied: false });
  return draft;
}

export function draftChanges() {
  const draft = store.session.configDraft;
  if (!draft) return [];
  const base = activeLoadout()?.slots || {};
  const changes = [];
  for (const sl of slots()) {
    if ((draft.slots[sl.id] || sl.default) !== (base[sl.id] || sl.default)) changes.push({ kind: 'slot', id: sl.id, owner: sl.owner, from: base[sl.id], to: draft.slots[sl.id] });
  }
  const roles = currentRoleSettings();
  for (const [id, r] of Object.entries(draft.roles || {})) {
    const cur = roles[id]; if (!cur) continue;
    for (const key of ['budget', 'approval', 'enabled']) if (r[key] !== cur[key]) changes.push({ kind: 'role', id, key, from: cur[key], to: r[key] });
  }
  return changes;
}

export function resetDraft() { saveSession({ configDraft: null, comparison: null }); }

// Create or refresh the draft loadout on the server without making it active.
export async function pushDraft() {
  const draft = ensureDraft();
  const active = store.data.loadouts?.activeLoadoutId;
  const base = activeLoadout();
  const body = { name: 'Northstar draft', description: 'Draft configuration from Configure — not active until applied.', slots: draft.slots, brief: base?.brief || '', designDna: base?.designDna || null, tools: base?.tools || { mcp: [], plugins: [] }, budget: base?.budget, advancedSkills: base?.advancedSkills || [] };
  let id = store.session.draftLoadoutId;
  const exists = id && store.data.loadouts?.loadouts?.some(l => l.id === id);
  if (exists && id !== active) await api.updateLoadout(id, body);
  else {
    const created = await api.createLoadout({ ...body, sourceLoadoutId: active || undefined });
    id = created.loadout.id;
    if (active) await api.activateLoadout(active); // creating a loadout activates it; restore production
  }
  saveSession({ draftLoadoutId: id });
  await refreshLoadouts();
  return { a: active, b: id };
}

export async function applyDraft() {
  const { b } = await pushDraft();
  await api.updateLoadout(b, { name: 'Northstar configuration', description: 'Applied from Configure after a Playground comparison.' });
  await api.activateLoadout(b);
  const draft = store.session.configDraft;
  const roles = currentRoleSettings();
  for (const [id, r] of Object.entries(draft?.roles || {})) {
    const cur = roles[id]; if (!cur) continue;
    const patch = {};
    for (const key of ['budget', 'approval', 'enabled']) if (r[key] !== cur[key]) patch[key] = r[key];
    if (Object.keys(patch).length) await api.updateAgent(id, patch);
  }
  await Promise.all([refreshAgents(), refreshLoadouts()]);
  saveSession({ configApplied: true, configDraft: null, draftLoadoutId: null });
}
