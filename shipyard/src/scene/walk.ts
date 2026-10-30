// Free roam (spec › Phase 1.6): where you may stand, how a step slides along walls, how the
// autopilot finds its way, and which card a position shows. Pure functions over a static 2D map of
// the floor (x, z in metres); no React, no three. Unit-tested in tests/unit/scene-walk.test.ts.
//
// Ported from ArkhEthos `walk.ts`. The floor map is now generated from the ship's layout
// (06 section 6.3, port map): a station nobody holds has no body to walk round, and the gauge bay's
// body and console are obstacles only when the fleet measurer is aboard. Numbers are unchanged.
import { BRIDGE, CORRIDOR, inFront, STATIONS, STATION_KEYS, type Layout, type StationKey } from './stations';

export interface P2 {
  x: number;
  z: number;
}
interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}
type Obstacle = ({ kind: 'circle'; r: number } & P2) | ({ kind: 'box' } & Rect);

/** The walker's body radius: obstacles and walls keep this far from the eye. */
export const BODY = 0.3;

/** Floor you may stand on, already inset by the body radius. Corridor and bridge meet at the mouth. */
const WALKABLE: readonly Rect[] = [
  { x0: -CORRIDOR.halfWidth + 0.5, x1: CORRIDOR.halfWidth - 0.5, z0: CORRIDOR.zEnd - 0.6, z1: CORRIDOR.zStart - 1.5 },
  { x0: BRIDGE.xMin + 0.5, x1: BRIDGE.xMax - 0.5, z0: BRIDGE.zBack + 0.6, z1: BRIDGE.zFront - 0.4 },
];

const circle = (p: readonly [number, number, number], r: number): Obstacle => ({ kind: 'circle', x: p[0], z: p[2], r });
const box = (x0: number, x1: number, z0: number, z1: number): Obstacle => ({ kind: 'box', x0, x1, z0, z1 });

/** What stands on the floor regardless of who is aboard: corridor fittings, pillars, the railing and the furniture. */
const FIXED: readonly Obstacle[] = [
  // Corridor: lockers on the right wall, wall displays on the left, the pipe drop at the mouth.
  box(1.2, 2.0, 18.0, 20.0),
  box(1.2, 2.0, 8.0, 10.0),
  box(-2.0, -0.95, 10.5, 11.5),
  box(-2.0, -0.95, 4.5, 5.5),
  circle([1.8, 0, 3.4], 0.2),
  // Bridge corners: support pillars.
  circle([BRIDGE.xMin + 1, 0, BRIDGE.zFront - 1], 0.5),
  circle([BRIDGE.xMax - 1, 0, BRIDGE.zFront - 1], 0.5),
  circle([BRIDGE.xMin + 1, 0, BRIDGE.zBack + 1], 0.5),
  circle([BRIDGE.xMax - 1, 0, BRIDGE.zBack + 1], 0.5),
  // The captain's railing in front of the console (walk round its ends onto the dais).
  box(-1.7, 1.7, -5.85, -5.55),
  // The console or prop in front of each of the seven original stations.
  ...(STATION_KEYS.filter((k) => k !== 'gauge') as StationKey[]).map((k) => circle(inFront(k), 0.55)),
  // Analyst's seat; media hold barrels, crate and containers; the mast readout.
  circle(inFront('analyst', 0.9, 0.9), 0.45),
  circle(inFront('producer', 0.9, -0.6), 0.4),
  circle(inFront('producer', 0.9, 0.7, -0.4), 0.4),
  circle(inFront('producer', 0.9, 0.1, 0.8), 0.5),
  box(-3.5, -1.7, -10.9, -10.0),
  circle([-4.5, 0, -10.3], 0.7),
  circle([-0.9, 0, -10.4], 0.6),
  circle([3.45, 0, -8.15], 0.55),
  // Critic's lectern and the engineer's workbench are wider than a console; the barrels and rack.
  circle(inFront('critic'), 0.75),
  circle(inFront('engineer'), 0.95),
  circle(inFront('engineer', 0.9, 0, 1.2), 0.45),
  box(7.4, 8.0, -2.9, -1.5),
];

/** Free floor the autopilot may route through besides the waypoint cameras. */
const NODES: readonly P2[] = [
  { x: 0, z: 2.6 },
  { x: 0, z: -1.2 },
  { x: -2.6, z: -4.6 },
  { x: 2.6, z: -4.6 },
  { x: -2.4, z: -6.9 },
  { x: 2.4, z: -6.9 },
  { x: 0, z: 9 },
];

/** How near a station counts as being at it, and how far you may drift before its card goes. */
export const NEAR = { enter: 4.2, leave: 5.0 } as const;
/** Metres of distance one radian of looking away is worth when choosing whose card to show. */
const GAZE_WEIGHT = 2.5;
const AIRLOCK_Z = 17;

/** Eye height above the floor: the captain's dais is a 0.24 m step. */
export function floorAt(p: P2): number {
  return (p.x - 0) ** 2 + (p.z + 7.5) ** 2 < 2.0 ** 2 ? 0.24 : 0;
}

function inRect(p: P2, r: Rect): boolean {
  return p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1;
}

