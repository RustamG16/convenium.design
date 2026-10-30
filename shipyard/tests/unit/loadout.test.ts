import { describe, expect, it } from 'vitest';
import {
  anchorCapacity,
  equip,
  equipNotes,
  fromHold,
  move,
  occupants,
  placement,
  sanitizeShip,
  toHold,
  totalCapacity,
  unequip,
  wornSkills,
} from '../../src/domain/loadout';
import type { Member, Ship } from '../../src/domain/schema';
import { defaultShip } from '../../src/domain/ship';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-10-30T12:00:00.000Z';
const base = (): Ship => structuredClone(defaultShip(idx, AT));
const member = (s: Ship, id: string): Member => s.crew.find((m) => m.id === id)!;

/** A ship with an empty producer, so equip behaviour is not confused by derived defaults. */
function emptyProducer(): Ship {
  const s = base();
  member(s, 'producer').loadout = [];
  return s;
}

describe('capacity comes from the knowledge base', () => {
  it('9 sockets: hand 1, offhand 1, head 1, back 1, belt 3, orbit 2', () => {
    expect(totalCapacity(idx)).toBe(9);
    expect([anchorCapacity(idx, 'belt'), anchorCapacity(idx, 'orbit'), anchorCapacity(idx, 'head')]).toEqual([3, 2, 1]);
  });
});

describe('equip', () => {
  it('places by the family autoPlace order: a lens goes to the head, a gyroscope orbits', () => {
    let s = emptyProducer();
    const lens = idx.kb.skills.find((k) => k.artifact.family === 'lens')!.id;
    const gyro = idx.kb.skills.find((k) => k.artifact.family === 'gyroscope')!.id;
    const a = equip(idx, s, 'producer', lens);
    expect(a.ok && a.anchor).toBe('head');
    if (a.ok) s = a.ship;
    const b = equip(idx, s, 'producer', gyro);
    expect(b.ok && b.anchor).toBe('orbit');
  });

  it('refuses a duplicate on the same member', () => {
    const s = emptyProducer();
    const first = equip(idx, s, 'producer', 'impeccable');
    expect(first.ok).toBe(true);
    const again = equip(idx, (first as { ship: Ship }).ship, 'producer', 'impeccable');
    expect(again).toMatchObject({ ok: false, code: 'duplicate' });
  });

  it('allows the same skill on two different members', () => {
    const s = base();
    expect(wornSkills(member(s, 'engineer'))).toContain('visual-qa');
    expect(wornSkills(member(s, 'critic'))).toContain('visual-qa');
  });

  it('a full anchor refuses the drop and offers swap or the hold', () => {
    let s = emptyProducer();
    const r1 = equip(idx, s, 'producer', 'impeccable', { anchor: 'head' });
    expect(r1.ok).toBe(true);
    s = (r1 as { ship: Ship }).ship;
    const r2 = equip(idx, s, 'producer', 'concept-studio', { anchor: 'head' });
    expect(r2).toMatchObject({ ok: false, code: 'anchor-full', offers: ['swap', 'hold'], occupants: ['impeccable'] });
    // Nothing changed.
    expect(wornSkills(member(s, 'producer'))).toEqual(['impeccable']);
  });

  it('on a full anchor, "hold" sends the old artifact to the hold; "swap" moves it to a free socket', () => {
    let s = emptyProducer();
    s = (equip(idx, s, 'producer', 'impeccable', { anchor: 'head' }) as { ship: Ship }).ship;

    const held = equip(idx, s, 'producer', 'concept-studio', { anchor: 'head', onFull: 'hold' });
    expect(held).toMatchObject({ ok: true, displaced: 'impeccable' });
    const heldShip = (held as { ship: Ship }).ship;
    expect(heldShip.hold).toContain('impeccable');
    expect(wornSkills(member(heldShip, 'producer'))).toEqual(['concept-studio']);

    const swapped = equip(idx, s, 'producer', 'concept-studio', { anchor: 'head', onFull: 'swap' });
    const swappedShip = (swapped as { ship: Ship }).ship;
    expect(wornSkills(member(swappedShip, 'producer')).sort()).toEqual(['concept-studio', 'impeccable']);
    expect(occupants(member(swappedShip, 'producer'), 'head').map((e) => e.skill)).toEqual(['concept-studio']);
    expect(swappedShip.hold ?? []).not.toContain('impeccable');
  });

  it('refuses at capacity: nine sockets, ten skills', () => {
    let s = emptyProducer();
    const ids = idx.kb.skills.map((k) => k.id).slice(0, 9);
    for (const id of ids) {
      const r = equip(idx, s, 'producer', id);
      expect(r.ok, id).toBe(true);
      s = (r as { ship: Ship }).ship;
    }
    expect(member(s, 'producer').loadout).toHaveLength(9);
    expect(placement(idx, member(s, 'producer'), idx.kb.skills[10].id)).toBeNull();
    expect(equip(idx, s, 'producer', idx.kb.skills[10].id)).toMatchObject({ ok: false, code: 'full' });
  });

  it('an unknown skill or member is refused', () => {
    const s = base();
    expect(equip(idx, s, 'captain', 'no-such-skill')).toMatchObject({ ok: false, code: 'unknown-skill' });
    expect(equip(idx, s, 'nobody', 'impeccable')).toMatchObject({ ok: false, code: 'unknown-member' });
  });

  it('equipping from the hold removes it from the hold', () => {
    let s = base();
    expect(s.hold).toContain('copywriting');
    s = (equip(idx, s, 'producer', 'copywriting') as { ship: Ship }).ship;
    expect(s.hold).not.toContain('copywriting');
  });
});

