/** v2 T22: ratings, boards and comparisons, including the ethics gate's rules. */
import { describe, expect, it } from 'vitest';
import { compare, leaderboard, overall, rating, type Current, type TrialRecord } from '../../src/domain/regatta';

const now: Current = { kbHash: 'kb1', shipHash: new Map([['a', 'ha'], ['b', 'hb'], ['c', 'hc']]) };
let n = 0;
const rec = (ship: string, total: number, truth: TrialRecord['truth'] = 'Verified', over: Partial<TrialRecord> = {}): TrialRecord => ({
  id: `r${++n}`,
  at: `2026-11-0${Math.min(9, n)}T00:00:00.000Z`,
  ship,
  shipName: ship.toUpperCase(),
  brief: 'b1',
  source: truth === 'Verified' ? 'live' : 'dry',
  truth,
  total,
  criteria: {},
  kbHash: 'kb1',
  shipHash: now.shipHash.get(ship) ?? 'x',
  ...over,
});

describe('rating', () => {
  it('is the mean of the last three Verified totals, and never counts Simulated ones', () => {
    n = 0;
    const rs = [rec('a', 10), rec('a', 70), rec('a', 80), rec('a', 90), rec('a', 99, 'Simulated')];
    const r = rating(rs, 'a', 'b1', now);
    expect(r.value).toBe(80);
    expect(r.n).toBe(3);
    expect(r.simulated).toBe(99);
  });

  it('ignores stale records (ship or library changed) but counts them', () => {
    n = 0;
    const r = rating([rec('a', 50, 'Verified', { kbHash: 'old' }), rec('a', 60, 'Verified', { shipHash: 'old' })], 'a', 'b1', now);
    expect(r.value).toBeNull();
    expect(r.stale).toBe(2);
  });
});

describe('leaderboard', () => {
  it('ranks by Verified rating, ties share a place, Simulated-only ships are listed unranked', () => {
    n = 0;
    const board = leaderboard([rec('a', 80), rec('b', 80), rec('c', 95, 'Simulated')], 'b1', now);
    expect(board.map((r) => [r.ship, r.place])).toEqual([['a', 1], ['b', 1], ['c', null]]);
  });

  it('drops deleted ships', () => {
    n = 0;
    expect(leaderboard([rec('gone', 90)], 'b1', now)).toEqual([]);
  });

  it('overall is the mean of per-brief ratings, with the number of briefs covered', () => {
    n = 0;
    const rows = overall([rec('a', 80), rec('a', 60, 'Verified', { brief: 'b2' }), rec('b', 90)], ['b1', 'b2'], now);
    expect(rows.find((r) => r.ship === 'a')).toMatchObject({ value: 70, briefs: 2 });
    expect(rows[0].ship).toBe('b');
  });
});

describe('compare', () => {
  it('names every winner on a tie, and the best per criterion', () => {
    const c = compare([
      { ship: 'a', total: 80, criteria: { coverage: { points: 30 }, economy: { points: 10 } } },
      { ship: 'b', total: 80, criteria: { coverage: { points: 35 }, economy: { points: 5 } } },
    ]);
    expect(c.winners).toEqual(['a', 'b']);
    expect(c.best.coverage).toEqual({ points: 35, ships: ['b'] });
    expect(c.best.economy.ships).toEqual(['a']);
  });
});
