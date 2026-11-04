// Feedback tiers (DESIGN.md > Gamification > Feedback tiers). How big a response may be, by what
// happened. Small is a confirmation, medium is an outcome, large is the single moment a ship is
// cleared for departure and plays the first time for that ship only. There is no score here, no
// running total and no reward: a tier only bounds a duration.
import { MOTION } from './motion';

export type Tier = 'small' | 'medium' | 'large';

/** Duration bounds in ms. Large has no floor; it is capped at 900 and played once per ship. */
export const TIERS: Record<Tier, { min: number; max: number }> = {
  small: { min: 150, max: 200 },
  medium: { min: 400, max: 700 },
  large: { min: 0, max: 900 },
};

/** What each feedback moment is, and its tier. */
export const FEEL = {
  hover: 'small',
  unequip: 'small',
  toggle: 'small',
  'socket-confirm': 'small',
  'check-flip': 'medium',
  'equip-arrival': 'medium',
  commission: 'medium',
  'clean-preflight': 'large',
} as const satisfies Record<string, Tier>;
export type FeelKind = keyof typeof FEEL;

/** The contract duration of each feedback moment, from the motion numbers. */
const BASE_MS: Record<FeelKind, number> = {
  hover: MOTION.hover.ms,
  unequip: MOTION.unequip.ms,
  toggle: MOTION.micro,
  'socket-confirm': MOTION.micro,
  'check-flip': MOTION.checkFlip.ms,
  'equip-arrival': MOTION.equip.ms,
  commission: MOTION.checkFlip.ms,
  'clean-preflight': MOTION.sweep.ms,
};

export const tierOf = (kind: FeelKind): Tier => FEEL[kind];

/** The duration to play a feedback moment for: the contract number, held inside its tier. */
export function feelMs(kind: FeelKind): number {
  const { min, max } = TIERS[tierOf(kind)];
  return Math.min(max, Math.max(min, BASE_MS[kind]));
}

/** Ships whose large feedback has already played. Order and count carry no meaning. */
export type LargeSeen = ReadonlySet<string>;

/** Large feedback plays on an outcome that is true, and only the first time for that ship. */
export function playLarge(shipId: string, seen: LargeSeen, outcome: boolean): boolean {
  return outcome && !seen.has(shipId);
}

const KEY = 'convenium.shipyard.feel.v1';

/** The ships whose large feedback has played, read from storage (a missing or unreadable record is empty). */
export function readLargeSeen(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Set<string> {
  try {
    const raw = storage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

const session = new Set<string>();
/** Notes that a ship's large feedback played; remembered in storage, and for the session when storage is blocked. */
export function markLargeSeen(shipId: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): void {
  session.add(shipId);
  try {
    const seen = readLargeSeen(storage);
    seen.add(shipId);
    storage?.setItem(KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    /* storage blocked: the session set still holds */
  }
}
export const largeSeen = (storage?: Pick<Storage, 'getItem'> | null): Set<string> => new Set([...readLargeSeen(storage), ...session]);

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
