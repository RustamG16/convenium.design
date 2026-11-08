/** v2 T21: dry trials. Golden scores per library ship and brief (pinned KB), plus the rubric's invariants. */
import { describe, expect, it } from 'vitest';
import { BRIEFS } from '../../src/domain/briefs';
import { libraryShips, LIBRARY_EPOCH } from '../../src/domain/ship';
import { CRITERIA, shipHash, simulate, failingChecks, preflightWhy } from '../../src/domain/trial';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const ships = libraryShips(idx, LIBRARY_EPOCH).ships;

describe('briefs', () => {
  it('three briefs load and validate', () => {
    expect(BRIEFS.map((b) => b.id).sort()).toEqual(['fleet-audit', 'landing-refresh', 'mobile-retrofit']);
  });
});

describe('simulate', () => {
  it('is deterministic and labelled Simulated', () => {
    const a = simulate(ships[0], BRIEFS[0], idx);
    expect(simulate(ships[0], BRIEFS[0], idx)).toEqual(a);
    expect(a.truth).toBe('Simulated');
  });

  it('every criterion stays within its maximum and the total is their sum', () => {
    for (const s of ships)
      for (const b of BRIEFS) {
        const t = simulate(s, b, idx);
        let sum = 0;
        for (const c of CRITERIA) {
          const got = t.score.criteria[c.id];
          expect(got.max).toBe(c.max);
          expect(got.points).toBeGreaterThanOrEqual(0);
          expect(got.points).toBeLessThanOrEqual(c.max);
          sum += got.points;
        }
        expect(t.score.total).toBeCloseTo(sum, 5);
        expect(t.events.at(-1)).toMatchObject({ kind: 'finish', total: t.score.total });
      }
  });

  it('the ship hash ignores names and colours but not the voyage', () => {
    const s = ships[0];
    const renamed = { ...s, name: 'Other', crew: s.crew.map((m) => ({ ...m, character: { ...m.character, name: 'X', pigment: '#000000' } })) };
    expect(shipHash(renamed)).toBe(shipHash(s));
    expect(shipHash({ ...s, voyage: s.voyage.slice(0, -1) })).not.toBe(shipHash(s));
  });

  it('golden scores (pinned KB): the specialist ship wins its own brief', () => {
    const table = Object.fromEntries(BRIEFS.map((b) => [b.id, Object.fromEntries(ships.map((s) => [s.id, simulate(s, b, idx).score.total]))]));
    expect(table).toMatchSnapshot();
    const best = (brief: string) => Object.entries(table[brief]).sort((a, b) => b[1] - a[1])[0][0];
    expect(best('mobile-retrofit')).toBe('ss-mobile-retrofit');
    expect(best('fleet-audit')).toBe('ss-mobile-fleet');
  });
});

describe('the pre-flight line names what fails (re-review 3, new-f)', () => {
  it('round-trips the failing check titles, and stays the plain count when nothing fails', () => {
    expect(preflightWhy(14, 14, [])).toBe('14 of 14 checks pass');
    expect(failingChecks(preflightWhy(14, 14, []))).toEqual([]);
    const why = preflightWhy(14, 15, ["The critic's model tier is at least the builder's"]);
    expect(why.startsWith('14 of 15 checks pass')).toBe(true);
    expect(failingChecks(why)).toEqual(["The critic's model tier is at least the builder's"]);
  });
});
