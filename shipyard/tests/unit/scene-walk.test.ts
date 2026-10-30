import { describe, expect, it } from 'vitest';
import { BRIDGE, CORRIDOR, DEFAULT_LAYOUT, inFront, layoutFor, STATIONS, STATION_KEYS } from '../../src/scene/stations';
import { escapeReleases, keyAction, mouseLook, moveOf, shouldSkipBoarding, walkKey } from '../../src/scene/tourModel';
import { createWalkMap, floorAt, NEAR } from '../../src/scene/walk';

// Free roam (the ArkhEthos ship-tour spec, phase 1.6) on Shipyard's generated floor map. The default
// layout is the ArkhEthos ship (seven crew on stations 1-7); the fleet layout adds the gauge bay.
const withGauge = layoutFor(STATION_KEYS.map((id, i) => ({ id, station: i + 1 })));
const maps = [
  ['default ship (7 crew)', DEFAULT_LAYOUT],
  ['fleet ship (8 crew, gauge bay)', withGauge],
] as const;

describe.each(maps)('floor map: %s', (_name, layout) => {
  const m = createWalkMap(layout);
  const tour = layout.tour;

  it('lets every waypoint camera stand on free floor', () => {
    for (let i = 0; i < tour.length; i++) expect(m.isFree(m.camOf(i)), tour[i].id).toBe(true);
  });
  it('keeps you off the crew who are aboard, out of the walls and inside the ship', () => {
    for (const k of layout.occupied) expect(m.isFree({ x: STATIONS[k].position[0], z: STATIONS[k].position[2] }), k).toBe(false);
    expect(m.isFree({ x: CORRIDOR.halfWidth, z: 12 })).toBe(false);
    expect(m.isFree({ x: 0, z: CORRIDOR.zStart + 1 })).toBe(false);
    expect(m.isFree({ x: 4, z: 3 })).toBe(false);
  });
  it('never ends inside an obstacle when pushed at one', () => {
    const start = m.camOf(tour.findIndex((w) => w.id === 'engineer'));
    const p = m.slide(start, 5, 0);
    expect(m.isFree(p)).toBe(true);
    expect(p.x).toBeLessThan(STATIONS.engineer.position[0]);
  });
  it('autopilot reaches every waypoint from every waypoint along clear legs', () => {
    for (let a = 0; a < tour.length; a++)
      for (let b = 0; b < tour.length; b++) {
        if (a === b) continue;
        const path = m.route(m.camOf(a), m.camOf(b));
        expect(path.at(-1), `${tour[a].id} -> ${tour[b].id}`).toEqual(m.camOf(b));
        let from = m.camOf(a);
        for (const p of path) {
          expect(m.clearPath(from, p), `${tour[a].id} -> ${tour[b].id}`).toBe(true);
          from = p;
        }
      }
  });
  it('shows each station card from a cold start at its waypoint, facing it', () => {
    expect(m.zoneAt({ x: 0, z: 22 }, 0, null)).toBe(0);
    expect(m.zoneAt({ x: 0, z: 10 }, 0, null)).toBe(1);
    for (let i = 2; i < tour.length; i++) expect(m.zoneAt(m.camOf(i), m.viewOf(i).yaw, null), tour[i].id).toBe(i);
  });
  it('keeps the current station until you walk clearly away', () => {
    const i = tour.findIndex((w) => w.id === 'engineer');
    const [x, , z] = STATIONS.engineer.position;
    const facing = -Math.PI / 2;
    expect(m.zoneAt({ x: x - NEAR.enter - 0.3, z }, facing, i)).toBe(i);
    expect(m.zoneAt({ x: x - NEAR.leave - 0.3, z }, facing, i)).not.toBe(i);
  });
});

describe('the ArkhEthos numbers survive the port', () => {
  it('keeps the seven stations and cameras exactly', () => {
    expect(STATIONS.captain.position).toEqual([0, 0, -7.5]);
    expect(STATIONS.engineer.position).toEqual([5.6, 0, -2.2]);
    expect(DEFAULT_LAYOUT.tour.map((w) => w.id)).toEqual(['airlock', 'corridor', 'strategist', 'analyst', 'producer', 'metrics', 'critic', 'engineer', 'captain']);
    expect(DEFAULT_LAYOUT.tour[0].camera).toEqual([0, 1.6, 22.5]);
    expect(DEFAULT_LAYOUT.tour.at(-1)?.camera).toEqual([0, 1.6, -4.2]);
    expect(DEFAULT_LAYOUT.welcome).toBe('captain');
  });
  it('the dais is a low step you can climb', () => {
    expect(floorAt({ x: -1.4, z: -6.4 })).toBeCloseTo(0.24);
    expect(floorAt({ x: 0, z: 0 })).toBe(0);
  });
  it('turns the airlock view down the corridor and the captain view toward him', () => {
    const m = createWalkMap(DEFAULT_LAYOUT);
    expect(m.viewOf(0).yaw).toBeCloseTo(0, 5);
    expect(m.viewOf(DEFAULT_LAYOUT.tour.length - 1).yaw).toBeCloseTo(0, 5);
  });
  it('keeps the bridge extents', () => {
    expect(BRIDGE).toEqual({ xMin: -8, xMax: 8, zFront: 2, zBack: -11, height: 4.2 });
  });
});

