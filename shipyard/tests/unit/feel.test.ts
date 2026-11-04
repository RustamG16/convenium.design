import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FEEL, feelMs, largeSeen, markLargeSeen, playLarge, readLargeSeen, TIERS, tierOf, type FeelKind } from '../../src/lib/feel';

const design = readFileSync(fileURLToPath(new URL('../../DESIGN.md', import.meta.url)), 'utf8');
const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('feedback tiers', () => {
  it('match DESIGN.md: small 150-200, medium 400-700, large 900 max', () => {
    expect(design).toContain('small 150');
    expect(design).toContain('200ms (equip, socket, toggle)');
    expect(design).toContain('medium 400');
    expect(design).toContain('700ms (check turns green, commission)');
    expect(design).toContain('large 900ms max (clean pre-flight, first time per ship only)');
    expect(TIERS.small).toEqual({ min: 150, max: 200 });
    expect(TIERS.medium).toEqual({ min: 400, max: 700 });
    expect(TIERS.large.max).toBe(900);
  });
  it('every feedback moment plays inside its tier', () => {
    for (const kind of Object.keys(FEEL) as FeelKind[]) {
      const { min, max } = TIERS[tierOf(kind)];
      expect(feelMs(kind)).toBeGreaterThanOrEqual(min);
      expect(feelMs(kind)).toBeLessThanOrEqual(max);
    }
  });
  it('routine actions are small, outcomes medium, only the cleared ship is large', () => {
    expect(tierOf('hover')).toBe('small');
    expect(tierOf('unequip')).toBe('small');
    expect(tierOf('check-flip')).toBe('medium');
    expect(tierOf('equip-arrival')).toBe('medium');
    expect(tierOf('commission')).toBe('medium');
    expect(Object.entries(FEEL).filter(([, t]) => t === 'large').map(([k]) => k)).toEqual(['clean-preflight']);
  });
  it('carries no score or reward: only tiers, kinds and durations', () => {
    expect(Object.keys(TIERS)).toEqual(['small', 'medium', 'large']);
    for (const t of Object.values(TIERS)) expect(Object.keys(t).sort()).toEqual(['max', 'min']);
  });
});

describe('large feedback, once per ship', () => {
  it('plays on a true outcome the first time, never again for that ship', () => {
    const storage = memory();
    expect(playLarge('a', readLargeSeen(storage), true)).toBe(true);
    markLargeSeen('a', storage);
    expect(playLarge('a', readLargeSeen(storage), true)).toBe(false);
    expect(playLarge('b', readLargeSeen(storage), true)).toBe(true);
  });
  it('does not play without the outcome', () => {
    expect(playLarge('z', new Set(), false)).toBe(false);
  });
  it('still holds for the session when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    markLargeSeen('blocked-ship', blocked);
    expect(largeSeen(null).has('blocked-ship')).toBe(true);
  });
  it('treats a corrupt record as empty', () => {
    expect(readLargeSeen({ getItem: () => '{not json' }).size).toBe(0);
    expect(readLargeSeen({ getItem: () => '"x"' }).size).toBe(0);
  });
});
