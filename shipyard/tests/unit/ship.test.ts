import { describe, expect, it } from 'vitest';
import { derivedSkillOrder, blankShip, cloneShip, defaultShip, libraryShip, libraryShips, LIBRARY_EPOCH } from '../../src/domain/ship';
import { isStage, shipSchema } from '../../src/domain/schema';
import { totalCapacity } from '../../src/domain/loadout';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-10-30T12:00:00.000Z';

describe('default ship: SS Full Run', () => {
  const ship = defaultShip(idx, AT);

  it('is the library default, with seven crew: crew.json minus gauge', () => {
    expect(ship.id).toBe(idx.kb.workflows.default);
    expect(ship.crew).toHaveLength(7);
    expect(ship.crew.map((m) => m.id)).not.toContain('gauge');
    expect(ship.crew.map((m) => m.station)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(ship.origin).toEqual({ kind: 'library', workflow: 'ss-full-run' });
    expect(ship.trail).toBe('full');
    expect(shipSchema.safeParse(ship).success).toBe(true);
  });

  it('every crew body is its own GLB (no gauge in this ship, so no stand-in)', () => {
    expect(ship.crew.map((m) => m.character.body)).toEqual(['captain', 'strategist', 'analyst', 'critic', 'engineer', 'producer', 'metrics']);
  });

  it('the captain resolves to 12 skills: 9 worn, 3 in the hold', () => {
    const captain = ship.crew.find((m) => m.id === 'captain')!;
    const derived = derivedSkillOrder(idx, idx.agent.get('design-director'), ['olympus-design-director', 'concept-studio', 'impeccable']);
    expect(derived).toHaveLength(12);
    expect(captain.loadout).toHaveLength(9);
    expect(totalCapacity(idx)).toBe(9);
    expect(ship.hold).toEqual(['design-analytics', 'visual-qa', 'copywriting']);
    expect([...captain.loadout.map((e) => e.skill), ...ship.hold!].sort()).toEqual([...derived].sort());
  });

  it('the engineer resolves to 5 skills and the strategist to 6, all worn', () => {
    const engineer = ship.crew.find((m) => m.id === 'engineer')!;
    const strategist = ship.crew.find((m) => m.id === 'strategist')!;
    expect(engineer.loadout.map((e) => e.skill).sort()).toEqual(['apple-design', 'emil-design-eng', 'gsap-core', 'impeccable', 'visual-qa']);
    expect(strategist.loadout).toHaveLength(6);
    expect(strategist.loadout.map((e) => e.skill)).toContain('product-marketing');
  });

  it('no two artifacts share a socket and every socket is inside its anchor capacity', () => {
    for (const m of ship.crew) {
      const seen = new Set<string>();
      for (const e of m.loadout) {
        const key = `${e.anchor}:${e.index ?? 0}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(e.index ?? 0).toBeLessThan(idx.kb.anchors[e.anchor].capacity);
      }
    }
  });

  it('every stage skill is worn by its member (the one-body-per-phase rule made visible)', () => {
    for (const s of ship.voyage.filter(isStage)) {
      if (!s.activeSkill) continue;
      expect(ship.crew.find((m) => m.id === s.member)!.loadout.map((e) => e.skill)).toContain(s.activeSkill);
    }
  });
});

describe('library ships', () => {
  it('all four library workflows convert; none is left unconverted', () => {
    const { ships, unconverted } = libraryShips(idx, AT);
    expect(unconverted).toEqual([]);
    expect(ships.map((s) => s.id)).toEqual(idx.kb.workflows.ships.map((w) => w.id));
    expect(ships.map((s) => s.class)).toEqual(['flagship', 'abridged', 'retrofit', 'fleet']);
    for (const s of ships) expect(shipSchema.safeParse(s).success, s.id).toBe(true);
  });

  it('retrofit and fleet are scoped repairs; fleet has its own measurer on the eighth station with the stand-in body', () => {
    expect(libraryShip(idx, 'ss-mobile-retrofit', AT).scoped).toBe(true);
    const fleet = libraryShip(idx, 'ss-mobile-fleet', AT);
    expect(fleet.scoped).toBe(true);
    const gauge = fleet.crew.find((m) => m.id === 'gauge')!;
    expect(gauge.station).toBe(8);
    expect(gauge.agent).toBe('fleet-measurer');
    expect(gauge.character.body).toBe('standin');
  });

  it('library ships carry the knowledge-base hash they were built from', () => {
    for (const s of libraryShips(idx, LIBRARY_EPOCH).ships) expect(s.kbHash).toBe(idx.kb.sourceHash);
  });
});

describe('blank and cloned ships', () => {
  it('a blank ship has the captain aboard and a run-plan stage', () => {
    const ship = blankShip(idx, { id: 'my-ship', name: 'My ship' }, AT);
    expect(shipSchema.safeParse(ship).success).toBe(true);
    expect(ship.crew.map((m) => m.agent)).toEqual(['design-director']);
    expect(ship.voyage.filter(isStage).map((s) => s.id)).toEqual(['run-plan']);
    expect(ship.origin?.kind).toBe('blank');
  });

  it('a clone is an independent custom copy of a library ship', () => {
    const lib = defaultShip(idx, AT);
    const copy = cloneShip(lib, { id: 'my-full-run', name: 'My Full Run' }, '2026-11-01T00:00:00.000Z');
    expect(copy.class).toBe('custom');
    expect(copy.origin).toEqual({ kind: 'clone', from: 'ss-full-run', workflow: 'ss-full-run' });
    expect(copy.crew).toEqual(lib.crew);
    copy.crew[0].loadout.pop();
    expect(lib.crew[0].loadout).toHaveLength(9);
  });
});
