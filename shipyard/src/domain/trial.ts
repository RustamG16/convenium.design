/**
 * v2 dry trials (owner decision 2026-11-08): a ship sails against a test brief, simulated. Pure and
 * deterministic — the same ship, brief and knowledge base always give the same score — and labelled
 * Simulated everywhere it is shown. It reuses pre-flight; it never calls a model.
 *
 * Rubric (100 points; plan/12-build-plan-v2.md § 5):
 *   coverage 35   the brief's needs met by a stage's active skill in the need's phase (half credit in another phase)
 *   artifacts 15  the brief's required artifacts produced by some stage output
 *   gates 15      the brief's gates present in the voyage
 *   preflight 20  passed / applicable × 20
 *   economy 10    the crew's tier points (opus 3, sonnet 2, haiku 1, inherit 2) against the brief's budget
 *   clarity 5     minus one per crew member with no stage and per skill opened twice
 *
 * The per-stage events let the arena replay the voyage buoy by buoy; nothing in them is random.
 */
import { z } from 'zod';
import type { KbIndex } from '../kb/artifacts';
import { preflight } from './preflight';
import { isStage, PHASE_IDS, type Ship } from './schema';
import { effectiveModel } from './variant';

export const briefSchema = z.strictObject({
  schema: z.literal('shipyard.brief.v1'),
  id: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
  title: z.string().min(1).max(80),
  summary: z.string().max(600),
  needs: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
        label: z.string().max(120),
        phase: z.enum(PHASE_IDS),
        skills: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  requiredArtifacts: z.array(z.string()),
  gates: z.array(z.string().regex(/^[A-Z0-9]$/)),
  constraints: z.array(z.string()).default([]),
  budget: z.strictObject({ tierPoints: z.number().int().min(1) }),
  fixtureProject: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
});
export type Brief = z.infer<typeof briefSchema>;

export const CRITERIA = [
  { id: 'coverage', label: 'Coverage', max: 35 },
  { id: 'artifacts', label: 'Artifacts', max: 15 },
  { id: 'gates', label: 'Gates', max: 15 },
  { id: 'preflight', label: 'Pre-flight', max: 20 },
  { id: 'economy', label: 'Economy', max: 10 },
  { id: 'clarity', label: 'Clarity', max: 5 },
] as const;
export type CriterionId = (typeof CRITERIA)[number]['id'];

const TIER_POINTS: Record<string, number> = { opus: 3, sonnet: 2, haiku: 1, inherit: 2 };

export type TrialEvent =
  | { kind: 'stage'; index: number; id: string; label: string; member: string; skill: string | null; needs: string[]; produced: string[] }
  | { kind: 'gate'; index: number; gate: string; required: boolean }
  | { kind: 'finish'; index: number; total: number };

export interface TrialScore {
  /** per criterion: points earned (one decimal) and why, in words */
  criteria: Record<CriterionId, { points: number; max: number; why: string }>;
  total: number;
}