describe('the gauge bay (station 8)', () => {
  const gauge = STATIONS.gauge.position;
  it('stands at [0, 0, -3.6] in the centre aisle, between the dais and the entrance', () => {
    expect(gauge).toEqual([0, 0, -3.6]);
    expect(gauge[2]).toBeGreaterThan(-7.5);
    expect(gauge[2]).toBeLessThan(2);
  });
  it('adds a stop and moves the captain eye past its 0.85 m collision circle, without touching the default ship', () => {
    expect(withGauge.tour.map((w) => w.id)).toContain('gauge');
    expect(withGauge.tour.at(-1)?.id).toBe('captain');
    expect(withGauge.tour.at(-1)?.camera).toEqual([0, 1.6, -4.9]);
    expect(DEFAULT_LAYOUT.tour.map((w) => w.id)).not.toContain('gauge');
    expect(createWalkMap(DEFAULT_LAYOUT).isFree({ x: 0, z: -3.6 })).toBe(true);
  });
  it('blocks the body and its console only when somebody stands there', () => {
    const m = createWalkMap(withGauge);
    expect(m.isFree({ x: gauge[0], z: gauge[2] })).toBe(false);
    const console = inFront('gauge');
    expect(m.isFree({ x: console[0], z: console[2] })).toBe(false);
    // The aisle either side stays open: you can walk round it to the captain.
    expect(m.isFree({ x: 1.5, z: -3.6 })).toBe(true);
    expect(m.isFree({ x: -1.5, z: -3.6 })).toBe(true);
    const gaugeStop = withGauge.tour.findIndex((w) => w.id === 'gauge');
    const there = m.route(m.camOf(gaugeStop), m.camOf(withGauge.tour.length - 1));
    expect(there.length).toBeGreaterThan(1);
  });
});

describe('layout of a custom crew', () => {
  it('seats a duplicate station number at the next free station, so nobody stands inside anybody', () => {
    const l = layoutFor([
      { id: 'a', station: 1 },
      { id: 'b', station: 1 },
      { id: 'c', station: 3 },
    ]);
    expect(new Set(l.seats.map((s) => s.key)).size).toBe(3);
    expect(l.keyOf('c')).toBe('analyst');
  });
  it('leaves empty stations dark (no stop, no collision body) and ends the walk on station 1', () => {
    const l = layoutFor([{ id: 'only', station: 1 }]);
    expect(l.tour.map((w) => w.id)).toEqual(['airlock', 'corridor', 'captain']);
    expect(l.welcome).toBe('only');
    const m = createWalkMap(l);
    expect(m.isFree({ x: STATIONS.strategist.position[0], z: STATIONS.strategist.position[2] })).toBe(true);
  });
});

describe('walk controls', () => {
  it('maps keys and held keys', () => {
    expect(walkKey('KeyW')).toBe('forward');
    expect(walkKey('Enter')).toBeNull();
    expect(moveOf(new Set(['forward', 'turnLeft']))).toEqual({ forward: 1, side: 0, turn: -1 });
  });
  it('Space steps on, 1-9 jumps, Escape skips', () => {
    expect(keyAction(' ', 0, 9)).toEqual({ type: 'go', index: 1 });
    expect(keyAction('3', 0, 9)).toEqual({ type: 'go', index: 2 });
    expect(keyAction('9', 0, 8)).toBeNull();
    expect(keyAction('Escape', 4, 9)).toEqual({ type: 'skip' });
  });
  it('drops a capture spike and releases on Escape just after release', () => {
    expect(mouseLook(500, 0)).toBeNull();
    expect(mouseLook(10, 0)?.yaw).toBeLessThan(0);
    expect(escapeReleases(false, 100)).toBe(true);
    expect(escapeReleases(false, 400)).toBe(false);
  });
});

describe('the walk plays once per ship', () => {
  it('skips for the DOM view and after the first play; a replay always plays when the scene can run', () => {
    expect(shouldSkipBoarding({ twoD: true, seen: false, replay: true })).toBe(true);
    expect(shouldSkipBoarding({ twoD: false, seen: false, replay: false })).toBe(false);
    expect(shouldSkipBoarding({ twoD: false, seen: true, replay: false })).toBe(true);
    expect(shouldSkipBoarding({ twoD: false, seen: true, replay: true })).toBe(false);
  });
});
