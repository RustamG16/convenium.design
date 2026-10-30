import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The ethics gate (06 section 7.6), as far as code can check it: no XP, levels, streaks, timers,
 * rankings or random rewards anywhere in the source, including types and store shape.
 */
const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|css)$/.test(name) ? [p] : [];
  });
}

const FORBIDDEN: [string, RegExp][] = [
  ['xp', /(?<![\w-])xp(?![\w-])/i],
  ['level(s)', /(?<![\w-])levels?(?![\w-])/i],
  ['streak', /streak/i],
  ['leaderboard / ranking', /leaderboard|(?<![\w-])rankings?(?![\w-])/i],
  ['countdown / timer', /countdown|(?<![\w-])timers?(?![\w-])/i],
  ['expiry', /expir(y|es|ed|ation)/i],
  ['loss / at-risk wording', /at risk|you['’]ll lose|about to lose/i],
  ['loot / random reward', /loot|Math\.random|crypto\.getRandomValues|randomUUID/],
];

describe('ethics gate', () => {
  const all = files(SRC);
  it('scans the source tree', () => {
    expect(all.length).toBeGreaterThan(10);
  });
  for (const [name, re] of FORBIDDEN) {
    it(`no ${name} in src/`, () => {
      const hits = all.flatMap((f) =>
        readFileSync(f, 'utf8')
          .split(/\r?\n/)
          .map((line, i) => ({ f, line, n: i + 1 }))
          .filter(({ line }) => re.test(line))
          .map(({ f, n, line }) => `${f.slice(SRC.length + 1)}:${n}: ${line.trim()}`),
      );
      expect(hits).toEqual([]);
    });
  }
});
