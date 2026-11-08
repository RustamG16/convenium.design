import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { leaderboard, overall, rating, type Current, type TrialRecord } from '../../src/domain/regatta';

/**
 * The ethics gate as far as code can check it. v1 (06 section 7.6) banned every ranking; v2 (PRODUCT.md
 * § v2, owner decision 2026-11-08) allows full game scoring in one place, the Regatta, under rules:
 * - ranking words may appear only in the Regatta's domain and feature files;
 * - ratings come only from trial records (outcomes), never from clicks, visits or time;
 * - Simulated totals never rank; stale records never count; ties share a place;
 * - still banned everywhere: XP, levels, streaks, countdowns and timers, expiry, loss wording, Elo,
 *   random or paid rewards.
 */
const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|css)$/.test(name) ? [p] : [];
  });
}

const REGATTA = [`${sep}domain${sep}regatta.ts`, `${sep}features${sep}regatta${sep}`, `${sep}styles${sep}regatta.css`];
const inRegatta = (f: string) => REGATTA.some((r) => f.includes(r));

const FORBIDDEN: [string, RegExp, ((f: string) => boolean)?][] = [
  ['xp', /(?<![\w-])xp(?![\w-])/i],
  ['level(s)', /(?<![\w-])levels?(?![\w-])/i],
  ['streak', /streak/i],
  ['leaderboard / ranking outside the Regatta', /leaderboard|(?<![\w-])rankings?(?![\w-])/i, inRegatta],
  ['countdown / timer', /countdown|(?<![\w-])timers?(?![\w-])/i],
  ['expiry', /expir(y|es|ed|ation)/i],
  ['loss / at-risk wording', /at risk|you['’]ll lose|about to lose/i],
  ['Elo', /(?<![\w-])elo(?![\w-])/i],
  ['loot / random reward', /loot|Math\.random|crypto\.getRandomValues|randomUUID/],
];

const all = files(SRC);

describe('ethics gate', () => {
  it('scans the source tree', () => {
    expect(all.length).toBeGreaterThan(10);
  });
  for (const [name, re, allowed] of FORBIDDEN) {
    it(`no ${name} in src/`, () => {
      const hits = all
        .filter((f) => !allowed?.(f))
        .flatMap((f) =>
          readFileSync(f, 'utf8')
            .split(/\r?\n/)
            .map((line, i) => ({ f, line, n: i + 1 }))
            .filter(({ line }) => re.test(line))
            .map(({ f, n, line }) => `${f.slice(SRC.length + 1)}:${n}: ${line.trim()}`),
        );
      expect(hits).toEqual([]);
    });
  }

  it('the Regatta domain reads trial records only: no store, no UI state, no clock of its own', () => {
    const src = readFileSync(join(SRC, 'domain', 'regatta.ts'), 'utf8');
    expect(src).not.toMatch(/from '\.\.\/store|from '\.\.\/features|localStorage|Date\.now|new Date\(/);
  });
});

describe('ratings follow the v2 rules', () => {
  const now: Current = { kbHash: 'kb', shipHash: new Map([['a', 'ha'], ['b', 'hb']]) };
  const rec = (id: string, ship: string, total: number, truth: TrialRecord['truth'], over: Partial<TrialRecord> = {}): TrialRecord => ({
    id, at: `2026-11-08T00:00:0${id.length}.000Z`, ship, shipName: ship, brief: 'x', source: truth === 'Verified' ? 'live' : 'dry', truth, total, criteria: {}, kbHash: 'kb', shipHash: now.shipHash.get(ship)!, ...over,
  });

  it('a ship with only Simulated results is listed but never placed', () => {
    const rows = leaderboard([rec('1', 'a', 99, 'Simulated'), rec('2', 'b', 40, 'Verified')], 'x', now);
    expect(rows.find((r) => r.ship === 'a')).toMatchObject({ place: null });
    expect(rows.find((r) => r.ship === 'b')).toMatchObject({ place: 1 });
  });

  it('a stale Verified record does not count', () => {
    expect(rating([rec('1', 'a', 90, 'Verified', { kbHash: 'old' })], 'a', 'x', now)).toMatchObject({ value: null, stale: 1 });
  });

  it('equal ratings share a place, overall too', () => {
    const rs = [rec('1', 'a', 70, 'Verified'), rec('2', 'b', 70, 'Verified')];
    expect(leaderboard(rs, 'x', now).map((r) => r.place)).toEqual([1, 1]);
    expect(overall(rs, ['x'], now).map((r) => r.place)).toEqual([1, 1]);
  });
});
