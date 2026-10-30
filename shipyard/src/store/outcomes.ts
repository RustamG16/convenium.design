/**
 * Which store changes are outcomes, and which commissions they earn. The reducer calls
 * `grantCommissions` after every action; only the outcomes below produce an event, so opening,
 * browsing, inspecting and changing settings can never grant anything.
 *
 * Owner equips only: an equip that arrives through `loadout/equip` or `loadout/fromHold` is the
 * owner's act. A derived default loadout (library conversion, clone) never passes through them, so
 * the off-route artifacts those already wear are not counted.
 */
import { grantsFor, isOffRoute, type CommissionId, type OutcomeEvent } from '../domain/commissions';
import { preflight } from '../domain/preflight';
import type { Ship } from '../domain/schema';
import type { Action, Env, StoreState } from './store';

const SHIP_EDITS = /^(loadout|crew|voyage)\//;

const worn = (ship: Ship | undefined, member: string, skill: string): boolean =>
  ship?.crew.find((m) => m.id === member)?.loadout.some((e) => e.skill === skill) ?? false;

const crewCount = (ships: Ship[]): number => ships.reduce((n, s) => n + s.crew.length, 0);

export function outcomeEvents(prev: StoreState, next: StoreState, action: Action, env?: Env): OutcomeEvent[] {
  const events: OutcomeEvent[] = [];
  const type = action.type as string;

  if ((type === 'ship/create' || type === 'ship/clone') && next.ships.length > prev.ships.length) {
    events.push({ kind: 'ship-commissioned' });
  }

  if (action.type === 'loadout/equip' || action.type === 'loadout/fromHold') {
    const before = prev.ships.find((s) => s.id === action.shipId);
    const after = next.ships.find((s) => s.id === action.shipId);
    if (after && env && !worn(before, action.member, action.skill) && worn(after, action.member, action.skill)) {
      const agent = after.crew.find((m) => m.id === action.member)?.agent;
      events.push({ kind: 'owner-equipped', offRoute: agent ? isOffRoute(env.idx, agent, action.skill) : false });
    }
  }

  // A crew member added to a ship by the owner (the recruit action lands with the Bridge and Hangar screens).
  if (type === 'crew/recruit' && crewCount(next.ships) > crewCount(prev.ships)) {
    events.push({ kind: 'member-recruited' });
  }

  // A ship the owner edited that now passes pre-flight with no blocker and no warning.
  if (env && next.ships !== prev.ships && (SHIP_EDITS.test(type) || action.type === 'ship/replace')) {
    const changed = next.ships.filter((s) => prev.ships.find((p) => p.id === s.id) !== s);
    if (changed.some((s) => preflight(env.idx, s).clean)) events.push({ kind: 'preflight-clean' });
  }

  if (action.type === 'log/add') {
    const { entry, shipId } = action;
    if (entry.kind === 'export') {
      events.push({ kind: 'exported' });
      if (entry.clean) events.push({ kind: 'preflight-clean' });
    } else if (entry.kind === 'verify-result') {
      events.push({ kind: 'verify-pasted' });
    } else {
      const runsOnShip = (next.logbook[shipId] ?? []).filter((e) => e.kind === 'run-json').length;
      if (runsOnShip > (prev.logbook[shipId] ?? []).filter((e) => e.kind === 'run-json').length) {
        events.push({ kind: 'run-logged', runsOnShip });
      }
    }
  }

  return events;
}

/** `next` with the commissions its outcomes earn, dated `at`. Returns `next` itself when nothing is earned. */
export function grantCommissions(prev: StoreState, next: StoreState, action: Action, at: string, env?: Env): StoreState {
  const events = outcomeEvents(prev, next, action, env);
  if (events.length === 0) return next;
  const ids: CommissionId[] = grantsFor(events, next.commissions);
  if (ids.length === 0) return next;
  return { ...next, commissions: { ...next.commissions, ...Object.fromEntries(ids.map((id) => [id, at])) } };
}
