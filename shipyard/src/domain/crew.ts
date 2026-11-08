/**
 * Crew operations on a ship (06 section 4.3): recruit, edit a character, dismiss, seat at a station.
 * Pure: every function takes a ship and returns a new one (or a refusal with its reason). The runtime
 * agent of a member is fixed once recruited; only the character (name, species, body, pigment...) is
 * cosmetic and editable.
 */
import type { KbIndex } from '../kb/artifacts';
import { defaultLoadout } from './ship';
import { BODY_IDS, isKnownBody, type AgentId, type Character, type Member, type Ship } from './schema';

export const MAX_CREW = 8;

/** The eight pigment swatches a recruit may pick (DESIGN.md token block). */
export const SWATCHES = ['#D9A441', '#86C2A8', '#C79FDC', '#93AEDB', '#E39B95', '#D8B66E', '#E9DCC5', '#9FC7C0'] as const;

export type CrewResult = { ok: true; ship: Ship; member?: Member } | { ok: false; reason: string };

export interface RecruitInput {
  agent: AgentId;
  name: string;
  body?: Character['body'];
  pigment?: string;
  glyph?: string;
  species?: string;
  essence?: string;
}

export function memberSlug(taken: Iterable<string>, name: string): string {
  const used = new Set(taken);
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^[^a-z]+/, '');
  const root = (clean.length >= 2 ? clean : `${clean || 'crew'}x`).slice(0, 28);
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

export function freeStation(ship: Ship): number | null {
  const taken = new Set(ship.crew.map((m) => m.station));
  for (let s = 1; s <= MAX_CREW; s++) if (!taken.has(s)) return s;
  return null;
}

/** A body not yet worn aboard, else the stand-in; the owner may change it. */
export function suggestBody(ship: Ship): Character['body'] {
  const used = new Set(ship.crew.map((m) => m.character.body));
  return BODY_IDS.find((b) => b !== 'standin' && !used.has(b)) ?? 'standin';
}

export function suggestPigment(ship: Ship): string {
  const used = new Set(ship.crew.map((m) => m.character.pigment.toUpperCase()));
  return SWATCHES.find((s) => !used.has(s)) ?? SWATCHES[0];
}

export function recruit(idx: KbIndex, ship: Ship, input: RecruitInput): CrewResult {
  if (ship.crew.length >= MAX_CREW) return { ok: false, reason: `A ship carries at most ${MAX_CREW} crew.` };
  if (!idx.agent.has(input.agent)) return { ok: false, reason: `${input.agent} is not an agent in the library.` };
  const name = input.name.trim().slice(0, 40);
  if (!name) return { ok: false, reason: 'A recruit needs a name.' };
  const station = freeStation(ship);
  if (station === null) return { ok: false, reason: 'Every station is taken.' };
  const id = memberSlug(ship.crew.map((m) => m.id), name);
  const base: Member = {
    id,
    agent: input.agent,
    character: {
      name,
      body: input.body ?? suggestBody(ship),
      pigment: input.pigment ?? suggestPigment(ship),
      ...(input.glyph ? { glyph: input.glyph.slice(0, 4) } : {}),
      ...(input.species ? { species: input.species.slice(0, 160) } : {}),
      ...(input.essence ? { essence: input.essence.slice(0, 400) } : {}),
    },
    station,
    loadout: [],
  };
  // Derived like a library member: the agent's routes and the slots it owns, never invented.
  const { loadout, overflow } = defaultLoadout(idx, input.agent, [], base);
  const member: Member = { ...base, loadout };
  const hold = [...(ship.hold ?? [])];
  for (const s of overflow) if (!hold.includes(s)) hold.push(s);
  return { ok: true, member, ship: { ...ship, crew: [...ship.crew, member], ...(hold.length ? { hold } : {}) } };
}

export type CharacterPatch = Partial<Pick<Character, 'name' | 'species' | 'essence' | 'analogy' | 'body' | 'pigment' | 'glyph'>>;

export function editCharacter(ship: Ship, memberId: string, patch: CharacterPatch): CrewResult {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member) return { ok: false, reason: `${memberId} is not aboard.` };
  const next: Character = { ...member.character };
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 40);
    if (!name) return { ok: false, reason: 'A crew member needs a name.' };
    next.name = name;
  }
  if (patch.species !== undefined) next.species = patch.species.slice(0, 160);
  if (patch.essence !== undefined) next.essence = patch.essence.slice(0, 400);
  if (patch.analogy !== undefined) next.analogy = patch.analogy.slice(0, 200);
  if (patch.glyph !== undefined) next.glyph = patch.glyph.slice(0, 4);
  if (patch.body !== undefined && isKnownBody(patch.body)) next.body = patch.body;
  if (patch.pigment !== undefined && /^#[0-9A-Fa-f]{6}$/.test(patch.pigment)) next.pigment = patch.pigment;
  const updated: Member = { ...member, character: next };
  return { ok: true, member: updated, ship: { ...ship, crew: ship.crew.map((m) => (m.id === memberId ? updated : m)) } };
}

/**
 * Dismiss a member. Their artifacts go to the ship's hold (never into the void). Stages they own are
 * kept: pre-flight names each one ("assigned to X, who is not aboard") with a Fix link, so the owner
 * reassigns them in the voyage. A ship keeps at least one member.
 */
export function dismiss(ship: Ship, memberId: string): CrewResult {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member) return { ok: false, reason: `${memberId} is not aboard.` };
  if (ship.crew.length <= 1) return { ok: false, reason: 'A ship keeps at least one crew member.' };
  const hold = [...(ship.hold ?? [])];
  for (const e of member.loadout) if (!hold.includes(e.skill)) hold.push(e.skill);
  return { ok: true, ship: { ...ship, crew: ship.crew.filter((m) => m.id !== memberId), ...(hold.length ? { hold } : {}) } };
}

/** Seat a member at a station; whoever sat there swaps to the first member's old station. */
export function seat(ship: Ship, memberId: string, station: number): CrewResult {
  const member = ship.crew.find((m) => m.id === memberId);
  if (!member) return { ok: false, reason: `${memberId} is not aboard.` };
  if (!Number.isInteger(station) || station < 1 || station > MAX_CREW) return { ok: false, reason: `Stations run 1 to ${MAX_CREW}.` };
  if (member.station === station) return { ok: true, ship };
  const there = ship.crew.find((m) => m.station === station);
  return {
    ok: true,
    ship: {
      ...ship,
      crew: ship.crew.map((m) => (m.id === memberId ? { ...m, station } : there && m.id === there.id ? { ...m, station: member.station } : m)),
    },
  };
}

/** How many stages a member owns: what a dismissal leaves without a member. */
export function stagesOwnedBy(ship: Ship, memberId: string): number {
  return ship.voyage.filter((v) => v.kind === 'stage' && v.member === memberId).length;
}
