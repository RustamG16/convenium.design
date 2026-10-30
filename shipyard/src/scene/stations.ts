// Where everything stands inside the ship, in metres. The corridor runs along +z toward the
// airlock; the bridge opens at z = 2 and ends at z = -11. The camera walks the tour in order and
// looks at each waypoint's target; the captain comes last so the welcome closes the walk.
//
// Ported from ArkhEthos `features/ship/data/stations.ts`. Every position, yaw, camera and look
// number is kept. Two changes (06 section 6): (1) there are eight stations, the eighth a gauge bay
// for the fleet measurer at [0, 0, -3.6] in the centre aisle; (2) the tour is built from the
// ship's own crew (`layoutFor`) instead of the fixed seven, and a station nobody holds is dark
// (no body, no screen, no collision for the body) while its furniture stays.
import type { Vector3Tuple } from 'three';

export const EYE = 1.6;
export const BRIDGE = { xMin: -8, xMax: 8, zFront: 2, zBack: -11, height: 4.2 } as const;
export const CORRIDOR = { zStart: 26, zEnd: 2, halfWidth: 2 } as const;

export type StationProp = 'dais' | 'still' | 'console' | 'alcove' | 'bench' | 'hold' | 'mast';

/** The eight stations, named for the crew the library seats there (crew.json `station` 1..8). */
export type StationKey = 'captain' | 'strategist' | 'analyst' | 'critic' | 'engineer' | 'producer' | 'metrics' | 'gauge';
export const STATION_KEYS: readonly StationKey[] = ['captain', 'strategist', 'analyst', 'critic', 'engineer', 'producer', 'metrics', 'gauge'];

export interface Station {
  position: Vector3Tuple;
  /** Which way the character faces at rest (radians about y; 0 = toward +z, the entrance). */
  yaw: number;
  prop: StationProp;
}

export const STATIONS: Record<StationKey, Station> = {
  captain: { position: [0, 0, -7.5], yaw: 0, prop: 'dais' },
  strategist: { position: [-5.2, 0, -2.2], yaw: Math.PI / 2, prop: 'still' },
  analyst: { position: [-5.6, 0, -6.2], yaw: Math.PI / 2, prop: 'console' },
  producer: { position: [-2.6, 0, -9.4], yaw: 0, prop: 'hold' },
  metrics: { position: [3.1, 0, -9.6], yaw: 0, prop: 'mast' },
  critic: { position: [6.2, 0, -8.6], yaw: -Math.PI * 0.7, prop: 'alcove' },
  engineer: { position: [5.6, 0, -2.2], yaw: -Math.PI / 2, prop: 'bench' },
  // The gauge bay: centre aisle between the dais and the entrance, facing the visitor (06 section 6.3).
  gauge: { position: [0, 0, -3.6], yaw: 0, prop: 'console' },
};

export interface Waypoint {
  id: string;
  /** Crew member id when the waypoint is a station. */
  member?: string;
  /** The station the member stands at. */
  key?: StationKey;
  camera: Vector3Tuple;
  /** What the camera looks at; a station's face is its position plus ~1.3 m. */
  look: Vector3Tuple;
  title: string;
}

const face = (key: StationKey, dy = 1.3): Vector3Tuple => {
  const [x, , z] = STATIONS[key].position;
  return [x, dy, z];
};

// The first two waypoints brief the visitor before the stations: what the ship makes and who is
// aboard (airlock), then how work moves through the crew (corridor). Their card bodies are built
// from the ship, not from prose here.
const HEAD: readonly Waypoint[] = [
  { id: 'airlock', camera: [0, EYE, 22.5], look: [0, 1.4, 10], title: 'Boarding' },
  { id: 'corridor', camera: [0, EYE, 14], look: [0.6, 1.2, 3], title: 'The pipeline' },
];

/** Camera, look and title per station, ArkhEthos numbers; the gauge bay's are new. */
const STOP: Record<StationKey, Omit<Waypoint, 'id' | 'member' | 'key'>> = {
  strategist: { camera: [-2.3, EYE, -1.4], look: face('strategist'), title: 'DNA still' },
  analyst: { camera: [-2.6, EYE, -5.6], look: face('analyst', 1.0), title: 'Evidence bay' },
  producer: { camera: [-1.4, EYE, -6.4], look: face('producer', 0.9), title: 'Media hold' },
  metrics: { camera: [1.6, EYE, -6.6], look: face('metrics', 1.4), title: 'Sensor mast' },
  critic: { camera: [3.4, EYE, -6.0], look: face('critic', 1.5), title: 'Scoring alcove' },
  engineer: { camera: [2.6, EYE, -2.0], look: face('engineer', 1.3), title: 'Build bay' },
  gauge: { camera: [0, EYE, -1.0], look: face('gauge', 1.3), title: 'Gauge bay' },
  captain: { camera: [0, EYE, -4.2], look: face('captain', 1.6), title: 'The bridge' },
};
/** With the gauge bay occupied its 0.85 m collision circle covers the captain's ArkhEthos eye point; step back past it. */
const CAPTAIN_EYE_WITH_GAUGE: Vector3Tuple = [0, EYE, -4.9];

/** The order the walk visits stations in; the captain closes it. */
const TOUR_ORDER: readonly StationKey[] = ['strategist', 'analyst', 'producer', 'metrics', 'critic', 'engineer', 'gauge', 'captain'];

export interface Seat {
  memberId: string;
  key: StationKey;
}

export interface Layout {
  seats: readonly Seat[];
  /** stations somebody stands at */
  occupied: ReadonlySet<StationKey>;
  tour: readonly Waypoint[];
  /** the member the walk ends on and that turns for the welcome (station 1, else the last stop) */
  welcome: string | null;
  keyOf(memberId: string): StationKey | undefined;
  stationOf(memberId: string): Station | undefined;
}

