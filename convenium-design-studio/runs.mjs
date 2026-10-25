// Comparison runs, kept.
//
// A comparison was the product's headline workflow — "Test small. Commit with evidence." —
// and its result lived in one localStorage key, capped at 20, on one browser. Reload in a
// different browser and the evidence you were told to commit with was gone; "Clear local"
// was its whole lifecycle. B7 measured it: a run did not survive a reload.
//
// This is deliberately the same shape as events.jsonl — append-only JSONL beside it, same
// store directory, same relocatable path — because a run IS a record of what happened and
// the product already had a good pattern for those.
//
// What a run keeps is the part that matters: the prompt, and a SNAPSHOT of each loadout as it
// ran. A run that stored only a loadout id would silently rewrite its own history the next
// time that loadout was edited, which is the failure mode a comparison exists to avoid.
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { dataFile } from './paths.mjs';

const runsPath = dataFile('runs.jsonl');

export async function initializeRunStore() {
  await mkdir(dirname(runsPath), { recursive: true });
}

const trim = (value, max) => String(value ?? '').slice(0, max);

/** The loadout as it was at the moment of the run, not a pointer to what it is now. */
function snapshotLoadout(loadout, slots) {
  if (!loadout) return null;
  const changed = (slots || [])
    .filter(slot => (loadout.slots?.[slot.id] || slot.default) !== slot.default)
    .map(slot => ({ slot: slot.id, name: slot.name, chose: loadout.slots[slot.id], instead_of: slot.default }));
  return {
    id: loadout.id,
    name: loadout.name,
    slots: { ...(loadout.slots || {}) },
    changedFromDefault: changed,
    designDna: loadout.designDna || null,
    brief: trim(loadout.brief, 8000),
    budget: loadout.budget?.totalTokens ?? null,
  };
}

export async function recordRun(input = {}, { loadouts = [], slots = [] } = {}) {
  await initializeRunStore();
  const run = {
    runId: String(input.runId || crypto.randomUUID()),
    createdAt: new Date().toISOString(),
    source: input.source === 'host' ? 'host' : 'browser',
    mode: input.mode === 'live' ? 'live' : 'demo',
    model: trim(input.model, 80),
    reasoning: trim(input.reasoning, 20),
    prompt: trim(input.prompt, 20_000),
    results: (input.results || []).slice(0, 3).map(result => ({
      name: trim(result.variant?.name, 60),
      loadout: snapshotLoadout(
        loadouts.find(item => item.id === result.variant?.loadoutId),
        slots,
      ),
      contextSent: Boolean(result.variant?.context),
      skills: (result.variant?.skills || []).slice(0, 120),
      mode: result.mode,
      latencyMs: Number(result.latencyMs) || 0,
      tokens: Number(result.usage?.totalTokens) || 0,
      error: result.error ? trim(result.error, 2000) : null,
      text: trim(result.text, 40_000),
    })),
    keptVariant: null,
  };
  await appendFile(runsPath, `${JSON.stringify(run)}\n`, 'utf8');
  return run;
}

async function readAll() {
  await initializeRunStore();
  let raw = '';
  try { raw = await readFile(runsPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return raw.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

export async function listRuns({ limit = 50 } = {}) {
  const all = await readAll();
  return all.slice(-Math.min(200, Math.max(1, Number(limit) || 50))).reverse();
}

export async function getRun(runId) {
  return (await readAll()).find(run => run.runId === runId) || null;
}

/**
 * Mark which variant a person kept. This is the last step of the headline workflow and it
 * had nowhere to be written down, so "Keep this setup" could not mean anything durable.
 * Rewrites the file rather than appending, because a kept decision replaces the previous one.
 */
export async function keepVariant(runId, variantName) {
  const all = await readAll();
  const index = all.findIndex(run => run.runId === runId);
  if (index < 0) throw new Error('Run not found.');
  all[index] = { ...all[index], keptVariant: trim(variantName, 60), keptAt: new Date().toISOString() };
  await writeFile(runsPath, all.map(run => `${JSON.stringify(run)}\n`).join(''), 'utf8');
  return all[index];
}

/** Clearing local history is destructive and therefore undoable: the removed rows come back. */
export async function clearRuns() {
  const removed = await readAll();
  await writeFile(runsPath, '', 'utf8');
  return removed;
}

export async function restoreRuns(runs = []) {
  await initializeRunStore();
  const existing = await readAll();
  const byId = new Map(existing.map(run => [run.runId, run]));
  for (const run of runs) if (run?.runId) byId.set(run.runId, run);
  const merged = [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  await writeFile(runsPath, merged.map(run => `${JSON.stringify(run)}\n`).join(''), 'utf8');
  return merged.length;
}

export const runStorePath = runsPath;
