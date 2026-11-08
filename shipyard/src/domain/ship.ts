/**
 * Ships: building them from the library (through the authored conversion tables), blank and
 * cloned, and deriving default loadouts. Pure: time comes in as an argument.
 *
 * Default loadouts are derived, not invented, in this priority order (06 section 3):
 *   1. the skills the member activates in the ship's stages,
 *   2. the agent's `routes:` from library/agents/<agent>.md,
 *   3. the slot defaults the agent owns (slots.json `runtimeOwner`).
 * Deduplicated, placed by autoPlace, capped by the anchors' capacity (9); overflow goes to the hold.
 */
import type { KbIndex } from '../kb/artifacts';
import type { KbAgent } from '../kb/schema';
import { ConversionError, convertWorkflow } from './conversion';
import { placement } from './loadout';
import { displayHull, isKnownBody, isStage, type Character, type LoadoutEntry, type Member, type Ship, type VoyageItem } from './schema';

/** Skills a member may be handed, in priority order, before capacity is applied. */
export function derivedSkillOrder(idx: KbIndex, agent: KbAgent | undefined, stageSkills: string[]): string[] {
  const order: string[] = [];
  const add = (id: string) => {
    if (idx.skill.has(id) && !order.includes(id)) order.push(id);
  };
  stageSkills.forEach(add);
  agent?.routes.forEach(add);
  if (agent) for (const slot of idx.kb.slots) if (slot.runtimeOwner === agent.id) add(slot.default);
  return order;
}

export interface DefaultLoadout {
  /** every derived skill, in priority order (worn + hold) */
  wanted: string[];
  loadout: LoadoutEntry[];
  /** what did not fit */
  overflow: string[];
}

export function defaultLoadout(idx: KbIndex, agentId: string, stageSkills: string[], base: Member): DefaultLoadout {
  const wanted = derivedSkillOrder(idx, idx.agent.get(agentId), stageSkills);
  let member: Member = { ...base, loadout: [] };
  const overflow: string[] = [];
  for (const skill of wanted) {
    const place = placement(idx, member, skill);
    if (place) member = { ...member, loadout: [...member.loadout, { skill, anchor: place.anchor, index: place.index }] };
    else overflow.push(skill);
  }
  return { wanted, loadout: member.loadout, overflow };
}

export function characterFromCrew(idx: KbIndex, crewId: string): Character {
  const c = idx.crew.get(crewId);
  if (!c) throw new Error(`no crew entry ${crewId}`);
  const body = isKnownBody(c.id) && c.id !== 'standin' ? c.id : 'standin';
  return { fromCrew: c.id, name: c.name, species: c.species, essence: c.essence, analogy: c.analogy, body, pigment: c.pigment, glyph: c.glyph };
}

/** A member built from a crew.json entry with its derived default loadout. */
export function memberFromCrew(idx: KbIndex, crewId: string, stageSkills: string[]): { member: Member; overflow: string[] } {
  const c = idx.crew.get(crewId);
  if (!c) throw new Error(`no crew entry ${crewId}`);
  const base: Member = { id: c.id, agent: c.role.agent, character: characterFromCrew(idx, crewId), station: c.station, loadout: [] };
  const { loadout, overflow } = defaultLoadout(idx, c.role.agent, stageSkills, base);
  return { member: { ...base, loadout }, overflow };
}

/** Library ships are rebuilt from the knowledge base and never persisted; their timestamps are never shown. */
export const LIBRARY_EPOCH = '2026-01-01T00:00:00.000Z';

function summaryOf(text: string): string {
  return text.length <= 400 ? text : `${text.slice(0, 397)}...`;
}

