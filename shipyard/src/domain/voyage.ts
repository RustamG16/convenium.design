/**
 * Voyage edits (06 section 4.5): add, edit, move, duplicate, delete and apply a template. Pure.
 * Items are addressed by index (the planner renders them in order); stage ids are kept unique here
 * so PF-05 cannot be tripped by an edit the app made itself.
 */
import type { KbIndex } from '../kb/artifacts';
import { templateVoyage } from './ship';
import { isGate, isStage, type Gate, type Ship, type Stage, type VoyageItem } from './schema';

export type VoyageResult = { ok: true; ship: Ship; index?: number } | { ok: false; reason: string };

export type StagePatch = Partial<Pick<Stage, 'label' | 'phase' | 'member' | 'activeSkill' | 'inputs' | 'outputs' | 'stop' | 'parallel' | 'wave'>>;
export type GatePatch = Partial<Pick<Gate, 'gate' | 'label'>>;

export function stageIds(voyage: readonly VoyageItem[]): string[] {
  return voyage.filter(isStage).map((s) => s.id);
}

export function uniqueStageId(taken: Iterable<string>, base: string): string {
  const used = new Set(taken);
  const clean = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^[^a-z]+/, '');
  const root = (clean.length >= 2 ? clean : `${clean || 'stage'}x`).slice(0, 26);
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

const withVoyage = (ship: Ship, voyage: VoyageItem[]): Ship => ({ ...ship, voyage });

/** A new stage for `memberId`, ready to edit: it opens no skill until the owner picks one. */
export function newStage(ship: Ship, memberId: string): Stage {
  const id = uniqueStageId(stageIds(ship.voyage), 'new-stage');
  return { kind: 'stage', id, label: 'New stage', phase: 'prepare', member: memberId, activeSkill: null, outputs: ['notes.md'], stop: 'the output is written' };
}

export function addItem(ship: Ship, item: VoyageItem, at?: number): VoyageResult {
  let next = item;
  if (isStage(item)) next = { ...item, id: uniqueStageId(stageIds(ship.voyage), item.id) };
  const index = Math.max(0, Math.min(at ?? ship.voyage.length, ship.voyage.length));
  const voyage = [...ship.voyage.slice(0, index), next, ...ship.voyage.slice(index)];
  return { ok: true, ship: withVoyage(ship, voyage), index };
}

export function newGate(ship: Ship): Gate {
  const used = new Set(ship.voyage.filter(isGate).map((g) => g.gate));
  const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', '0', '1', '2', '3'].find((l) => !used.has(l)) ?? 'X';
  return { kind: 'gate', gate: letter, label: 'The owner decides' };
}

export function editItem(ship: Ship, index: number, patch: StagePatch | GatePatch): VoyageResult {
  const item = ship.voyage[index];
  if (!item) return { ok: false, reason: 'No such item in the voyage.' };
  let next: VoyageItem;
  if (isStage(item)) {
    const p = patch as StagePatch;
    next = { ...item };
    if (p.label !== undefined) next.label = p.label.slice(0, 80);
    if (p.phase !== undefined) next.phase = p.phase;
    if (p.member !== undefined) next.member = p.member;
    if (p.activeSkill !== undefined) next.activeSkill = p.activeSkill;
    if (p.inputs !== undefined) next.inputs = p.inputs;
    if (p.outputs !== undefined) {
      const outputs = p.outputs.map((o) => o.trim()).filter(Boolean);
      if (outputs.length === 0) return { ok: false, reason: 'A stage needs at least one output.' };
      next.outputs = outputs;
    }
    if (p.stop !== undefined) {
      if (!p.stop.trim()) return { ok: false, reason: 'A stage needs a stop condition.' };
      next.stop = p.stop;
    }
    if (p.parallel !== undefined) {
      if (p.parallel) next.parallel = true;
      else delete next.parallel;
    }
    if (p.wave !== undefined) next.wave = Math.max(0, Math.floor(p.wave));
  } else {
    const p = patch as GatePatch;
    next = { ...item };
    if (p.gate !== undefined && /^[A-Z0-9]$/.test(p.gate)) next.gate = p.gate;
    if (p.label !== undefined) next.label = p.label.slice(0, 80);
  }
  return { ok: true, ship: withVoyage(ship, ship.voyage.map((v, i) => (i === index ? next : v))), index };
}

export function moveItem(ship: Ship, from: number, to: number): VoyageResult {
  const n = ship.voyage.length;
  if (from < 0 || from >= n) return { ok: false, reason: 'No such item in the voyage.' };
  const target = Math.max(0, Math.min(to, n - 1));
  if (target === from) return { ok: true, ship, index: from };
  const voyage = [...ship.voyage];
  const [item] = voyage.splice(from, 1);
  voyage.splice(target, 0, item);
  return { ok: true, ship: withVoyage(ship, voyage), index: target };
}

export function duplicateItem(ship: Ship, index: number): VoyageResult {
  const item = ship.voyage[index];
  if (!item) return { ok: false, reason: 'No such item in the voyage.' };
  const copy: VoyageItem = isStage(item) ? { ...structuredClone(item), id: uniqueStageId(stageIds(ship.voyage), `${item.id}-copy`) } : structuredClone(item);
  return addItem(ship, copy, index + 1);
}

/** The voyage keeps at least one stage (the schema requires it). */
export function deleteItem(ship: Ship, index: number): VoyageResult {
  const item = ship.voyage[index];
  if (!item) return { ok: false, reason: 'No such item in the voyage.' };
  if (isStage(item) && ship.voyage.filter(isStage).length <= 1) return { ok: false, reason: 'A voyage keeps at least one stage.' };
  return { ok: true, ship: withVoyage(ship, ship.voyage.filter((_, i) => i !== index)) };
}

/**
 * Insert the stage set of a library workflow. Members the template names but this ship does not have
 * are mapped to the ship's member with the same agent, else the first member; the owner then fixes
 * what pre-flight names. Stage ids stay unique. `replace` swaps the whole voyage.
 */
export function applyTemplate(idx: KbIndex, ship: Ship, workflowId: string, mode: 'append' | 'replace'): VoyageResult {
  let items: VoyageItem[];
  try {
    items = templateVoyage(idx, workflowId);
  } catch {
    return { ok: false, reason: `${workflowId} has no stage template.` };
  }
  const taken = new Set(mode === 'replace' ? [] : stageIds(ship.voyage));
  const crewIds = new Set(ship.crew.map((m) => m.id));
  const first = ship.crew[0]?.id ?? 'director';
  const mapped = items.map((it): VoyageItem => {
    if (!isStage(it)) return structuredClone(it);
    const id = uniqueStageId(taken, it.id);
    taken.add(id);
    const member = crewIds.has(it.member) ? it.member : first;
    return { ...structuredClone(it), id, member };
  });
  const voyage = mode === 'replace' ? mapped : [...ship.voyage, ...mapped];
  return { ok: true, ship: withVoyage(ship, voyage) };
}
