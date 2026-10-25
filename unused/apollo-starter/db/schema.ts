/**
 * Convenium.Design — Drizzle schema (Postgres).
 *
 * Design rules encoded here:
 *   - every tenant row carries orgId; nothing is global except skills
 *   - artifacts are immutable and content-addressed (no overwrite-in-place,
 *     unlike systems.mjs:recordSystemOutput which splices over history)
 *   - gate decisions and credit movements are append-only ledgers
 *   - token usage is recorded per step from the provider, never estimated
 */

import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex, pgEnum
} from 'drizzle-orm/pg-core'

export const phaseEnum = pgEnum('phase', ['diagnose', 'direct', 'prepare', 'build', 'verify'])
export const effortEnum = pgEnum('effort', ['brief', 'standard', 'deep'])
export const gateEnum = pgEnum('gate', ['A', 'B', 'C'])
export const runStatusEnum = pgEnum('run_status', [
  'draft', 'planned', 'running', 'blocked', 'complete', 'failed', 'abandoned'
])
export const stepStatusEnum = pgEnum('step_status', [
  'pending', 'running', 'complete', 'failed', 'skipped'
])
export const gateDecisionEnum = pgEnum('gate_decision', ['approve', 'reject', 'revise'])

// ── tenancy ───────────────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: text('auth_id').notNull().unique(),   // from Clerk/WorkOS
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member')   // owner | admin | member
}, t => [uniqueIndex('memberships_org_user').on(t.orgId, t.userId)])

// ── skills (global, versioned, immutable) ─────────────────────────────────

export const skills = pgTable('skills', {
  id: text('id').primaryKey(),                  // 'ux-evidence-audit'
  name: text('name').notNull(),
  phase: phaseEnum('phase').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull()
})

export const skillVersions = pgTable('skill_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillId: text('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  /** The FULL SKILL.md body. Never a summary — that drift is what rotted skills.mjs. */
  body: text('body').notNull(),
  sourceHash: text('source_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [uniqueIndex('skill_versions_skill_version').on(t.skillId, t.version)])

// ── configuration ─────────────────────────────────────────────────────────

export const systems = pgTable('systems', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }), // null = Convenium.Design template
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  instructions: text('instructions').notNull().default(''),
  /** AgentConfig[] from core/planner.ts, validated on write. */
  agents: jsonb('agents').notNull().$type<unknown[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('systems_org').on(t.orgId)])

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetUrl: text('target_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('projects_org').on(t.orgId)])

// ── runs ──────────────────────────────────────────────────────────────────

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  systemId: uuid('system_id').notNull().references(() => systems.id),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
  brief: text('brief').notNull(),
  status: runStatusEnum('status').notNull().default('draft'),
  /** RunPlan from core/planner.ts, frozen at plan time. */
  plan: jsonb('plan').notNull().$type<unknown>(),
  blockedOnGate: gateEnum('blocked_on_gate'),
  /** Credits reserved at plan time; released on completion. */
  creditsReserved: integer('credits_reserved').notNull().default(0),
  creditsSpent: integer('credits_spent').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('runs_org_status').on(t.orgId, t.status), index('runs_project').on(t.projectId)])

export const runSteps = pgTable('run_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull(),
  attempt: integer('attempt').notNull().default(1),   // re-runs append, never overwrite
  phase: phaseEnum('phase').notNull(),
  effort: effortEnum('effort').notNull(),
  status: stepStatusEnum('status').notNull().default('pending'),
  /** Pinned skill_version ids — a run always reports what it actually used. */
  skillVersionIds: jsonb('skill_version_ids').notNull().$type<string[]>(),
  inputArtifactIds: jsonb('input_artifact_ids').notNull().$type<string[]>().default([]),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true })
}, t => [
  index('run_steps_run').on(t.runId),
  uniqueIndex('run_steps_run_agent_attempt').on(t.runId, t.agentId, t.attempt)
])

export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  runStepId: uuid('run_step_id').references(() => runSteps.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),                  // '01-audit' | '02-concepts' | 'image' | ...
  contentHash: text('content_hash').notNull(),
  storageKey: text('storage_key').notNull(),     // R2 object key; never a filesystem path
  mimeType: text('mime_type').notNull(),
  bytes: integer('bytes').notNull(),
  /** Rights + provenance. Required for anything generated. Legal record, not metadata. */
  provenance: jsonb('provenance').$type<{
    source: 'generated' | 'user-supplied' | 'licensed'
    model?: string
    license?: string
    supplierNote?: string
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('artifacts_run').on(t.runId), index('artifacts_hash').on(t.contentHash)])

export const gateDecisions = pgTable('gate_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  gate: gateEnum('gate').notNull(),
  decision: gateDecisionEnum('decision').notNull(),
  /** Never null. A gate is only meaningful if a person owns it. */
  decidedByUserId: uuid('decided_by_user_id').notNull().references(() => users.id),
  note: text('note'),
  evidenceArtifactIds: jsonb('evidence_artifact_ids').notNull().$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('gate_decisions_run').on(t.runId)])

export const runEvents = pgTable('run_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').references(() => runs.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  summary: text('summary').notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('run_events_run_created').on(t.runId, t.createdAt)])

// ── billing ───────────────────────────────────────────────────────────────

export const creditLedger = pgTable('credit_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  /** Positive = purchase/grant, negative = consumption. Balance is the SUM. */
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  runId: uuid('run_id').references(() => runs.id),
  stripeEventId: text('stripe_event_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
  index('credit_ledger_org_created').on(t.orgId, t.createdAt),
  uniqueIndex('credit_ledger_stripe_event').on(t.stripeEventId)   // idempotent webhooks
])