/** One library workflow as a (read-only, template) ship. Throws ConversionError when its table has gaps. */
export function libraryShip(idx: KbIndex, workflowId: string, at: string): Ship {
  const { workflow, table, voyage, crew } = convertWorkflow(idx, workflowId);
  const stageSkills = new Map<string, string[]>();
  for (const item of voyage) {
    if (isStage(item) && item.activeSkill) stageSkills.set(item.member, [...(stageSkills.get(item.member) ?? []), item.activeSkill]);
  }
  const members: Member[] = [];
  const hold: string[] = [];
  const ordered = [...crew].sort((a, b) => (idx.crew.get(a)?.station ?? 99) - (idx.crew.get(b)?.station ?? 99));
  for (const id of ordered) {
    const { member, overflow } = memberFromCrew(idx, id, stageSkills.get(id) ?? []);
    members.push(member);
    for (const s of overflow) if (!hold.includes(s)) hold.push(s);
  }
  return {
    schema: 'shipyard.ship.v1',
    id: workflow.id,
    name: workflow.name,
    class: table.class,
    origin: { kind: 'library', workflow: workflow.id },
    summary: summaryOf(workflow.summary),
    hull: table.hull,
    trail: table.trail,
    kbHash: idx.kb.sourceHash,
    crew: members,
    voyage,
    ...(hold.length ? { hold } : {}),
    ...(table.scoped ? { scoped: true } : {}),
    createdAt: at,
    updatedAt: at,
  };
}

export interface LibraryShips {
  ships: Ship[];
  /** library workflows whose table has gaps (or is missing): reported, never silently dropped */
  unconverted: { workflow: string; problems: string[] }[];
}

export function libraryShips(idx: KbIndex, at: string): LibraryShips {
  const ships: Ship[] = [];
  const unconverted: LibraryShips['unconverted'] = [];
  for (const wf of idx.kb.workflows.ships) {
    try {
      ships.push(libraryShip(idx, wf.id, at));
    } catch (e) {
      if (!(e instanceof ConversionError)) throw e;
      unconverted.push({ workflow: wf.id, problems: e.problems });
    }
  }
  return { ships, unconverted };
}

export function defaultShip(idx: KbIndex, at: string): Ship {
  return libraryShip(idx, idx.kb.workflows.default, at);
}

export function isLibraryShip(ship: Ship): boolean {
  return ship.origin?.kind === 'library';
}

export interface NewShipInput {
  id: string;
  name: string;
}

/** A blank ship: the captain aboard (pre-flight needs a design-director) and one run-plan stage. */
export function blankShip(idx: KbIndex, input: NewShipInput, at: string): Ship {
  const { member, overflow } = memberFromCrew(idx, 'captain', ['olympus-design-director']);
  return {
    schema: 'shipyard.ship.v1',
    id: input.id,
    name: input.name.slice(0, 48),
    class: 'custom',
    origin: { kind: 'blank' },
    hull: displayHull(undefined, input.id),
    trail: 'abridged',
    kbHash: idx.kb.sourceHash,
    crew: [member],
    voyage: [
      {
        kind: 'stage',
        id: 'run-plan',
        label: 'Run plan: which agents, one skill each',
        phase: 'diagnose',
        member: member.id,
        activeSkill: 'olympus-design-director',
        outputs: ['.olympus/00-run-plan.md'],
        stop: 'verify.py --plan CLEAN',
      },
    ],
    ...(overflow.length ? { hold: overflow } : {}),
    createdAt: at,
    updatedAt: at,
  };
}

/** A custom copy of any ship (library ships are read-only; editing one means cloning it). */
export function cloneShip(ship: Ship, input: NewShipInput, at: string): Ship {
  const copy = structuredClone(ship);
  return {
    ...copy,
    id: input.id,
    name: input.name.slice(0, 48),
    class: 'custom',
    origin: { kind: 'clone', from: ship.id, ...(ship.origin?.workflow ? { workflow: ship.origin.workflow } : {}) },
    logbook: [],
    createdAt: at,
    updatedAt: at,
  };
}

/** The stage rows of a library table as a voyage fragment (voyage/applyTemplate, T8). */
export function templateVoyage(idx: KbIndex, workflowId: string): VoyageItem[] {
  return convertWorkflow(idx, workflowId).voyage;
}
