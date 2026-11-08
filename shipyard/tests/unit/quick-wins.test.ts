/** v2 T16: the critic's n1, n3 and n4 as numbers, so they cannot drift back. */
import { describe, expect, it } from 'vitest';
import { defaultShip } from '../../src/domain/ship';
import { isStage } from '../../src/domain/schema';
import { fixNames, fixTarget } from '../../src/features/preflight/fix';
import { fitWidth, MIN_FOCUS_FILL } from '../../src/features/hangar/FleetRing';
import { ACTIVE_ORBIT_LIFT, ORBIT_STAGGER, orbitPhase } from '../../src/scene/artifacts/WornArtifacts';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-11-08T00:00:00.000Z';

describe('n1: the focused hull keeps its size', () => {
  it('never needs more than HULL_LENGTH / MIN_FOCUS_FILL of width, whatever the fleet size', () => {
    for (let n = 2; n <= 9; n++) expect(fitWidth(n)).toBeLessThanOrEqual(3.9 / MIN_FOCUS_FILL + 1e-9);
    expect(fitWidth(1)).toBe(4.5);
  });
});

describe('n3: resting orbiters spread across the front arc', () => {
  it('centres one item on the viewer and keeps several within the front half, evenly spaced', () => {
    expect(orbitPhase(0, 1)).toBeCloseTo(Math.PI / 2);
    const ph = [0, 1, 2, 3].map((i) => orbitPhase(i, 4));
    for (const p of ph) expect(Math.abs(p - Math.PI / 2)).toBeLessThan(Math.PI / 2);
    const gaps = ph.slice(1).map((p, i) => p - ph[i]);
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0]);
    expect(ACTIVE_ORBIT_LIFT).toBeGreaterThan(ORBIT_STAGGER);
  });
});

describe('n4: fix labels name things, not ids', () => {
  const ship = defaultShip(idx, AT);
  const names = fixNames(ship, idx);
  const stage = ship.voyage.find(isStage)!;
  const check = { id: 'PF-03' };
  it('uses the stage label', () => {
    expect(fixTarget(ship.id, check, { severity: 'block', reason: 'r', fix: { kind: 'stage', id: stage.id } }, names)?.label).toBe(`Fix the ${stage.label} stage`);
  });
  it("uses the member's name and the artifact's name", () => {
    const m = ship.crew[0];
    const skill = idx.kb.skills[0];
    const label = fixTarget(ship.id, check, { severity: 'info', reason: 'r', fix: { kind: 'socket', member: m.id, skill: skill.id } }, names)?.label;
    expect(label).toBe(`Open ${m.character.name}'s ${skill.name}`);
  });
  it('falls back to the id only for an unknown (retired) item', () => {
    expect(names.skill?.('no-such-skill')).toBe('no-such-skill');
  });
});
