/**
 * Trial records: the only input to ratings and the leaderboard (PRODUCT.md § v2 ethics gate). Kept in
 * their own localStorage key, validated on read, so a bad record can never take the ship store down with
 * it; on the dev server each record is also written to shipyard/trials/<id>/result.json by the runner.
 * Deleting a record is undoable from the toast like any other destructive action.
 */
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { trialRecordSchema, type TrialRecord } from '../../domain/regatta';

export const TRIALS_KEY = 'convenium.shipyard.trials.v1';
const MAX_RECORDS = 500;

const fileSchema = z.object({ version: z.literal(1), records: z.array(z.unknown()) });

function read(): TrialRecord[] {
  try {
    const raw = window.localStorage.getItem(TRIALS_KEY);
    if (!raw) return [];
    const file = fileSchema.safeParse(JSON.parse(raw));
    if (!file.success) return [];
    return file.data.records.flatMap((r) => {
      const ok = trialRecordSchema.safeParse(r);
      return ok.success ? [ok.data] : [];
    });
  } catch {
    return [];
  }
}

let records: TrialRecord[] | null = null;
const listeners = new Set<() => void>();

function current(): TrialRecord[] {
  if (records === null) records = typeof window === 'undefined' ? [] : read();
  return records;
}

function commit(next: TrialRecord[]) {
  records = next.slice(-MAX_RECORDS);
  try {
    window.localStorage.setItem(TRIALS_KEY, JSON.stringify({ version: 1, records }));
  } catch {
    /* storage full or blocked: records last for this session, which the Regatta says */
  }
  listeners.forEach((l) => l());
}

export const trials = {
  all: current,
  add(r: TrialRecord | TrialRecord[]) {
    commit([...current(), ...(Array.isArray(r) ? r : [r])]);
  },
  remove(id: string): TrialRecord | undefined {
    const gone = current().find((r) => r.id === id);
    commit(current().filter((r) => r.id !== id));
    return gone;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useTrials(): TrialRecord[] {
  return useSyncExternalStore(trials.subscribe, trials.all, () => []);
}

let seq = 0;
export const recordId = (ship: string, brief: string) => `${Date.now().toString(36)}-${(seq++).toString(36)}-${ship}-${brief}`.slice(0, 64);