function hits(p: P2, o: Obstacle): boolean {
  if (o.kind === 'circle') return (p.x - o.x) ** 2 + (p.z - o.z) ** 2 < (o.r + BODY) ** 2;
  return p.x > o.x0 - BODY && p.x < o.x1 + BODY && p.z > o.z0 - BODY && p.z < o.z1 + BODY;
}

export interface WalkMap {
  layout: Layout;
  obstacles: readonly Obstacle[];
  isFree(p: P2): boolean;
  slide(p: P2, dx: number, dz: number): P2;
  clearPath(a: P2, b: P2): boolean;
  camOf(i: number): P2;
  route(from: P2, to: P2): P2[];
  viewOf(i: number): { yaw: number; pitch: number };
  zoneAt(p: P2, yaw: number, current: number | null): number | null;
}

/** The floor map for one ship's layout. */
export function createWalkMap(layout: Layout): WalkMap {
  const { tour } = layout;
  const obstacles: Obstacle[] = [
    ...FIXED,
    // Every crew member who stands at a station.
    ...[...layout.occupied].map((k) => circle(STATIONS[k].position, 0.55)),
    // The gauge bay: the console in front of the fleet measurer, only when somebody is there.
    ...(layout.occupied.has('gauge') ? [circle(inFront('gauge'), 0.55)] : []),
  ];

  const isFree = (p: P2): boolean => WALKABLE.some((r) => inRect(p, r)) && !obstacles.some((o) => hits(p, o));

  /**
   * One step from `p` by (dx, dz), sliding along whatever is in the way: the move is split into short
   * sub-steps and each axis is tried on its own, so walking into a wall at an angle keeps the
   * component along it.
   */
  const slide = (p: P2, dx: number, dz: number): P2 => {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
    let x = p.x;
    let z = p.z;
    for (let i = 0; i < n; i++) {
      if (isFree({ x: x + dx / n, z })) x += dx / n;
      if (isFree({ x, z: z + dz / n })) z += dz / n;
    }
    return { x, z };
  };

  /** A straight walk from a to b stays on free floor (sampled every 10 cm). */
  const clearPath = (a: P2, b: P2): boolean => {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (!isFree({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })) return false;
    }
    return true;
  };

  const camOf = (i: number): P2 => ({ x: tour[i].camera[0], z: tour[i].camera[2] });

  /**
   * The autopilot's way from `from` to `to`: the shortest chain over a visibility graph of the
   * waypoint cameras and a few free nodes. The start is excluded from the result; the last point
   * is `to`. Falls back to a straight line when nothing connects (the walk then slides).
   */
  const route = (from: P2, to: P2): P2[] => {
    if (clearPath(from, to)) return [to];
    const pts: P2[] = [from, to, ...NODES, ...tour.map((_, i) => camOf(i))];
    const n = pts.length;
    const dist = new Array<number>(n).fill(Infinity);
    const prev = new Array<number>(n).fill(-1);
    const done = new Array<boolean>(n).fill(false);
    dist[0] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || u === 1) break;
      done[u] = true;
      for (let v = 0; v < n; v++) {
        if (done[v] || v === u) continue;
        const d = dist[u] + Math.hypot(pts[v].x - pts[u].x, pts[v].z - pts[u].z);
        if (d < dist[v] && clearPath(pts[u], pts[v])) {
          dist[v] = d;
          prev[v] = u;
        }
      }
    }
    if (dist[1] === Infinity) return [to];
    const out: P2[] = [];
    for (let v = 1; v > 0; v = prev[v]) out.unshift(pts[v]);
    return out;
  };

  /** The view a waypoint frames: yaw (0 looks down -z, + turns left) and pitch (+ looks up). */
  const viewOf = (i: number): { yaw: number; pitch: number } => {
    const [cx, cy, cz] = tour[i].camera;
    const [lx, ly, lz] = tour[i].look;
    const dx = lx - cx;
    const dz = lz - cz;
    return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - cy, Math.hypot(dx, dz)) };
  };

  /**
   * Which waypoint card a position shows: the airlock zone, the corridor, the crew member you are
   * near and looking at, or null on open bridge floor. The current member is kept until you are
   * `NEAR.leave` away or clearly facing someone else, so the card does not flicker.
   */
  const zoneAt = (p: P2, yaw: number, current: number | null): number | null => {
    if (p.z > AIRLOCK_Z) return 0;
    if (p.z > CORRIDOR.zEnd) return 1;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const measure = (i: number) => {
      const [x, , z] = STATIONS[tour[i].key!].position;
      const dx = x - p.x;
      const dz = z - p.z;
      const d = Math.hypot(dx, dz);
      const off = d > 1e-6 ? Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / d))) : 0;
      return { d, score: d + GAZE_WEIGHT * off };
    };
    let best: number | null = null;
    let bestScore = Infinity;
    for (let i = 0; i < tour.length; i++) {
      if (!tour[i].key) continue;
      const m = measure(i);
      if (m.d <= NEAR.enter && m.score < bestScore) {
        best = i;
        bestScore = m.score;
      }
    }
    if (current !== null && tour[current]?.key) {
      const c = measure(current);
      if (c.d <= NEAR.leave && c.score <= bestScore + 0.8) return current;
    }
    return best;
  };

  return { layout, obstacles, isFree, slide, clearPath, camOf, route, viewOf, zoneAt };
}