export interface DryTrial {
  ship: string;
  brief: string;
  kbHash: string;
  shipHash: string;
  truth: 'Simulated';
  score: TrialScore;
  events: TrialEvent[];
  /** what the brief needed that no stage covers, so the Regatta can say why a ship lost points */
  missing: { needs: string[]; artifacts: string[]; gates: string[] };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const base = (p: string) => (p.split('/').pop() ?? p).replace(/ per site$/, '');

/** A stable hash of what a trial depends on in the ship: crew agents, voyage and loadouts (not names or colours). */
export function shipHash(ship: Ship): string {
  const shape = JSON.stringify({
    crew: ship.crew.map((m) => [m.id, m.agent, m.loadout.map((l) => l.skill), m.override ?? null]),
    voyage: ship.voyage,
  });
  let h = 2166136261;
  for (let i = 0; i < shape.length; i++) {
    h ^= shape.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function simulate(ship: Ship, brief: Brief, idx: KbIndex): DryTrial {
  const stages = ship.voyage.filter(isStage);
  const events: TrialEvent[] = [];
  const met = new Map<string, number>(); // need id -> best credit (1 in phase, 0.5 off phase)
  const produced = new Set<string>();
  let index = 0;
  for (const item of ship.voyage) {
    if (isStage(item)) {
      const needs: string[] = [];
      for (const n of brief.needs) {
        if (!item.activeSkill || !n.skills.includes(item.activeSkill)) continue;
        const credit = item.phase === n.phase ? 1 : 0.5;
        if (credit > (met.get(n.id) ?? 0)) met.set(n.id, credit);
        needs.push(n.id);
      }
      const out = item.outputs.map(base);
      out.forEach((o) => produced.add(o));
      events.push({ kind: 'stage', index: index++, id: item.id, label: item.label, member: item.member, skill: item.activeSkill, needs, produced: out.filter((o) => brief.requiredArtifacts.map(base).includes(o)) });
    } else {
      events.push({ kind: 'gate', index: index++, gate: item.gate, required: brief.gates.includes(item.gate) });
    }
  }

  const coverageFrac = brief.needs.reduce((s, n) => s + (met.get(n.id) ?? 0), 0) / brief.needs.length;
  const missingNeeds = brief.needs.filter((n) => !met.has(n.id)).map((n) => n.id);
  const offPhase = brief.needs.filter((n) => met.get(n.id) === 0.5).map((n) => n.id);

  const req = brief.requiredArtifacts.map(base);
  const missingArtifacts = req.filter((a) => !produced.has(a));
  const artifactsFrac = req.length ? (req.length - missingArtifacts.length) / req.length : 1;

  const gatesHere = new Set(ship.voyage.filter((v) => !isStage(v)).map((v) => (v as { gate: string }).gate));
  const missingGates = brief.gates.filter((g) => !gatesHere.has(g));
  const gatesFrac = brief.gates.length ? (brief.gates.length - missingGates.length) / brief.gates.length : 1;

  const pf = preflight(idx, ship);
  const pfFrac = pf.applicable ? pf.passed / pf.applicable : 0;

  const tier = ship.crew.reduce((s, m) => s + (TIER_POINTS[effectiveModel(idx, m)] ?? 2), 0);
  const over = Math.max(0, tier - brief.budget.tierPoints);
  const economy = Math.max(0, 10 - over);

  const staged = new Set(stages.map((s) => s.member));
  const idle = ship.crew.filter((m) => !staged.has(m.id)).length;
  const skills = stages.map((s) => s.activeSkill).filter((s): s is string => !!s);
  const repeats = skills.length - new Set(skills).size;
  const clarity = Math.max(0, 5 - idle - repeats);

  const criteria: TrialScore['criteria'] = {
    coverage: { points: round1(35 * coverageFrac), max: 35, why: missingNeeds.length || offPhase.length ? `${brief.needs.length - missingNeeds.length} of ${brief.needs.length} needs met${offPhase.length ? `, ${offPhase.length} in another phase (half credit)` : ''}` : `all ${brief.needs.length} needs met in their phase` },
    artifacts: { points: round1(15 * artifactsFrac), max: 15, why: missingArtifacts.length ? `missing ${missingArtifacts.join(', ')}` : `all ${req.length} required artifacts produced` },
    gates: { points: round1(15 * gatesFrac), max: 15, why: missingGates.length ? `missing gate ${missingGates.join(', ')}` : brief.gates.length === 1 ? `gate ${brief.gates[0]} held` : `all ${brief.gates.length} gates held` },
    preflight: { points: round1(20 * pfFrac), max: 20, why: `${pf.passed} of ${pf.applicable} checks pass` },
    economy: { points: economy, max: 10, why: `${tier} tier points against a budget of ${brief.budget.tierPoints}` },
    clarity: { points: clarity, max: 5, why: idle || repeats ? [idle ? `${idle} crew without a stage` : '', repeats ? `${repeats} skill opened twice` : ''].filter(Boolean).join(', ') : 'every member has a stage; no skill opened twice' },
  };
  const total = round1(Object.values(criteria).reduce((s, c) => s + c.points, 0));
  events.push({ kind: 'finish', index, total });
  return {
    ship: ship.id,
    brief: brief.id,
    kbHash: idx.kb.sourceHash,
    shipHash: shipHash(ship),
    truth: 'Simulated',
    score: { criteria, total },
    events,
    missing: { needs: missingNeeds, artifacts: missingArtifacts, gates: missingGates },
  };
}
