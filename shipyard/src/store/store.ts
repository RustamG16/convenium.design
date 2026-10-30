/**
 * The one store: a pure reducer, an undo stack of 50 per session, and a tiny subscribe/getState
 * shell that React reads through useSyncExternalStore (see ./context.tsx).
 *
 * Library ships are not in the state: they are rebuilt from the knowledge base and read-only.
 * Only custom ships, the codex, commissions and per-ship UI state are stored.
 *
 * Nothing here scores, ranks, times or randomises. `commissions` records the date an outcome
 * happened; it is not a currency.
 */
import type { LogEntry, Ship } from '../domain/schema';

export const STATE_VERSION = 1 as const;
export const UNDO_DEPTH = 50;

export interface UiState {
  /** ship ids whose boarding walk has played once */
  introSeen: Record<string, true>;
  /** sound is off by default and only ever turned on by the owner */
  sound: boolean;
  /** absolute path of the Convenium.Design folder, remembered locally for the export panel */
  designPath: string;
}

export interface PersistedState {
  version: typeof STATE_VERSION;
  ships: Ship[];
  /** skill ids whose inspector has been opened (the codex line); once per id */
  codex: string[];
  /** commission id -> ISO date it was granted */
  commissions: Record<string, string>;
  ui: UiState;
}

export interface StoreState extends PersistedState {
  past: Ship[][];
  future: Ship[][];
}

export type Action =
  | { type: 'ship/add'; ship: Ship }
  | { type: 'ship/import'; ship: Ship }
  | { type: 'ship/replace'; ship: Ship }
  | { type: 'ship/rename'; id: string; name: string }
  | { type: 'ship/delete'; id: string }
  | { type: 'codex/inspect'; skill: string }
  | { type: 'commission/grant'; id: string }
  | { type: 'log/add'; shipId: string; entry: LogEntry }
  | { type: 'ui/introSeen'; shipId: string }
  | { type: 'ui/sound'; on: boolean }
  | { type: 'ui/designPath'; path: string }
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'state/reset'; state: PersistedState };

/** Actions that do not enter the undo stack (view state, bookkeeping, history itself). */
const NOT_UNDOABLE = new Set<Action['type']>([
  'codex/inspect',
  'commission/grant',
  'log/add',
  'ui/introSeen',
  'ui/sound',
  'ui/designPath',
  'history/undo',
  'history/redo',
  'state/reset',
]);

export function emptyPersisted(): PersistedState {
  return { version: STATE_VERSION, ships: [], codex: [], commissions: {}, ui: { introSeen: {}, sound: false, designPath: '' } };
}

export function initialState(persisted: PersistedState = emptyPersisted()): StoreState {
  return { ...persisted, past: [], future: [] };
}

export function toPersisted(s: StoreState): PersistedState {
  return { version: STATE_VERSION, ships: s.ships, codex: s.codex, commissions: s.commissions, ui: s.ui };
}

/** A ship id not used by `taken`: `base`, then `base-2`, `base-3`... within the 48-char id pattern. */
export function uniqueShipId(taken: Iterable<string>, base: string): string {
  const used = new Set(taken);
  const clean = base.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/^[^a-z]+/, '') || 'ship';
  const root = clean.length >= 2 ? clean.slice(0, 44) : `${clean}x`;
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

function mapShip(state: StoreState, id: string, fn: (s: Ship) => Ship): Ship[] {
  return state.ships.map((s) => (s.id === id ? fn(s) : s));
}

function applyAction(state: StoreState, action: Action, at: string): StoreState {
  switch (action.type) {
    case 'ship/add':
      return { ...state, ships: [...state.ships.filter((s) => s.id !== action.ship.id), action.ship] };
    case 'ship/import': {
      const id = uniqueShipId(state.ships.map((s) => s.id), action.ship.id);
      return { ...state, ships: [...state.ships, { ...action.ship, id, origin: { kind: 'import', from: action.ship.id }, updatedAt: at }] };
    }
    case 'ship/replace':
      return { ...state, ships: mapShip(state, action.ship.id, () => ({ ...action.ship, updatedAt: at })) };
    case 'ship/rename': {
      const name = action.name.trim().slice(0, 48);
      if (!name) return state;
      return { ...state, ships: mapShip(state, action.id, (s) => ({ ...s, name, updatedAt: at })) };
    }
    case 'ship/delete':
      return { ...state, ships: state.ships.filter((s) => s.id !== action.id) };
    case 'codex/inspect':
      return state.codex.includes(action.skill) ? state : { ...state, codex: [...state.codex, action.skill] };
    case 'commission/grant':
      return action.id in state.commissions ? state : { ...state, commissions: { ...state.commissions, [action.id]: at } };
    case 'log/add':
      return { ...state, ships: mapShip(state, action.shipId, (s) => ({ ...s, logbook: [...(s.logbook ?? []), action.entry] })) };
    case 'ui/introSeen':
      return { ...state, ui: { ...state.ui, introSeen: { ...state.ui.introSeen, [action.shipId]: true } } };
    case 'ui/sound':
      return { ...state, ui: { ...state.ui, sound: action.on } };
    case 'ui/designPath':
      return { ...state, ui: { ...state.ui, designPath: action.path } };
    case 'state/reset':
      return initialState(action.state);
    default:
      return state;
  }
}

/** Pure reducer. `at` is the ISO time to stamp (injected so tests stay deterministic). */
export function reduce(state: StoreState, action: Action, at: string): StoreState {
  if (action.type === 'history/undo') {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return { ...state, ships: previous, past: state.past.slice(0, -1), future: [state.ships, ...state.future].slice(0, UNDO_DEPTH) };
  }
  if (action.type === 'history/redo') {
    const next = state.future[0];
    if (!next) return state;
    return { ...state, ships: next, future: state.future.slice(1), past: [...state.past, state.ships].slice(-UNDO_DEPTH) };
  }
  const next = applyAction(state, action, at);
  if (next === state || NOT_UNDOABLE.has(action.type)) return next;
  if (next.ships === state.ships) return next;
  return { ...next, past: [...state.past, state.ships].slice(-UNDO_DEPTH), future: [] };
}

export interface Store {
  getState(): StoreState;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
}

export function createStore(initial: StoreState, now: () => string = () => new Date().toISOString()): Store {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action, now());
      if (next === state) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
