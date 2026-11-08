/** v2 T20: variants — a member tuned for one ship, never the library. */
import { describe, expect, it } from 'vitest';
import { buildRunPlan, renderKickoffPrompt, renderRunPlan } from '../../src/domain/export';
import { preflight } from '../../src/domain/preflight';
import { isStage, type Ship } from '../../src/domain/schema';
import { defaultShip } from '../../src/domain/ship';
import { shipHash, simulate } from '../../src/domain/trial';
import { effectiveModel, isTuned, normalizeOverride, setOverride, variantName } from '../../src/domain/variant';
import { BRIEFS } from '../../src/domain/briefs';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-11-08T00:00:00.000Z';
const fresh = (): Ship => structuredClone(defaultShip(idx, AT));
const CD = 'D:/Convenium.Design';

function tune(ship: Ship, agent: string, o: Parameters<typeof setOverride>[3]): Ship {
  const m = ship.crew.find((x) => x.agent === agent)!;
  const r = setOverride(idx, ship, m.id, o);
  if (!r.ok) throw new Error(r.reason);
  return r.ship;
}

describe('overrides', () => {
  it('normalise away a model equal to the library and an empty addendum', () => {
    const ship = fresh();
    const m = ship.crew.find((x) => x.agent === 'design-engineer')!;
    const lib = idx.agent.get('design-engineer')!.model as 'opus' | 'sonnet' | 'haiku';
    expect(normalizeOverride(idx, m, { model: lib, addendum: '   ' })).toBeNull();
    expect(setOverride(idx, ship, m.id, { model: lib })).toEqual({ ok: false, reason: 'No change.' });
    expect(normalizeOverride(idx, m, { model: lib === 'opus' ? 'sonnet' : 'opus', addendum: ' Keep it short. ' })).toEqual({ model: lib === 'opus' ? 'sonnet' : 'opus', addendum: 'Keep it short.' });
  });

  it('change the exported model and the kickoff, never the library agent', () => {
    const before = idx.agent.get('design-engineer')!.model;
    const ship = tune(fresh(), 'design-engineer', { model: 'opus', addendum: 'Prefer CSS over JavaScript for motion.' });
    const m = ship.crew.find((x) => x.agent === 'design-engineer')!;
    expect(effectiveModel(idx, m)).toBe('opus');
    expect(isTuned(idx, m)).toBe(before !== 'opus' || true);
    const plan = buildRunPlan(idx, ship, CD);
    const builds = plan.phases.filter((p) => p.agent === 'design-engineer');
    expect(builds.length).toBeGreaterThan(0);
    expect(builds.every((p) => p.model === 'opus')).toBe(true);
    expect(renderRunPlan(idx, ship, CD, AT)).toContain(`spawns at opus (library: ${before})`);
    expect(renderKickoffPrompt(ship, CD)).toContain('Prefer CSS over JavaScript for motion.');
    expect(idx.agent.get('design-engineer')!.model).toBe(before);
  });

  it('feed pre-flight: a builder raised above the critic warns (PF-11); a widening addendum warns (PF-16)', () => {
    let ship = fresh();
    expect(preflight(idx, ship).checks.find((c) => c.id === 'PF-16')!.status).toBe('na');
    const critic = idx.agent.get('independent-critic')!.model;
    if (critic !== 'opus') {
      ship = tune(ship, 'design-engineer', { model: 'opus' });
      expect(preflight(idx, ship).checks.find((c) => c.id === 'PF-11')!.status).toBe('warn');
    }
    ship = tune(fresh(), 'design-engineer', { addendum: 'Spawn a subagent to check the copy, and also use reference-deconstruction.' });
    const pf16 = preflight(idx, ship).checks.find((c) => c.id === 'PF-16')!;
    expect(pf16.status).toBe('warn');
    expect(pf16.findings.map((f) => f.reason).join(' ')).toMatch(/Spawn|subagent/i);
    expect(pf16.findings.map((f) => f.reason).join(' ')).toContain('reference-deconstruction');
    // a harmless addendum passes
    ship = tune(fresh(), 'design-engineer', { addendum: 'Keep every motion under 300 ms.' });
    expect(preflight(idx, ship).checks.find((c) => c.id === 'PF-16')!.status).toBe('pass');
  });

  it('change the ship hash and the trial economy, so a variant is a different entrant', () => {
    const a = fresh();
    const b = tune(fresh(), 'design-engineer', { model: 'haiku' });
    expect(shipHash(a)).not.toBe(shipHash(b));
    const brief = BRIEFS[0];
    const ea = simulate(a, brief, idx).score.criteria.economy.why;
    const eb = simulate(b, brief, idx).score.criteria.economy.why;
    expect(ea).not.toBe(eb);
  });
});

describe('variant names', () => {
  it('take the next free letter', () => {
    expect(variantName('SS Full Run', [])).toBe('SS Full Run B');
    expect(variantName('SS Full Run', ['SS Full Run B'])).toBe('SS Full Run C');
    expect(variantName('SS Full Run B', ['SS Full Run B'])).toBe('SS Full Run C');
  });
});

it('the default ship still has stages (sanity for the tests above)', () => {
  expect(fresh().voyage.filter(isStage).length).toBeGreaterThan(0);
});
