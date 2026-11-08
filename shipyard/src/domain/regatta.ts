/**
 * v2 Regatta: compare ships on one brief, keep trial records, rate and rank (owner decision 2026-11-08:
 * full game scoring). The ethics gate (PRODUCT.md § v2) in code:
 * - ratings come only from trial records — outcomes — never from clicks, visits or time;
 * - a rating is the mean of the last three VERIFIED totals for a (ship, brief); Simulated totals are
 *   kept in their own column and never mixed into a rating or a rank;
 * - a record whose ship or knowledge base has changed since is stale: shown, flagged, not counted;
 * - ties are ties: equal totals share a place and a regatta can have several winners.
 */
import { z } from 'zod';
import { CRITERIA, type CriterionId, type DryTrial } from './trial';

/** `source` (live only): 'measured' by the dev server, or 'reported' by the run about itself (never counted) */
const criterionSchema = z.object({ points: z.number(), max: z.number(), why: z.string(), source: z.enum(['measured', 'reported']).optional() });

export const trialRecordSchema = z.strictObject({
  id: z.string().min(1).max(64),
  at: z.string(),
  ship: z.string(),
  shipName: z.string().max(48),
  brief: z.string(),
  source: z.enum(['dry', 'live']),
  truth: z.enum(['Simulated', 'Verified']),
  total: z.number().min(0).max(100),
  criteria: z.record(z.string(), criterionSchema),
  kbHash: z.string(),
  shipHash: z.string(),
  /** live only: the independent critic's score, labelled Model-judged, shown beside the total and never added to it */
  modelJudged: z.number().min(0).max(100).optional(),
  /** live only: the points the run claims for itself in its run.json (needs and gates); Model-reported, never counted or ranked */
  reported: z.object({ points: z.number().min(0), max: z.number().min(0) }).optional(),
  /** live only: the measured run duration, shown as a fact after the run */
  durationMs: z.number().int().min(0).optional(),
  tokens: z.number().int().min(0).optional(),
  note: z.string().max(400).optional(),
});
export type TrialRecord = z.infer<typeof trialRecordSchema>;

export const RATING_WINDOW = 3;

export function recordFromDry(t: DryTrial, shipName: string, at: string, id: string): TrialRecord {
  return { id, at, ship: t.ship, shipName, brief: t.brief, source: 'dry', truth: 'Simulated', total: t.score.total, criteria: t.score.criteria, kbHash: t.kbHash, shipHash: t.shipHash };
}

export interface Current {
  kbHash: string;
  /** current ship hash per ship id; a ship missing here was deleted */
  shipHash: Map<string, string>;
}

export const isStale = (r: TrialRecord, now: Current) => r.kbHash !== now.kbHash || now.shipHash.get(r.ship) !== r.shipHash;

export interface Rating {
  /** mean of the last RATING_WINDOW fresh Verified totals, or null when there are none */
  value: number | null;
  n: number;
  last: string | null;
  /** the latest fresh Simulated total, shown in its own column */
  simulated: number | null;
  stale: number;
}

const byNewest = (a: TrialRecord, b: TrialRecord) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function rating(records: readonly TrialRecord[], ship: string, brief: string, now: Current): Rating {
  const mine = records.filter((r) => r.ship === ship && r.brief === brief).sort(byNewest);
  const fresh = mine.filter((r) => !isStale(r, now));
  const verified = fresh.filter((r) => r.truth === 'Verified').slice(0, RATING_WINDOW);
  const sim = fresh.find((r) => r.truth === 'Simulated');
  return {
    value: verified.length ? round1(verified.reduce((s, r) => s + r.total, 0) / verified.length) : null,
    n: verified.length,
    last: verified[0]?.at ?? null,
    simulated: sim ? sim.total : null,
    stale: mine.length - fresh.length,
  };
}

export interface BoardRow {
  ship: string;
  shipName: string;
  /** 1-based; equal ratings share a place; null when the ship has no Verified rating (listed, never ranked) */
  place: number | null;
  rating: Rating;
}

function placeRows<T extends { value: number | null; shipName: string }>(input: T[]): (T & { place: number | null })[] {
  // ties (and the unranked) read in name order, so the board never reshuffles between renders
  const rows = [...input].sort((a, b) => a.shipName.localeCompare(b.shipName));
  const ranked = rows.filter((r) => r.value !== null).sort((a, b) => b.value! - a.value!);
  const out: (T & { place: number | null })[] = [];
  ranked.forEach((r, i) => out.push({ ...r, place: i > 0 && ranked[i - 1].value === r.value ? out[i - 1].place : i + 1 }));
  for (const r of rows) if (r.value === null) out.push({ ...r, place: null });
  return out;
}

/** The board for one brief: every ship that has a fresh record there. */
export function leaderboard(records: readonly TrialRecord[], brief: string, now: Current): BoardRow[] {
  const ships = new Map<string, string>();
  for (const r of [...records].sort(byNewest)) if (r.brief === brief && now.shipHash.has(r.ship) && !ships.has(r.ship)) ships.set(r.ship, r.shipName);
  const rows = [...ships].map(([ship, shipName]) => ({ ship, shipName, rating: rating(records, ship, brief, now), value: rating(records, ship, brief, now).value }));
  return placeRows(rows)
    .filter((r) => r.rating.value !== null || r.rating.simulated !== null)
    .map(({ ship, shipName, place, rating: rt }) => ({ ship, shipName, place, rating: rt }));
}

export interface OverallRow {
  ship: string;
  shipName: string;
  place: number | null;
  /** mean of the ship's per-brief Verified ratings */
  value: number | null;
  briefs: number;
}

/** Across briefs: the mean of each ship's per-brief Verified ratings, with how many briefs it covers. */
export function overall(records: readonly TrialRecord[], briefs: readonly string[], now: Current): OverallRow[] {
  const names = new Map<string, string>();
  for (const r of records) if (now.shipHash.has(r.ship)) names.set(r.ship, r.shipName);
  const rows = [...names].map(([ship, shipName]) => {
    const vals = briefs.map((b) => rating(records, ship, b, now).value).filter((v): v is number => v !== null);
    return { ship, shipName, value: vals.length ? round1(vals.reduce((s, v) => s + v, 0) / vals.length) : null, briefs: vals.length };
  });
  return placeRows(rows);
}

export interface Comparison {
  /** per criterion: the best points among the entrants and who reached it (ties share it) */
  best: Record<CriterionId, { points: number; ships: string[] }>;
  /** highest total; several ships when they tie */
  winners: string[];
  topTotal: number;
}

export function compare(entries: readonly { ship: string; total: number; criteria: Record<string, { points: number }> }[]): Comparison {
  const best = {} as Comparison['best'];
  for (const c of CRITERIA) {
    const top = Math.max(...entries.map((e) => e.criteria[c.id]?.points ?? 0));
    best[c.id] = { points: top, ships: entries.filter((e) => (e.criteria[c.id]?.points ?? 0) === top).map((e) => e.ship) };
  }
  const topTotal = Math.max(...entries.map((e) => e.total));
  return { best, winners: entries.filter((e) => e.total === topTotal).map((e) => e.ship), topTotal };
}
