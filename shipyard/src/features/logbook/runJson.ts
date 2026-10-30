/**
 * `run.json`: the record a finished run leaves in `<project>/.olympus/` (templates/run.json). Shipyard
 * reads two things from it: `phase_counts` (how many times each phase ran) and the number of
 * `artifact_hashes` (the sha256 of each phase artifact). The rest is tolerated and ignored.
 *
 * Verified means "computed from the file you imported", not "proved by the run": the file is the
 * owner's, and a hand-edited file reads as written. A file with no `artifact_hashes` is Unavailable
 * for that number, never zero.
 */
import { z } from 'zod';
import { describeIssues, type LogEntry } from '../../domain/schema';

export const MAX_RUN_JSON_BYTES = 262_144;

const runJsonSchema = z.looseObject({
  phase_counts: z.record(z.string().min(1), z.number().int().min(0)),
  artifact_hashes: z.record(z.string().min(1), z.string().min(1)).optional(),
  target_project: z.string().optional(),
  trail: z.string().optional(),
  phase: z.string().optional(),
  last_updated: z.string().optional(),
});

export interface RunSummary {
  project: string | undefined;
  phaseCounts: Record<string, number>;
  /** total phase runs: the sum of phase_counts */
  phaseRuns: number;
  /** phases that ran at least once */
  phasesRun: number;
  /** undefined when the file has no artifact_hashes (Unavailable) */
  artifactHashes: number | undefined;
  runKey: string;
}

export type ParseRun = { ok: true; summary: RunSummary } | { ok: false; issues: string[] };

/** FNV-1a over canonical JSON, 8 hex digits per half: enough to tell one run file from another. */
function hash(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 0x01000193) >>> 0;
    b = Math.imul(b ^ text.charCodeAt(text.length - 1 - i), 0x85ebca6b) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

const sorted = (o: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(o).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)));

export function parseRunJson(text: string): ParseRun {
  if (text.length > MAX_RUN_JSON_BYTES) return { ok: false, issues: [`(root): the file is larger than ${MAX_RUN_JSON_BYTES / 1024} KB; a run.json is far smaller`] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, issues: ['(root): not valid JSON'] };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, issues: ['(root): a run.json is a JSON object'] };
  const parsed = runJsonSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, issues: describeIssues(parsed.error) };
  const run = parsed.data;
  const counts = run.phase_counts;
  const identity = JSON.stringify([run.target_project ?? '', run.last_updated ?? '', sorted(counts), sorted(run.artifact_hashes ?? {})]);
  return {
    ok: true,
    summary: {
      project: run.target_project || undefined,
      phaseCounts: counts,
      phaseRuns: Object.values(counts).reduce((n, v) => n + v, 0),
      phasesRun: Object.values(counts).filter((v) => v > 0).length,
      artifactHashes: run.artifact_hashes ? Object.keys(run.artifact_hashes).length : undefined,
      runKey: hash(identity),
    },
  };
}

/** The logbook row a parsed run makes. Truth: Verified (computed from the imported file). */
export function runLogEntry(summary: RunSummary, at: string): LogEntry {
  return {
    at,
    kind: 'run-json',
    truth: 'Verified',
    ...(summary.project ? { project: summary.project } : {}),
    phaseCounts: summary.phaseCounts,
    ...(summary.artifactHashes !== undefined ? { artifactHashes: summary.artifactHashes } : {}),
    runKey: summary.runKey,
    note: `${summary.phaseRuns} phase runs across ${summary.phasesRun} phases`,
  };
}
