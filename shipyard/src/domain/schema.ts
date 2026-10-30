/**
 * The ship, as a zod schema. Mirrors `schemas/ship.schema.json` (`shipyard.ship.v1`); the JSON
 * schema is the published contract, this is what the app and the dev-save middleware validate
 * with. Pure: depends on zod only, so vite.config.ts can import it.
 *
 * Skill, agent and workflow ids are references into the generated knowledge base. An unknown id is
 * valid here (it loads as "retired" and fails pre-flight); it is never silently dropped.
 */
import { z } from 'zod';

export const ANCHOR_IDS = ['hand', 'offhand', 'head', 'back', 'belt', 'orbit'] as const;
export const AGENT_IDS = [
  'design-director',
  'brand-strategist',
  'visual-analyst',
  'independent-critic',
  'design-engineer',
  'asset-producer',
  'analytics-specialist',
  'fleet-measurer',
] as const;
export const BODY_IDS = ['captain', 'strategist', 'analyst', 'critic', 'engineer', 'producer', 'metrics', 'standin'] as const;
export const PHASE_IDS = ['always', 'diagnose', 'direct', 'prepare', 'build', 'verify'] as const;
export const HULL_IDS = ['ship-a', 'ship-b', 'ship-c', 'ship-d', 'ship-e'] as const;
export const CLASS_IDS = ['flagship', 'abridged', 'retrofit', 'fleet', 'custom'] as const;
export const TRAIL_IDS = ['full', 'abridged', 'fleet'] as const;

export const anchorId = z.enum(ANCHOR_IDS);
export const agentId = z.enum(AGENT_IDS);

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'must be an ISO date-time');

export const loadoutEntrySchema = z.object({
  skill: z.string(),
  anchor: anchorId,
  index: z.number().int().min(0).max(2).optional(),
});

export const characterSchema = z.object({
  fromCrew: z.string().optional(),
  name: z.string().min(1).max(40),
  species: z.string().max(160).optional(),
  essence: z.string().max(400).optional(),
  analogy: z.string().max(200).optional(),
  body: z.enum(BODY_IDS),
  pigment: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  glyph: z.string().max(4).optional(),
});

export const memberSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  agent: agentId,
  character: characterSchema,
  station: z.number().int().min(1).max(8),
  loadout: z.array(loadoutEntrySchema).max(9),
});

export const stageSchema = z.strictObject({
  kind: z.literal('stage'),
  id: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  label: z.string().max(80),
  phase: z.enum(PHASE_IDS),
  member: z.string(),
  activeSkill: z.string().nullable(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).min(1),
  stop: z.string().min(1),
  parallel: z.boolean().optional(),
  wave: z.number().int().min(0).optional(),
});

export const gateSchema = z.object({
  kind: z.literal('gate'),
  gate: z.string().regex(/^[A-Z0-9]$/),
  label: z.string().max(80),
});

export const logEntrySchema = z.object({
  at: isoDate,
  kind: z.enum(['export', 'verify-result', 'run-json']),
  truth: z.enum(['Verified', 'User-reported']),
  project: z.string().optional(),
  phaseCounts: z.record(z.string(), z.number().int()).optional(),
  note: z.string().max(400).optional(),
  /** export: the file or action ("00-run-plan.md", "ship.json", "kickoff prompt", "shipyard/ships/<id>.ship.json") */
  file: z.string().max(120).optional(),
  /** export: pre-flight had no blocker and no warning when the file was made */
  clean: z.boolean().optional(),
  /** export: hull integrity (0..100) at that moment */
  hull: z.number().int().min(0).max(100).optional(),
  /** verify-result: 0 means CLEAN, n means n problem(s) */
  problems: z.number().int().min(0).optional(),
  /** run-json: how many artifact_hashes the file carried (absent when the file had none) */
  artifactHashes: z.number().int().min(0).optional(),
  /** run-json: identity of the run, so the same file is logged once */
  runKey: z.string().max(64).optional(),
});

export const shipSchema = z.strictObject({
  schema: z.literal('shipyard.ship.v1'),
  id: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
  name: z.string().min(1).max(48),
  class: z.enum(CLASS_IDS),
  origin: z
    .object({
      kind: z.enum(['library', 'clone', 'blank', 'import']),
      workflow: z.string().optional(),
      from: z.string().optional(),
    })
    .optional(),
  summary: z.string().max(400).optional(),
  hull: z.enum(HULL_IDS).optional(),
  trail: z.enum(TRAIL_IDS).optional(),
  doctrine: z.string().nullable().optional(),
  modules: z.array(z.string()).optional(),
  kbHash: z.string(),
  crew: z.array(memberSchema).min(1).max(8),
  voyage: z.array(z.union([stageSchema, gateSchema])).min(1),
  logbook: z.array(logEntrySchema).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  hold: z.array(z.string()).optional(),
  scoped: z.boolean().optional(),
});

export type Anchor = z.infer<typeof anchorId>;
export type AgentId = z.infer<typeof agentId>;
export type Phase = (typeof PHASE_IDS)[number];
export type LoadoutEntry = z.infer<typeof loadoutEntrySchema>;
export type Character = z.infer<typeof characterSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type Gate = z.infer<typeof gateSchema>;
export type VoyageItem = Stage | Gate;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type Ship = z.infer<typeof shipSchema>;

export const isStage = (v: VoyageItem): v is Stage => v.kind === 'stage';
export const isGate = (v: VoyageItem): v is Gate => v.kind === 'gate';

/** A readable list of zod issues, one line each (the import-invalid state). */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
}
