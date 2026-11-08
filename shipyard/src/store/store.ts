/**
 * The one store: a pure reducer, an undo stack of 50 per session, and a tiny subscribe/getState
 * shell that React reads through useSyncExternalStore (see ./context.tsx).
 *
 * Library ships are not in the state: they are rebuilt from the knowledge base and read-only.
 * Only custom ships, the codex, commissions and per-ship UI state are stored.
 *
 * Nothing here scores, ranks, times or randomises. `commissions` records the date an outcome
 * happened; it is not a currency, and no action grants one directly: the reducer derives grants
 * from outcomes (see ./outcomes.ts), so browsing and clicking cannot.
 */
import type { KbIndex } from '../kb/artifacts';
import { blankShip, cloneShip, libraryShip, LIBRARY_EPOCH } from '../domain/ship';
import { dismiss, editCharacter, recruit, seat, type CharacterPatch, type RecruitInput } from '../domain/crew';
import { addItem, applyTemplate, deleteItem, duplicateItem, editItem, moveItem, type GatePatch, type StagePatch } from '../domain/voyage';
import { equip, fromHold, move, sanitizeShip, toHold, unequip, type EquipOptions } from '../domain/loadout';
import type { Anchor, LogEntry, MemberOverride, Ship, VoyageItem } from '../domain/schema';
import { setOverride } from '../domain/variant';
import { grantCommissions } from './outcomes';

export const STATE_VERSION = 1 as const;
export const UNDO_DEPTH = 50;
/** Newest entries kept per ship, so the stored state stays small. */
export const LOGBOOK_CAP = 500;

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
  /** ship id -> its logbook (exports, pasted verify results, imported run.json), for library and custom ships alike */
  logbook: Record<string, LogEntry[]>;
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
  | { type: 'ship/create'; name: string }
  | { type: 'ship/clone'; source: Ship; name: string }
  | { type: 'crew/override'; shipId: string; member: string; override: MemberOverride | null }
  | { type: 'loadout/equip'; shipId: string; member: string; skill: string; opts?: EquipOptions }
  | { type: 'loadout/unequip'; shipId: string; member: string; skill: string }
  | { type: 'loadout/move'; shipId: string; member: string; skill: string; anchor: Anchor; opts?: Omit<EquipOptions, 'anchor'> }
  | { type: 'loadout/toHold'; shipId: string; member: string; skill: string }
  | { type: 'loadout/fromHold'; shipId: string; member: string; skill: string; opts?: EquipOptions }
  | { type: 'ship/rename'; id: string; name: string }
  | { type: 'ship/delete'; id: string }
  | { type: 'ship/restoreDefault'; id: string }
  | { type: 'ship/doctrine'; shipId: string; doctrine: string | null }
  | { type: 'ship/module'; shipId: string; module: string; on: boolean }
  | { type: 'crew/recruit'; shipId: string; input: RecruitInput }
  | { type: 'crew/edit'; shipId: string; member: string; patch: CharacterPatch }
  | { type: 'crew/dismiss'; shipId: string; member: string }
  | { type: 'crew/station'; shipId: string; member: string; station: number }
  | { type: 'voyage/add'; shipId: string; item: VoyageItem; at?: number }
  | { type: 'voyage/edit'; shipId: string; index: number; patch: StagePatch | GatePatch }
  | { type: 'voyage/move'; shipId: string; from: number; to: number }
  | { type: 'voyage/duplicate'; shipId: string; index: number }
  | { type: 'voyage/delete'; shipId: string; index: number }
  | { type: 'voyage/applyTemplate'; shipId: string; workflow: string; mode: 'append' | 'replace' }
  | { type: 'codex/inspect'; skill: string }
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
  'log/add',
  'ui/introSeen',
  'ui/sound',
  'ui/designPath',
  'history/undo',
  'history/redo',
  'state/reset',
]);

export function emptyPersisted(): PersistedState {
  return { version: STATE_VERSION, ships: [], codex: [], commissions: {}, logbook: {}, ui: { introSeen: {}, sound: false, designPath: '' } };
}