describe('equip notes (warnings, never locks)', () => {
  it('a build-phase skill on a read-only agent warns', () => {
    const notes = equipNotes(idx, 'visual-analyst', 'impeccable');
    expect(notes.map((n) => n.code)).toContain('read-only-build');
    expect(notes.find((n) => n.code === 'read-only-build')?.severity).toBe('warn');
  });

  it('a skill outside the agent routes is an Off-route note', () => {
    const notes = equipNotes(idx, 'asset-producer', 'impeccable');
    expect(notes.some((n) => n.code === 'off-routes' && /Off-route/.test(n.message))).toBe(true);
  });

  it('a routed skill on its own agent has no routes note', () => {
    expect(equipNotes(idx, 'design-engineer', 'gsap-core').map((n) => n.code)).not.toContain('off-routes');
  });

  it('a dormant (manual) skill warns', () => {
    const dormant = idx.kb.skills.find((k) => k.status !== 'active')!;
    expect(equipNotes(idx, 'design-director', dormant.id).map((n) => n.code)).toContain('dormant');
  });

  it('equipping with a warning still succeeds', () => {
    const r = equip(idx, base(), 'analyst', 'impeccable');
    expect(r.ok).toBe(true);
    expect((r as { notes: unknown[] }).notes.length).toBeGreaterThan(0);
  });
});

describe('unequip, hold and move', () => {
  it('unequip removes; toHold keeps it aboard; fromHold wears it again', () => {
    const s = base();
    const gone = unequip(s, 'engineer', 'gsap-core');
    expect(wornSkills(member(gone, 'engineer'))).not.toContain('gsap-core');
    expect(gone.hold).toEqual(s.hold);

    const held = toHold(s, 'engineer', 'gsap-core');
    expect(held.hold).toContain('gsap-core');
    const back = fromHold(idx, held, 'engineer', 'gsap-core');
    expect(back.ok).toBe(true);
    expect(wornSkills(member((back as { ship: Ship }).ship, 'engineer'))).toContain('gsap-core');
    expect((back as { ship: Ship }).ship.hold).not.toContain('gsap-core');
    expect(fromHold(idx, s, 'engineer', 'gsap-core')).toMatchObject({ ok: false });
  });

  it('move relocates within a member; a refused move leaves the ship unchanged', () => {
    const s = emptyProducer();
    const a = equip(idx, s, 'producer', 'impeccable', { anchor: 'head' }) as { ship: Ship };
    const moved = move(idx, a.ship, 'producer', 'impeccable', 'back');
    expect(moved.ok && occupants(member(moved.ship, 'producer'), 'back').map((e) => e.skill)).toEqual(['impeccable']);

    const b = equip(idx, a.ship, 'producer', 'concept-studio', { anchor: 'back' }) as { ship: Ship };
    const refused = move(idx, b.ship, 'producer', 'impeccable', 'back');
    expect(refused).toMatchObject({ ok: false, code: 'anchor-full' });
    expect(occupants(member(b.ship, 'producer'), 'head').map((e) => e.skill)).toEqual(['impeccable']);
  });
});

describe('sanitizeShip', () => {
  it('drops repeated skills, fixes colliding sockets and sends what cannot fit to the hold, never into the void', () => {
    const s = base();
    const m = member(s, 'producer');
    m.loadout = [
      { skill: 'asset-director', anchor: 'head', index: 0 },
      { skill: 'asset-director', anchor: 'back', index: 0 },
      { skill: 'impeccable', anchor: 'head', index: 0 },
      { skill: 'concept-studio', anchor: 'belt', index: 7 as never },
    ];
    const clean = sanitizeShip(idx, s);
    const cm = member(clean, 'producer');
    expect(cm.loadout.map((e) => e.skill).sort()).toEqual(['asset-director', 'concept-studio', 'impeccable']);
    const keys = cm.loadout.map((e) => `${e.anchor}:${e.index}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of cm.loadout) expect(e.index ?? 0).toBeLessThan(anchorCapacity(idx, e.anchor));
  });

  it('keeps a skill that has left the library (it shows as retired and fails pre-flight)', () => {
    const s = base();
    member(s, 'producer').loadout.push({ skill: 'gone-skill', anchor: 'belt', index: 0 });
    expect(wornSkills(member(sanitizeShip(idx, s), 'producer'))).toContain('gone-skill');
  });
});
