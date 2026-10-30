import { describe, expect, it } from 'vitest';
import { libraryShip, LIBRARY_EPOCH } from '../../src/domain/ship';
import { BODIES, BODY_GLBS } from '../../src/scene/bodies';
import { sceneCrew, screenLines } from '../../src/scene/crew';
import { layoutFor, STATION_KEYS } from '../../src/scene/stations';
import { pipelineOf } from '../../src/features/board/pipeline';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const ship = libraryShip(idx, idx.kb.workflows.default, LIBRARY_EPOCH);

describe('the scene crew of SS Full Run', () => {
  const crew = sceneCrew(idx, ship);

  it('is the ships seven crew in station order, each on one of the seven owned bodies', () => {
    expect(crew.map((m) => m.id)).toEqual(['captain', 'strategist', 'analyst', 'critic', 'engineer', 'producer', 'metrics']);
    for (const m of crew) {
      expect(m.model.glb, m.id).toBe(BODIES[m.body].glb);
      expect(m.model.glb, m.id).not.toBeNull();
      expect(m.recruit, m.id).toBe(false);
    }
  });

  it('points only at media files that exist (the imported set)', () => {
    for (const glb of BODY_GLBS) expect(existsSync(resolve('public', glb.replace(/^\//, ''))), glb).toBe(true);
    for (const b of Object.values(BODIES)) if (b.sheet) for (const size of [640, 1280]) expect(existsSync(resolve('public/media', `${b.sheet}-${size}.webp`)), `${b.sheet}-${size}`).toBe(true);
  });

  it('resolves every worn artifact to a family, a pigment and a bone from the knowledge base', () => {
    const captain = crew.find((m) => m.id === 'captain')!;
    expect(captain.loadout).toHaveLength(9);
    for (const a of captain.loadout) {
      expect(a.family, a.skill).toMatch(/^[a-z]+$/);
      expect(a.pigment, a.skill).toMatch(/^#[0-9a-f]{6}$/i);
      expect(a.slot.bone, a.skill).toBeTruthy();
    }
    expect(new Set(captain.loadout.map((a) => a.anchor)).size).toBe(6);
  });

  it('lists the active artifact and the carry count on the holo screen', () => {
    const captain = crew.find((m) => m.id === 'captain')!;
    expect(captain.active).toBe('olympus-design-director');
    const lines = screenLines(captain);
    expect(lines[0]).toBe('Active: olympus-design-director');
    expect(lines[1]).toBe('carries 9');
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  it('carries the narrative fields the identity card shows', () => {
    const captain = crew.find((m) => m.id === 'captain')!;
    expect(captain.role.title).toBe('Captain and orchestrator');
    expect(captain.strengths.length).toBeGreaterThan(0);
    expect(captain.blindSpots.length).toBeGreaterThan(0);
  });
});

describe('the fleet ship', () => {
  it('seats the fleet measurer at the eighth station on the procedural stand-in', () => {
    const fleet = libraryShip(idx, 'ss-mobile-fleet', LIBRARY_EPOCH);
    const crew = sceneCrew(idx, fleet);
    const gauge = crew.find((m) => m.id === 'gauge');
    expect(gauge?.body).toBe('standin');
    expect(gauge?.model.glb).toBeNull();
    const layout = layoutFor(fleet.crew);
    expect(layout.keyOf('gauge')).toBe(STATION_KEYS[7]);
    expect(layout.occupied.has('gauge')).toBe(true);
  });
});

describe('the corridor card pipeline', () => {
  it('reads phases, owners and gates from the ship, in voyage order', () => {
    const steps = pipelineOf(ship, sceneCrew(idx, ship));
    expect(steps[0].phase).toBe('diagnose');
    expect(steps[0].members.map((m) => m.id)).toContain('captain');
    expect(steps.some((s) => s.gate?.includes('Gate A'))).toBe(true);
    expect(steps.filter((s) => s.gate).length).toBe(ship.voyage.filter((v) => v.kind === 'gate').length);
    for (const s of steps) expect(s.gate ?? '').not.toMatch(/^Gate [A-Z]: Gate/);
  });
});