/**
 * Seats the ship's crew: a member stands at the station number it holds; a second member claiming
 * a taken number takes the next free station, so nobody stands inside anybody. The tour then
 * visits the occupied stations in ArkhEthos order, the captain's last.
 */
export function layoutFor(members: readonly { id: string; station: number }[]): Layout {
  const taken = new Set<StationKey>();
  const seats: Seat[] = [];
  const free = (): StationKey | undefined => STATION_KEYS.find((k) => !taken.has(k));
  for (const m of [...members].sort((a, b) => a.station - b.station)) {
    let key: StationKey | undefined = STATION_KEYS[m.station - 1];
    if (!key || taken.has(key)) key = free();
    if (!key) continue;
    taken.add(key);
    seats.push({ memberId: m.id, key });
  }
  const byKey = new Map(seats.map((s) => [s.key, s.memberId]));
  const gauge = taken.has('gauge');
  const stops: Waypoint[] = [];
  for (const key of TOUR_ORDER) {
    const member = byKey.get(key);
    if (!member) continue;
    const base = STOP[key];
    stops.push({ id: key, member, key, ...base, camera: key === 'captain' && gauge ? CAPTAIN_EYE_WITH_GAUGE : base.camera });
  }
  const keyByMember = new Map(seats.map((s) => [s.memberId, s.key]));
  return {
    seats,
    occupied: taken,
    tour: [...HEAD, ...stops],
    welcome: stops.length ? (stops[stops.length - 1].member ?? null) : null,
    keyOf: (id) => keyByMember.get(id),
    stationOf: (id) => {
      const k = keyByMember.get(id);
      return k ? STATIONS[k] : undefined;
    },
  };
}

/** The ArkhEthos ship: the seven library crew on stations 1..7. Tests and defaults use it. */
export const DEFAULT_LAYOUT: Layout = layoutFor(STATION_KEYS.slice(0, 7).map((id, i) => ({ id, station: i + 1 })));

// ---------------------------------------------------------------------------
// Phase 1.5: things to find and where the props stand.

/** A small detail in the ship that can be inspected (DESIGN.md › Ship tour: scene upgrade). */
export interface InspectDetail {
  id: string;
  /** The station it belongs to (the waypoint it can be found from). */
  key: StationKey;
  title: string;
  /** What you read when you look closely. Narrative, truth label Simulated. */
  line: string;
  position: Vector3Tuple;
  /** Footprint of the little object, metres. */
  size: Vector3Tuple;
  color: string;
}

/** A point in front of a station, along the character's facing (where its prop stands). */
export function inFront(key: StationKey, d = 0.9, dx = 0, dz = 0): Vector3Tuple {
  const [x, , z] = STATIONS[key].position;
  const yaw = STATIONS[key].yaw;
  return [x + Math.sin(yaw) * d + dx, 0, z + Math.cos(yaw) * d + dz];
}

const on = (key: StationKey, y: number, dx = 0, dz = 0): Vector3Tuple => {
  const [x, , z] = inFront(key, 0.9, dx, dz);
  return [x, y, z];
};

export const INSPECT: readonly InspectDetail[] = [
  { id: 'brief', key: 'captain', title: "The captain's brief", line: 'One page, three gates pencilled in the margin: diagnose, direct, verify. Nothing ships without all three ticked.', position: on('captain', 0.86, 0.32), size: [0.22, 0.01, 0.3], color: '#F4E9D8' },
  { id: 'vial', key: 'strategist', title: 'A vial label', line: 'Hand-lettered: "client palette, distilled, do not shake". The liquid changes colour when you tilt it.', position: on('strategist', 1.18, 0, -0.42), size: [0.07, 0.16, 0.07], color: '#9BD38A' },
  { id: 'notebook', key: 'analyst', title: 'Two notebooks', line: 'One is labelled "seen", the other "inferred". The second has fewer pages filled.', position: on('analyst', 0.86, 0, 0.32), size: [0.2, 0.04, 0.26], color: '#6FA8DC' },
  { id: 'ledger', key: 'producer', title: 'A ledger page', line: 'Every crate in the hold has a row: source, licence, cost. One row reads "0 credits, CC0".', position: [-2.0, 0.715, -7.9], size: [0.24, 0.01, 0.3], color: '#E7D3A8' },
  { id: 'tape', key: 'metrics', title: 'Sensor tape', line: 'A strip of printed readings. Where a value was missing, the tape says "no data", never a guess.', position: [3.45, 0.935, -8.15], size: [0.3, 0.01, 0.08], color: '#BFE3F5' },
  { id: 'scorecard', key: 'critic', title: 'A score card', line: 'Scores in five columns and one rule at the top: "I did not watch this being made."', position: on('critic', 1.05), size: [0.24, 0.01, 0.18], color: '#D9C6F0' },
  { id: 'mask', key: 'engineer', title: 'A weld mask', line: 'Scratched inside the visor: "Gate B approved. Build only that."', position: on('engineer', 0.97, 0, 0.55), size: [0.26, 0.2, 0.22], color: '#4A3F3A' },
];

export const INSPECT_IDS = INSPECT.map((d) => d.id);

/** The holo screen beside each station: half a metre behind, a metre to the character's right. */
export function screenPose(key: StationKey): { position: Vector3Tuple; yaw: number } {
  const [x, , z] = STATIONS[key].position;
  const yaw = STATIONS[key].yaw;
  const back = 0.5;
  const side = 0.95;
  return { position: [x - Math.sin(yaw) * back + Math.cos(yaw) * side, 1.75, z - Math.cos(yaw) * back - Math.sin(yaw) * side], yaw };
}
