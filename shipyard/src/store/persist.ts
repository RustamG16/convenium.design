/**
 * localStorage persistence, `convenium.shipyard.v1`. Validated with zod on read: anything
 * malformed yields the defaults plus a banner reason, never a half-loaded state. Storage that is
 * unavailable (private mode, quota) degrades to session-only with its own banner reason.
 */
import { z } from 'zod';
import { describeIssues, shipSchema } from '../domain/schema';
import { emptyPersisted, STATE_VERSION, type PersistedState } from './store';

export const STORAGE_KEY = 'convenium.shipyard.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type PersistBanner = 'malformed' | 'unavailable' | 'newer-version';

export interface ReadResult {
  state: PersistedState;
  banner: PersistBanner | null;
  issues: string[];
}

const persistedSchema = z.object({
  version: z.literal(STATE_VERSION),
  ships: z.array(shipSchema),
  codex: z.array(z.string()),
  commissions: z.record(z.string(), z.string()),
  ui: z.object({
    introSeen: z.record(z.string(), z.literal(true)),
    sound: z.boolean(),
    designPath: z.string(),
  }),
});

/** Bring an older persisted shape forward. Only v1 exists; the hook is here so v2 has a place. */
export function migrate(raw: unknown): { ok: true; value: unknown } | { ok: false; reason: PersistBanner } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'malformed' };
  const version = (raw as { version?: unknown }).version;
  if (version === STATE_VERSION) return { ok: true, value: raw };
  if (typeof version === 'number' && version > STATE_VERSION) return { ok: false, reason: 'newer-version' };
  return { ok: false, reason: 'malformed' };
}

export function readPersisted(storage: StorageLike | null): ReadResult {
  const defaults = emptyPersisted();
  if (!storage) return { state: defaults, banner: 'unavailable', issues: [] };
  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: defaults, banner: 'unavailable', issues: [] };
  }
  if (text === null) return { state: defaults, banner: null, issues: [] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { state: defaults, banner: 'malformed', issues: ['not valid JSON'] };
  }
  const migrated = migrate(raw);
  if (!migrated.ok) return { state: defaults, banner: migrated.reason, issues: [] };
  const parsed = persistedSchema.safeParse(migrated.value);
  if (!parsed.success) return { state: defaults, banner: 'malformed', issues: describeIssues(parsed.error) };
  return { state: parsed.data, banner: null, issues: [] };
}

/** Returns false when the write failed; the caller shows the session-only banner. */
export function writePersisted(storage: StorageLike | null, state: PersistedState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}.probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
