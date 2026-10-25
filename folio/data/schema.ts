/**
 * Folio — Drizzle schema (Postgres). Scaffold stub: shapes only, no migrations yet.
 *
 * Rules encoded here (see ARCHITECTURE.md §4):
 *   - profiles, dna and builds are immutable and versioned; a site points at a build
 *   - edits are JSON-path overrides that remember the value they were made against
 *   - credits are an append-only ledger
 *   - no organizations in v1 (Studio tier adds them with a migration)
 */
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'pro'])
export const buildStatusEnum = pgEnum('build_status', ['queued', 'validating', 'classifying', 'dna', 'composing', 'media', 'rendering', 'qa', 'qa_passed', 'qa_failed', 'failed'])
export const siteStatusEnum = pgEnum('site_status', ['draft', 'preview', 'published', 'suspended'])
export const mediaSourceEnum = pgEnum('media_source', ['upload', 'generated', 'fallback'])
export const domainStatusEnum = pgEnum('domain_status', ['pending_cname', 'verifying', 'issuing_tls', 'active', 'error'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: text('auth_id').notNull().unique(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  plan: planEnum('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  version: integer('version').notNull(),
  schemaVersion: integer('schema_version').notNull(),
  json: jsonb('json').notNull(),
  contentHash: text('content_hash').notNull(),
  generatedBy: text('generated_by'),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow()
}, t => ({ byUser: uniqueIndex('profiles_user_version').on(t.userId, t.version) }))

export const dna = pgTable('dna', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id),
  version: integer('version').notNull(),
  sliders: jsonb('sliders').notNull(),           // { loud: -1..1, warm: -1..1 }
  json: jsonb('json').notNull(),                 // dna.schema.json
  mappingVersion: text('mapping_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  slug: text('slug').notNull().unique(),         // <slug>.folio.site
  status: siteStatusEnum('status').notNull().default('draft'),
  currentBuildId: uuid('current_build_id'),
  previewBuildId: uuid('preview_build_id'),
  roleOverride: text('role_override'),
  noindex: boolean('noindex').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const builds = pgTable('builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  profileId: uuid('profile_id').notNull().references(() => profiles.id),
  dnaId: uuid('dna_id').notNull().references(() => dna.id),
  templatesVersion: text('templates_version').notNull(),
  role: text('role').notNull(),
  roleConfidence: integer('role_confidence_pct'),
  sectionPlan: jsonb('section_plan'),
  bundleKey: text('bundle_key'),
  qaReport: jsonb('qa_report'),
  runLog: jsonb('run_log'),                      // run.json
  status: buildStatusEnum('status').notNull().default('queued'),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  costCents: integer('cost_cents').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true })
}, t => ({ bySite: index('builds_site').on(t.siteId) }))

export const edits = pgTable('edits', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  path: text('path').notNull(),                  // JSON path into the profile, e.g. experience[2].summary
  value: jsonb('value').notNull(),
  editedAgainst: jsonb('edited_against').notNull(),
  stale: boolean('stale').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => ({ bySitePath: uniqueIndex('edits_site_path').on(t.siteId, t.path) }))

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  siteId: uuid('site_id').references(() => sites.id),
  key: text('key').notNull(),                    // R2 object key
  kind: text('kind').notNull(),                  // image | video
  source: mediaSourceEnum('source').notNull(),
  slot: text('slot'),                            // e.g. hero, work[3]
  width: integer('width'), height: integer('height'),
  alt: text('alt'),
  licence: text('licence'),
  rightsConfirmed: boolean('rights_confirmed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),              // purchase | media.generate | refund | grant
  ref: text('ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  hostname: text('hostname').notNull().unique(),
  cfHostnameId: text('cf_hostname_id'),
  status: domainStatusEnum('status').notNull().default('pending_cname'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
