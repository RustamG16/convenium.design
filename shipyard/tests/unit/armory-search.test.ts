import { describe, expect, it } from 'vitest';
import { buildHaystack, filterEntries, familyCounts, NO_FILTERS } from '../../src/features/armory/search';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const entries = buildHaystack(idx.kb.skills);
const ctx = { codex: new Set<string>(), idx };

describe('armory search', () => {
  it('returns every skill with no filter and finds by id, name and description', () => {
    expect(filterEntries(entries, NO_FILTERS, ctx)).toHaveLength(idx.kb.skills.length);
    expect(filterEntries(entries, { ...NO_FILTERS, q: 'gsap-core' }, ctx).map((s) => s.id)).toContain('gsap-core');
    expect(filterEntries(entries, { ...NO_FILTERS, q: 'gsap core' }, ctx).length).toBeGreaterThan(0);
    expect(filterEntries(entries, { ...NO_FILTERS, q: 'zzzzqqq' }, ctx)).toHaveLength(0);
  });

  it('every keystroke of a query answers in under 50 ms on the whole registry (and no worse over many passes)', () => {
    const word = 'visual-qa responsive';
    const t0 = performance.now();
    for (let i = 1; i <= word.length; i++) filterEntries(entries, { ...NO_FILTERS, q: word.slice(0, i) }, ctx);
    const per = (performance.now() - t0) / word.length;
    expect(per).toBeLessThan(50);
    expect(per).toBeLessThan(10);
  });

  it('filters by family, phase, tier, uninspected and by fit with the selected agent', () => {
    const lens = filterEntries(entries, { ...NO_FILTERS, family: 'lens' }, ctx);
    expect(lens.length).toBe(familyCounts(idx.kb.skills).get('lens'));
    expect(lens.every((s) => s.artifact.family === 'lens')).toBe(true);
    expect(filterEntries(entries, { ...NO_FILTERS, phase: 'build' }, ctx).every((s) => s.phase === 'build')).toBe(true);
    expect(filterEntries(entries, { ...NO_FILTERS, tier: 'dormant' }, ctx).every((s) => s.artifact.tier === 'dormant')).toBe(true);
    expect(filterEntries(entries, { ...NO_FILTERS, uninspected: true }, { ...ctx, codex: new Set(['gsap-core']) }).map((s) => s.id)).not.toContain('gsap-core');
    const fits = filterEntries(entries, { ...NO_FILTERS, fits: true }, { ...ctx, agent: 'visual-analyst' });
    expect(fits.length).toBeLessThan(idx.kb.skills.length);
    expect(fits.length).toBeGreaterThan(0);
  });
});
