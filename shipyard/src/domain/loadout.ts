/**
 * Loadouts and the equip rules (06 section 5.1). Pure: every function takes a ship and returns a
 * new one. Capacity is the one hard limit; everything else is a note the owner may ignore and
 * pre-flight reports.
 *
 * Capacity comes from the knowledge base anchors (hand 1, offhand 1, head 1, back 1, belt 3,
 * orbit 2 = 9), never from a constant here.
 */
import type { KbIndex } from '../kb/artifacts';
import { ANCHOR_IDS, type Anchor, type LoadoutEntry, type Member, type Ship } from './schema';

export type NoteCode = 'read-only-build' | 'off-phase' | 'off-routes' | 'dormant' | 'retired';
export interface Note {
  code: NoteCode;
  severity: 'block' | 'warn' | 'info';
  message: string;
}

export const entryIndex = (e: LoadoutEntry): number => e.index ?? 0;

export function anchorCapacity(idx: KbIndex, anchor: Anchor): number {
  return idx.kb.anchors[anchor]?.capacity ?? 0;
}

export function totalCapacity(idx: KbIndex): number {
  return ANCHOR_IDS.reduce((n, a) => n + anchorCapacity(idx, a), 0);
}

export function wornSkills(member: Member): string[] {
  return member.loadout.map((e) => e.skill);
}

export function isWorn(member: Member, skill: string): boolean {
  return member.loadout.some((e) => e.skill === skill);
}

/** Occupants of one anchor, lowest socket first. */
export function occupants(member: Member, anchor: Anchor): LoadoutEntry[] {
  return member.loadout.filter((e) => e.anchor === anchor).sort((a, b) => entryIndex(a) - entryIndex(b));
}

/** The lowest free socket index on an anchor, or null when it is full. */
export function freeIndex(idx: KbIndex, member: Member, anchor: Anchor): number | null {
  const taken = new Set(occupants(member, anchor).map(entryIndex));
  for (let i = 0; i < anchorCapacity(idx, anchor); i++) if (!taken.has(i)) return i;
  return null;
}

/**
 * Where an artifact lands when placed without choosing: its family's `autoPlace` order first, then
 * every other anchor in canonical order. Null when the member has no free socket at all.
 */
export function placement(idx: KbIndex, member: Member, skillId: string, avoid: Anchor[] = []): { anchor: Anchor; index: number } | null {
  const family = idx.skill.get(skillId)?.artifact.autoPlace ?? [];
  const order = [...family, ...ANCHOR_IDS.filter((a) => !family.includes(a))].filter((a) => !avoid.includes(a));
  for (const anchor of order) {
    const index = freeIndex(idx, member, anchor);
    if (index !== null) return { anchor, index };
  }
  return null;
}

/** The ship-level notes for wearing `skillId` as agent `agentId` (06 section 5.1). Never blocks equipping. */
export function equipNotes(idx: KbIndex, agentId: string, skillId: string): Note[] {
  const skill = idx.skill.get(skillId);
  if (!skill) return [{ code: 'retired', severity: 'block', message: `${skillId} is no longer in the library.` }];
  const agent = idx.agent.get(agentId);
  const notes: Note[] = [];
  if (agent && skill.phase === 'build' && agent.access === 'read-only') {
    notes.push({ code: 'read-only-build', severity: 'warn', message: 'This agent cannot write files.' });
  }
  if (agent) {
    // The analytics agent's phase is "measurement"; its skills are verify-phase.
    const agentPhase = agent.phase === 'measurement' ? 'verify' : agent.phase;
    const phaseless = skill.phase === 'always' || skill.phase === 'unrouted' || agentPhase === 'always';
    if (!phaseless && skill.phase !== agentPhase) {
      notes.push({ code: 'off-phase', severity: 'info', message: `Off-route: a ${skill.phase}-phase skill on a ${agentPhase}-phase agent.` });
    }
    if (!agent.routes.includes(skillId)) {
      notes.push({ code: 'off-routes', severity: 'info', message: `Off-route: ${skillId} is not in this agent's routes.` });
    }
  }
  if (skill.status !== 'active') {
    notes.push({ code: 'dormant', severity: 'warn', message: 'Manual skill: invoked explicitly, never routed.' });
  }
  return notes;
}

export type EquipFailCode = 'unknown-skill' | 'unknown-member' | 'duplicate' | 'anchor-full' | 'full';
export interface EquipFail {
  ok: false;
  code: EquipFailCode;
  reason: string;
  /** what the owner can do instead; only set for a full anchor */
  offers: ('swap' | 'hold')[];
  /** skills currently on the full anchor */
  occupants: string[];
}
export interface EquipOk {
  ok: true;
  ship: Ship;
  anchor: Anchor;
  index: number;
  notes: Note[];
  /** the skill that was displaced to make room, if any */
  displaced?: string;
}
export type EquipResult = EquipOk | EquipFail;

export interface EquipOptions {
  /** choose an anchor; omitted means autoPlace */
  anchor?: Anchor;
  /** what to do when the chosen anchor is full: swap (old one moves to a free socket, else the hold) or hold */
  onFull?: 'swap' | 'hold';
  /** which occupant to displace on a full anchor; default the first */
  replace?: string;
}

const fail = (code: EquipFailCode, reason: string, offers: EquipFail['offers'] = [], occ: string[] = []): EquipFail => ({
  ok: false,
  code,
  reason,
  offers,
  occupants: occ,
});

function withMember(ship: Ship, memberId: string, fn: (m: Member) => Member): Ship {
  return { ...ship, crew: ship.crew.map((m) => (m.id === memberId ? fn(m) : m)) };
}