export function initialState(persisted: PersistedState = emptyPersisted()): StoreState {
  return { ...persisted, past: [], future: [] };
}

export function toPersisted(s: StoreState): PersistedState {
  return { version: STATE_VERSION, ships: s.ships, codex: s.codex, commissions: s.commissions, logbook: s.logbook, ui: s.ui };
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

/** A refused equip leaves the ship as it was; the UI shows the reason from `equip()` itself. */
function okShip(result: { ok: true; ship: Ship } | { ok: false; reason?: string }): Ship | null {
  return result.ok ? result.ship : null;
}

function mapShip(state: StoreState, id: string, fn: (s: Ship) => Ship): Ship[] {
  return state.ships.map((s) => (s.id === id ? fn(s) : s));
}

/** What actions that need the knowledge base read from. Absent in tests that do not touch ships' contents. */
export interface Env {
  idx: KbIndex;
}

function edit(state: StoreState, shipId: string, fn: (ship: Ship) => Ship | null, at: string): StoreState {
  const ship = state.ships.find((s) => s.id === shipId);
  if (!ship) return state;
  const next = fn(ship);
  return next && next !== ship ? { ...state, ships: mapShip(state, shipId, () => ({ ...next, updatedAt: at })) } : state;
}

function applyAction(state: StoreState, action: Action, at: string, env?: Env): StoreState {
  switch (action.type) {
    case 'ship/create': {
      if (!env) return state;
      const taken = [...state.ships.map((s) => s.id), ...env.idx.kb.workflows.ships.map((w) => w.id)];
      const id = uniqueShipId(taken, action.name);
      return { ...state, ships: [...state.ships, blankShip(env.idx, { id, name: action.name.trim() || 'New ship' }, at)] };
    }
    case 'ship/clone': {
      if (!env) return state;
      const taken = [...state.ships.map((s) => s.id), ...env.idx.kb.workflows.ships.map((w) => w.id)];
      const id = uniqueShipId(taken, action.name);
      return { ...state, ships: [...state.ships, cloneShip(action.source, { id, name: action.name.trim() || `${action.source.name} copy` }, at)] };
    }
    case 'loadout/equip':
      return edit(state, action.shipId, (s) => (env ? okShip(equip(env.idx, s, action.member, action.skill, action.opts)) : null), at);
    case 'loadout/fromHold':
      return edit(state, action.shipId, (s) => (env ? okShip(fromHold(env.idx, s, action.member, action.skill, action.opts)) : null), at);
    case 'loadout/move':
      return edit(state, action.shipId, (s) => (env ? okShip(move(env.idx, s, action.member, action.skill, action.anchor, action.opts)) : null), at);
    case 'loadout/unequip':
      return edit(state, action.shipId, (s) => unequip(s, action.member, action.skill), at);
    case 'loadout/toHold':
      return edit(state, action.shipId, (s) => toHold(s, action.member, action.skill), at);
    case 'ship/add':
      return { ...state, ships: [...state.ships.filter((s) => s.id !== action.ship.id), action.ship] };
    case 'ship/import': {
      const taken = [...state.ships.map((s) => s.id), ...(env?.idx.kb.workflows.ships.map((w) => w.id) ?? [])];
      const id = uniqueShipId(taken, action.ship.id);
      // An imported ship is the owner's: custom class, sockets brought inside capacity, never a library id.
      const incoming = { ...action.ship, id, class: 'custom' as const, origin: { kind: 'import' as const, from: action.ship.id }, updatedAt: at };
      return { ...state, ships: [...state.ships, env ? sanitizeShip(env.idx, incoming) : incoming] };
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
    case 'ship/restoreDefault':
      // Back to the template the ship came from (library workflow, or blank). Id and name stay; the library itself is never touched.
      return edit(
        state,
        action.id,
        (s) => {
          if (!env) return null;
          const workflow = s.origin?.workflow;
          const fresh = workflow ? libraryShip(env.idx, workflow, LIBRARY_EPOCH) : s.origin?.kind === 'blank' ? blankShip(env.idx, { id: s.id, name: s.name }, at) : null;
          return fresh ? { ...fresh, id: s.id, name: s.name, class: 'custom', origin: s.origin, logbook: [], createdAt: s.createdAt, updatedAt: at } : null;
        },
        at,
      );
    case 'ship/doctrine':
      return edit(state, action.shipId, (s) => ((s.doctrine ?? null) === action.doctrine ? null : { ...s, doctrine: action.doctrine }), at);
    case 'ship/module':
      return edit(
        state,
        action.shipId,
        (s) => {
          const has = s.modules?.includes(action.module) ?? false;
          if (has === action.on) return null;
          return { ...s, modules: action.on ? [...(s.modules ?? []), action.module] : (s.modules ?? []).filter((m) => m !== action.module) };
        },
        at,
      );
    case 'crew/recruit':
      return edit(state, action.shipId, (s) => (env ? okShip(recruit(env.idx, s, action.input)) : null), at);
    case 'crew/edit':
      return edit(state, action.shipId, (s) => okShip(editCharacter(s, action.member, action.patch)), at);
    case 'crew/override':
      return edit(state, action.shipId, (s) => (env ? okShip(setOverride(env.idx, s, action.member, action.override)) : null), at);
    case 'crew/dismiss':
      return edit(state, action.shipId, (s) => okShip(dismiss(s, action.member)), at);
    case 'crew/station':
      return edit(state, action.shipId, (s) => okShip(seat(s, action.member, action.station)), at);
    case 'voyage/add':
      return edit(state, action.shipId, (s) => okShip(addItem(s, action.item, action.at)), at);
    case 'voyage/edit':
      return edit(state, action.shipId, (s) => okShip(editItem(s, action.index, action.patch)), at);
    case 'voyage/move':
      return edit(state, action.shipId, (s) => okShip(moveItem(s, action.from, action.to)), at);
    case 'voyage/duplicate':
      return edit(state, action.shipId, (s) => okShip(duplicateItem(s, action.index)), at);
    case 'voyage/delete':
      return edit(state, action.shipId, (s) => okShip(deleteItem(s, action.index)), at);
    case 'voyage/applyTemplate':
      return edit(state, action.shipId, (s) => (env ? okShip(applyTemplate(env.idx, s, action.workflow, action.mode)) : null), at);
    case 'codex/inspect':
      return state.codex.includes(action.skill) ? state : { ...state, codex: [...state.codex, action.skill] };
    case 'log/add': {
      const rows = state.logbook[action.shipId] ?? [];
      // The same run.json is logged once (the same result is not a new run).
      if (action.entry.kind === 'run-json' && action.entry.runKey && rows.some((r) => r.runKey === action.entry.runKey)) return state;
      return { ...state, logbook: { ...state.logbook, [action.shipId]: [...rows, action.entry].slice(-LOGBOOK_CAP) } };
    }
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
export function reduce(state: StoreState, action: Action, at: string, env?: Env): StoreState {
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
  const applied = applyAction(state, action, at, env);
  if (applied === state) return state;
  const next = grantCommissions(state, applied, action, at, env);
  if (NOT_UNDOABLE.has(action.type)) return next;
  if (next.ships === state.ships) return next;
  return { ...next, past: [...state.past, state.ships].slice(-UNDO_DEPTH), future: [] };
}

export interface Store {
  getState(): StoreState;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
  /** The knowledge base the ship-editing actions read from; set once it has loaded. */
  setEnv(env: Env | undefined): void;
}

export function createStore(initial: StoreState, now: () => string = () => new Date().toISOString(), initialEnv?: Env): Store {
  let state = initial;
  let env = initialEnv;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action, now(), env);
      if (next === state) return;
      state = next;
      listeners.forEach((l) => l());
    },
    setEnv(next) {
      env = next;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
