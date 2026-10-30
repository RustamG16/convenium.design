/**
 * Commissions: the eight "firsts" of DESIGN.md > Gamification. Each is tied to an outcome, never
 * to opening, browsing or clicking. Pure: an outcome event goes in, the ids it earns come out.
 *
 * What a commission is not: a currency, a ladder or a clock. It is a dated fact ("granted on
 * 2026-10-30") or the plain condition that would grant it. Nothing is ranked, nothing lapses,
 * nothing is awarded twice, and an artifact a derived default loadout already wears never counts
 * as something the owner equipped.
 */
import type { KbIndex } from '../kb/artifacts';
import { equipNotes } from './loadout';

export type CommissionId =
  | 'first-ship'
  | 'first-recruit'
  | 'first-off-route'
  | 'first-clean'
  | 'first-export'
  | 'first-verify'
  | 'first-run'
  | 'proven-hull';

/** Verified: computed from a file or the ship itself. User-reported: pasted by the owner and not checked here. */
export type CommissionTruth = 'Verified' | 'User-reported';

export interface Commission {
  id: CommissionId;
  title: string;
  /** the plain condition, shown until it is granted */
  condition: string;
  truth: CommissionTruth;
}

export const COMMISSIONS: readonly Commission[] = [
  { id: 'first-ship', title: 'First ship', condition: 'Commission a blank ship or clone a library ship.', truth: 'Verified' },
  { id: 'first-recruit', title: 'First recruit', condition: 'Recruit a crew member onto one of your ships.', truth: 'Verified' },
  { id: 'first-off-route', title: 'Off the route', condition: "Equip an artifact that is not on its agent's route. Default loadouts do not count.", truth: 'Verified' },
  { id: 'first-clean', title: 'Clean hull', condition: 'Pass pre-flight clean on a ship you changed or exported.', truth: 'Verified' },
  { id: 'first-export', title: 'First export', condition: 'Export a ship: download its plan or its ship file.', truth: 'Verified' },
  { id: 'first-verify', title: 'Checked', condition: 'Paste a verify.py --plan result into the logbook.', truth: 'User-reported' },
  { id: 'first-run', title: 'First run logged', condition: 'Import the run.json of a finished run.', truth: 'Verified' },
  { id: 'proven-hull', title: 'Proven hull', condition: 'Log three different runs on one ship.', truth: 'Verified' },
];

export const COMMISSION_IDS: readonly CommissionId[] = COMMISSIONS.map((c) => c.id);
export const PROVEN_HULL_RUNS = 3;

/** An outcome that happened. Navigation, inspection and settings are not outcomes and have no event. */
export type OutcomeEvent =
  | { kind: 'ship-commissioned' }
  | { kind: 'member-recruited' }
  /** the owner put an artifact on a body; `offRoute` is computed against that agent's routes */
  | { kind: 'owner-equipped'; offRoute: boolean }
  /** a ship the owner edited, or exported, has no blocker and no warning */
  | { kind: 'preflight-clean' }
  | { kind: 'exported' }
  | { kind: 'verify-pasted' }
  /** a run.json was logged; `runsOnShip` counts the distinct runs now on that ship */
  | { kind: 'run-logged'; runsOnShip: number };

function idsFor(event: OutcomeEvent): CommissionId[] {
  switch (event.kind) {
    case 'ship-commissioned':
      return ['first-ship'];
    case 'member-recruited':
      return ['first-recruit'];
    case 'owner-equipped':
      return event.offRoute ? ['first-off-route'] : [];
    case 'preflight-clean':
      return ['first-clean'];
    case 'exported':
      return ['first-export'];
    case 'verify-pasted':
      return ['first-verify'];
    case 'run-logged':
      return event.runsOnShip >= PROVEN_HULL_RUNS ? ['first-run', 'proven-hull'] : ['first-run'];
  }
}

/** The commissions these events earn that are not yet granted, each once, in the order of the rail. */
export function grantsFor(events: readonly OutcomeEvent[], granted: Readonly<Record<string, string>>): CommissionId[] {
  const earned = new Set(events.flatMap(idsFor));
  return COMMISSION_IDS.filter((id) => earned.has(id) && !(id in granted));
}

/** True when wearing `skill` as `agent` is off that agent's route (phase or routes list). */
export function isOffRoute(idx: KbIndex, agent: string, skill: string): boolean {
  return equipNotes(idx, agent, skill).some((n) => n.code === 'off-phase' || n.code === 'off-routes');
}

/** Ids present in `after` and not in `before`: what this session has just been granted. */
export function newlyGranted(before: Readonly<Record<string, string>>, after: Readonly<Record<string, string>>): string[] {
  return Object.keys(after).filter((id) => !(id in before));
}

/**
 * Whether a grant is announced with a toast. Only when the owner is looking at the page as it
 * happens; a grant that lands while the tab is hidden is stored and read off the rail next visit.
 */
export function shouldAnnounce(visible: boolean): boolean {
  return visible;
}

export function commissionById(id: string): Commission | undefined {
  return COMMISSIONS.find((c) => c.id === id);
}