function addToHold(ship: Ship, skill: string): Ship {
  const hold = ship.hold ?? [];
  return hold.includes(skill) ? ship : { ...ship, hold: [...hold, skill] };
}

function removeFromHold(ship: Ship, skill: string): Ship {
  return ship.hold?.includes(skill) ? { ...ship, hold: ship.hold.filter((s) => s !== skill) } : ship;
}

export function equip(idx: KbIndex, ship: Ship, memberId: string, skillId: string, opts: EquipOptions = {}): EquipResult {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member) return fail('unknown-member', `${memberId} is not aboard.`);
  if (!idx.skill.has(skillId)) return fail('unknown-skill', `${skillId} is not in the library.`);
  if (isWorn(member, skillId)) return fail('duplicate', `${member.character.name} already carries ${skillId}.`);

  let anchor: Anchor;
  let index: number;
  let displaced: string | undefined;
  let working = member;

  if (opts.anchor) {
    anchor = opts.anchor;
    const free = freeIndex(idx, member, anchor);
    if (free !== null) {
      index = free;
    } else {
      const occ = occupants(member, anchor);
      const label = idx.kb.anchors[anchor].label;
      if (!opts.onFull) {
        return fail('anchor-full', `${label} is full.`, ['swap', 'hold'], occ.map((e) => e.skill));
      }
      const victim = occ.find((e) => e.skill === opts.replace) ?? occ[0];
      displaced = victim.skill;
      index = entryIndex(victim);
      working = { ...member, loadout: member.loadout.filter((e) => e !== victim) };
    }
  } else {
    const place = placement(idx, member, skillId);
    if (!place) return fail('full', `All ${totalCapacity(idx)} sockets are in use. Unequip one first.`);
    anchor = place.anchor;
    index = place.index;
  }

  let next = withMember(ship, memberId, () => ({ ...working, loadout: [...working.loadout, { skill: skillId, anchor, index }] }));
  next = removeFromHold(next, skillId);

  if (displaced) {
    // Swap: the old artifact takes a free socket elsewhere if there is one; otherwise (or on "hold") the hold.
    const placed = opts.onFull === 'swap' ? placement(idx, next.crew.find((m) => m.id === memberId)!, displaced, [anchor]) : null;
    if (placed) {
      const moved = displaced;
      next = withMember(next, memberId, (m) => ({ ...m, loadout: [...m.loadout, { skill: moved, anchor: placed.anchor, index: placed.index }] }));
    } else {
      next = addToHold(next, displaced);
    }
  }
  return { ok: true, ship: next, anchor, index, notes: equipNotes(idx, member.agent, skillId), displaced };
}

/** Take an artifact off a member. With `toHold` it goes to the ship's hold instead of vanishing. */
export function unequip(ship: Ship, memberId: string, skillId: string, opts: { toHold?: boolean } = {}): Ship {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member || !isWorn(member, skillId)) return ship;
  const next = withMember(ship, memberId, (m) => ({ ...m, loadout: m.loadout.filter((e) => e.skill !== skillId) }));
  return opts.toHold ? addToHold(next, skillId) : next;
}

export const toHold = (ship: Ship, memberId: string, skillId: string): Ship => unequip(ship, memberId, skillId, { toHold: true });

/** Wear a hold artifact. `equip` removes it from the hold. */
export function fromHold(idx: KbIndex, ship: Ship, memberId: string, skillId: string, opts: EquipOptions = {}): EquipResult {
  if (!ship.hold?.includes(skillId)) return fail('unknown-skill', `${skillId} is not in the hold.`);
  return equip(idx, ship, memberId, skillId, opts);
}

/** Move a worn artifact to another anchor of the same member. On failure the ship is unchanged. */
export function move(idx: KbIndex, ship: Ship, memberId: string, skillId: string, anchor: Anchor, opts: Omit<EquipOptions, 'anchor'> = {}): EquipResult {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member || !isWorn(member, skillId)) return fail('unknown-skill', `${skillId} is not worn by ${memberId}.`);
  return equip(idx, unequip(ship, memberId, skillId), memberId, skillId, { ...opts, anchor });
}

/**
 * Sanitise a loaded ship: drop repeated skills on a member, bring sockets back inside capacity and
 * make sure no two artifacts share a socket. Whatever cannot be placed goes to the hold, never into
 * the void. Skills no longer in the library are kept (they show as retired and fail pre-flight).
 */
export function sanitizeShip(idx: KbIndex, ship: Ship): Ship {
  let hold = [...(ship.hold ?? [])];
  const crew = ship.crew.map((m) => {
    const placed: Member = { ...m, loadout: [] };
    const seen = new Set<string>();
    for (const e of m.loadout) {
      if (seen.has(e.skill)) continue;
      seen.add(e.skill);
      const cap = anchorCapacity(idx, e.anchor);
      const wanted = entryIndex(e);
      const free = freeIndex(idx, placed, e.anchor);
      if (wanted < cap && !placed.loadout.some((x) => x.anchor === e.anchor && entryIndex(x) === wanted)) {
        placed.loadout.push({ skill: e.skill, anchor: e.anchor, index: wanted });
      } else if (free !== null) {
        placed.loadout.push({ skill: e.skill, anchor: e.anchor, index: free });
      } else {
        const p = placement(idx, placed, e.skill);
        if (p) placed.loadout.push({ skill: e.skill, anchor: p.anchor, index: p.index });
        else hold = hold.includes(e.skill) ? hold : [...hold, e.skill];
      }
    }
    return placed;
  });
  return { ...ship, crew, ...(hold.length || ship.hold ? { hold } : {}) };
}
