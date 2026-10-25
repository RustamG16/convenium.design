/** Canonical prototype contract. Legacy services remain authoritative for their APIs.
 * All new mutations enter dispatch(); reads and migration never write legacy data.
 * Optional persistence is an append-only transaction journal, not a second mutable cache.
 */
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const SCHEMA_VERSION = 1;
export const ENVIRONMENT_STATUSES = Object.freeze(['local', 'demo', 'live', 'unverified', 'unavailable', 'unknown']);
export const RUN_TRANSITIONS = Object.freeze({
  draft: ['running', 'cancelled'], running: ['paused', 'blocked', 'complete', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'], blocked: ['running', 'cancelled', 'failed'],
  complete: [], failed: [], cancelled: [], unknown: ['draft'],
});
const collections = ['projects', 'intakes', 'plans', 'comparisons', 'runs', 'artifacts', 'reviews', 'notifications', 'capabilities'];
const recordCollections = ['projects', 'intakes', 'plans', 'comparisons', 'reviews', 'notifications', 'capabilities'];
const eventTypes = ['proposal.created', 'proposal.approved', 'proposal.cancelled', 'proposal.applied', 'artifact.saved', 'gate.approved', 'approval.invalidated', 'record.updated', 'run.created', 'run.transitioned', 'attempt.recorded'];
const fixtureTime = '2026-09-15T00:00:00.000Z';
const queues = new Map();
const copy = value => structuredClone(value);
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const lookup = (state, collection, id) => state[collection].find(record => record.id === id);

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
export function hashValue(value) {
  assertJson(value);
  return createHash('sha256').update(canonical(value)).digest('hex');
}
function assertJson(value, depth = 0) {
  requireValue(depth < 32, 'State is nested too deeply.');
  if (value === null || ['string', 'boolean'].includes(typeof value)) return;
  if (typeof value === 'number') { requireValue(Number.isFinite(value), 'State numbers must be finite.'); return; }
  requireValue(value && typeof value === 'object' && (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype), 'State must contain JSON values only.');
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    requireValue(keys.length === value.length && keys.every((key, index) => key === String(index)), 'Sparse arrays and extra array properties are not allowed in canonical JSON.');
  }
  for (const [key, item] of Object.entries(value)) {
    requireValue(!['__proto__', 'prototype', 'constructor'].includes(key), 'Unsafe state field.');
    requireValue(!/^(authorization|cookie|password|secret|api[-_]?key|access[-_]?token|refresh[-_]?token)$/i.test(key), 'Credentials are not allowed in canonical state.');
    assertJson(item, depth + 1);
  }
}
function blankState() {
  return { schemaVersion: SCHEMA_VERSION, revision: 0, source: { kind: 'local', deterministic: false }, ...Object.fromEntries(collections.map(key => [key, []])), proposals: [], approvals: [], attempts: [], events: [], migrations: [] };
}
function domainHash(state) {
  return hashValue(Object.fromEntries([...collections, 'approvals', 'attempts'].map(key => [key, state[key]])));
}
function artifactHash(artifact) { return hashValue({ projectId: artifact.projectId, kind: artifact.kind, content: artifact.content }); }

export function validateState(state) {
  assertJson(state);
  requireValue(state.schemaVersion === SCHEMA_VERSION, 'Unsupported canonical schema version.');
  requireValue(Number.isInteger(state.revision) && state.revision >= 0, 'Invalid state revision.');
  for (const name of [...collections, 'proposals', 'approvals', 'attempts', 'events', 'migrations']) {
    requireValue(Array.isArray(state[name]), `${name} must be an array.`);
    const ids = new Set();
    for (const record of state[name]) {
      requireValue(hasText(record.id) && !ids.has(record.id), `Invalid or duplicate ${name} ID.`);
      ids.add(record.id);
      if (record.projectId) requireValue(Boolean(lookup(state, 'projects', record.projectId)), `Unknown project in ${name}.`);
    }
  }
  for (const capability of state.capabilities) {
    requireValue(ENVIRONMENT_STATUSES.includes(capability.status), 'Unknown capability status; use literal unknown for missing evidence.');
    if (capability.status === 'live') requireValue(capability.verification?.status === 'verified' && hasText(capability.verification.checkedAt) && hasText(capability.verification.evidence), 'Live capability requires verified probe evidence.');
  }
  for (const run of state.runs) {
    requireValue(Object.hasOwn(RUN_TRANSITIONS, run.status), 'Unknown run status.');
    requireValue(ENVIRONMENT_STATUSES.includes(run.mode), 'Unknown run mode.');
  }
  for (const artifact of state.artifacts) {
    requireValue(['brief', 'plan', 'design', 'output', 'evidence'].includes(artifact.kind), 'Unknown artifact kind.');
    requireValue(artifact.hash === artifactHash(artifact), 'Artifact hash mismatch.');
    requireValue(Array.isArray(artifact.versions) && artifact.versions.length > 0, 'Artifact versions are required.');
    artifact.versions.forEach((version, index) => requireValue(version.version === index + 1 && version.hash === artifactHash({ ...artifact, content: version.content }), 'Artifact version history hash mismatch.'));
    requireValue(artifact.versions.at(-1).hash === artifact.hash, 'Current artifact must match its latest version.');
  }
  for (const review of state.reviews) {
    requireValue(['unknown', 'draft', 'pending', 'running', 'complete', 'failed', 'cancelled', 'stale'].includes(review.status), 'Unknown review status.');
    requireValue(['qa', 'independent'].includes(review.kind), 'Unknown review kind.');
    const artifact = lookup(state, 'artifacts', review.artifactId);
    requireValue(artifact && review.projectId === artifact.projectId, 'Review must reference an artifact in the same project.');
    requireValue(hasText(review.artifactHash) && artifact.versions.some(version => version.hash === review.artifactHash), 'Review must bind an existing artifact version hash.');
    requireValue(Array.isArray(review.evidence) && review.evidence.every(hasText), 'Review evidence must be an array of nonempty references.');
    requireValue(['PASS', 'FAIL', 'unknown'].includes(review.verdict), 'Review verdict must be PASS, FAIL or unknown.');
    requireValue(review.authorId === null || hasText(review.authorId), 'Review author must be an ID or explicit null.');
    if (review.status === 'complete') requireValue(review.verdict !== 'unknown' && hasText(review.authorId) && review.evidence.length > 0, 'Completed review requires an explicit verdict, author and evidence.');
  }
  for (const proposal of state.proposals) {
    requireValue(['pending', 'approved', 'cancelled', 'applied'].includes(proposal.status), 'Unknown proposal status.');
    requireValue(proposal.operationHash === hashValue(proposal.operation), 'Proposal operation hash mismatch.');
    if (['approved', 'applied'].includes(proposal.status)) userActor(proposal.actor);
  }
  for (const approval of state.approvals) {
    requireValue(['A', 'B', 'C'].includes(approval.gate) && ['approved', 'stale'].includes(approval.status), 'Unknown gate approval status.');
    requireValue(approval.actor?.kind === 'user' && hasText(approval.actor.id), 'Gate approval requires a user.');
    requireValue(hasText(approval.bindings?.artifacts?.[approval.artifactId]), 'Gate approval requires a bound artifact hash.');
    if (approval.status === 'approved') requireValue(bindingsCurrent(state, approval), 'Approved gate evidence or hashes are stale.');
  }
  state.events.forEach((event, index) => {
    requireValue(eventTypes.includes(event.type) && event.sequence === index + 1 && hasText(event.createdAt), 'Invalid typed event sequence.');
  });
  return true;
}

/** Stable, labelled fixture data. No synthetic latency, price, verification or approvals. */
export function createFixtureState() {
  const state = blankState();
  state.source = { kind: 'demo', deterministic: true, label: 'Deterministic prototype fixture' };
  state.projects.push({ id: 'project-demo', name: 'Convenium.Design example project', stage: 'intake', status: 'draft', source: 'demo' });
  state.intakes.push({ id: 'intake-demo', projectId: 'project-demo', status: 'draft', questions: [{ id: 'outcome', text: 'What should this project achieve?', required: true }], answers: {}, contextTokens: [], unknowns: ['Audience', 'Available media'] });
  state.plans.push({ id: 'plan-demo', projectId: 'project-demo', status: 'draft', stages: ['intake', 'brief', 'plan', 'configure', 'work', 'results'], roles: ['Oracle', 'Design Director'], dependencies: [], budget: { status: 'unknown', estimate: null }, fallbacks: ['Deterministic local preview'] });
  state.comparisons.push({ id: 'comparison-demo', projectId: 'project-demo', status: 'draft', setupA: { model: 'unknown', skills: [] }, setupB: { model: 'unknown', skills: [] }, testResults: [], estimates: { cost: null, timeMs: null, status: 'unknown' }, productionApplied: false });
  state.runs.push({ id: 'run-demo', projectId: 'project-demo', status: 'draft', mode: 'demo', tasks: [], blockers: [], metrics: { cost: null, timeMs: null, tokens: null, status: 'unknown' } });
  const artifact = { id: 'artifact-demo', projectId: 'project-demo', kind: 'output', content: { title: 'No output produced', preview: null, provenance: [], limitations: ['Deterministic example; no execution or QA performed.'] } };
  artifact.hash = artifactHash(artifact);
  artifact.versions = [{ version: 1, hash: artifact.hash, content: copy(artifact.content), createdAt: fixtureTime }];
  state.artifacts.push(artifact);
  state.reviews.push({ id: 'review-demo', projectId: 'project-demo', artifactId: artifact.id, artifactHash: artifact.hash, kind: 'independent', status: 'unknown', verdict: 'unknown', evidence: [], authorId: null });
  state.notifications.push({ id: 'notification-demo', projectId: 'project-demo', reason: 'required-input', status: 'draft', message: 'Describe the project outcome.', delivered: false, policy: 'quiet-by-default' });
  state.capabilities.push({ id: 'runtime', status: 'unknown', configured: false, verification: null, fallback: 'demo' });
  validateState(state);
  return state;
}

/** Import supplied legacy snapshots only. No filesystem discovery or legacy writes.
 * Unbound legacy approvals are intentionally not imported as canonical approvals.
 */
export function migrateState(input = {}) {
  if (input.schemaVersion !== undefined) { validateState(input); return copy(input); }
  const state = blankState();
  const workspace = input.workspace || input;
  for (const project of workspace.projects || []) state.projects.push({ id: String(project.id), name: String(project.name || 'Untitled project'), archived: project.archived === true, stage: 'intake', status: 'unknown', source: 'legacy' });
  for (const run of input.runs || []) {
    const runId = String(run.runId || run.id || `legacy-run-${state.runs.length + 1}`);
    state.runs.push({ id: runId, status: 'unknown', mode: run.mode === 'demo' ? 'demo' : 'unverified', source: 'legacy', prompt: String(run.prompt || ''), model: String(run.model || 'unknown'), metrics: { cost: null, timeMs: null, tokens: null, status: 'unknown' } });
    for (const [index, result] of (run.results || []).entries()) {
      const artifact = { id: `${runId}-output-${index + 1}`, projectId: null, runId, kind: 'output', source: 'legacy', content: { text: String(result.text || ''), name: String(result.name || ''), error: result.error ? String(result.error) : null, provenance: ['Imported supplied legacy run snapshot; verification unknown'] } };
      artifact.hash = artifactHash(artifact);
      artifact.versions = [{ version: 1, hash: artifact.hash, content: copy(artifact.content), createdAt: null }];
      state.artifacts.push(artifact);
    }
  }
  const mode = input.config?.mode;
  state.capabilities.push({ id: 'runtime', status: mode === 'demo' ? 'demo' : mode ? 'unverified' : 'unknown', verification: null, fallback: 'demo' });
  state.migrations.push({ id: `legacy-${hashValue({ projects: state.projects, runs: state.runs, artifacts: state.artifacts, mode: mode || null })}`, fromVersion: 0, toVersion: SCHEMA_VERSION, warnings: ['Legacy proposal decisions have no content hashes and are not canonical approvals.', 'Only project and run/output snapshots are imported; legacy chats, attachments and proposals remain in their authoritative services.'] });
  validateState(state);
  return state;
}

function userActor(actor) { requireValue(actor?.kind === 'user' && hasText(actor.id), 'Explicit user approval is required.'); }
function emit(state, type, data, timestamp) {
  const sequence = state.events.length + 1;
  state.events.push({ id: `event-${sequence}`, sequence, type, createdAt: timestamp, data: copy(data) });
}
function bindingsCurrent(state, approval) {
  // New evidence can disqualify an approval without changing any previously bound
  // record. Keep this invariant shared by mutations, validation and migration.
  if (approval.gate === 'C' && hasFailingReview(state, approval.artifactId, approval.bindings?.artifacts?.[approval.artifactId])) return false;
  return Object.entries(approval.bindings || {}).every(([collection, records]) => Object.entries(records).every(([id, hash]) => {
    const record = lookup(state, collection, id);
    return record && (collection === 'artifacts' ? record.hash : hashValue(record)) === hash;
  }));
}
function hasFailingReview(state, artifactId, artifactHash) {
  return state.reviews.some(review => review.artifactId === artifactId && review.artifactHash === artifactHash && review.status === 'complete' && review.verdict === 'FAIL');
}
function invalidateApprovals(state, timestamp) {
  for (const approval of state.approvals) if (approval.status === 'approved' && !bindingsCurrent(state, approval)) {
    approval.status = 'stale'; approval.invalidatedAt = timestamp;
    emit(state, 'approval.invalidated', { approvalId: approval.id, gate: approval.gate }, timestamp);
  }
}
function saveArtifact(state, input, timestamp) {
  requireValue(hasText(input?.id) && Object.hasOwn(input, 'content'), 'Artifact ID and content are required.');
  const current = lookup(state, 'artifacts', input.id);
  if (current) requireValue(current.kind === input.kind && current.projectId === input.projectId, 'Artifact identity cannot change.');
  const artifact = { id: input.id, projectId: input.projectId, kind: input.kind, content: copy(input.content) };
  artifact.hash = artifactHash(artifact);
  if (current?.hash === artifact.hash) return;
  artifact.versions = [...(current?.versions || []), { version: (current?.versions.length || 0) + 1, hash: artifact.hash, content: copy(artifact.content), createdAt: timestamp }];
  if (current) state.artifacts[state.artifacts.indexOf(current)] = artifact; else state.artifacts.push(artifact);
  emit(state, 'artifact.saved', { artifactId: artifact.id, hash: artifact.hash, version: artifact.versions.length }, timestamp);
}

function applyOperation(state, operation, timestamp, approver) {
  switch (operation.type) {
    case 'batch': {
      requireValue(Array.isArray(operation.operations) && operation.operations.length > 0 && operation.operations.length <= 20, 'Batch requires 1–20 operations.');
      requireValue(operation.operations.every(item => item.type !== 'batch'), 'Nested batches are not supported.');
      for (const item of operation.operations) applyOperation(state, item, timestamp, approver);
      break;
    }
    case 'artifact.save': saveArtifact(state, operation.artifact, timestamp); break;
    case 'record.put': {
      requireValue(recordCollections.includes(operation.collection), 'Record collection is not writable.');
      const record = copy(operation.record);
      requireValue(hasText(record?.id), 'Record ID is required.');
      if (['plans', 'comparisons'].includes(operation.collection)) requireValue(record.status === 'draft' && !record.productionApplied, 'Configuration and comparison records must remain drafts; approve plan artifacts to apply production changes.');
      if (operation.collection === 'notifications') requireValue(['required-input', 'approval', 'completion', 'failure', 'meaningful-change', 'user-created-reminder'].includes(record.reason), 'Unchanged monitoring must remain silent.');
      const index = state[operation.collection].findIndex(item => item.id === record.id);
      if (index < 0) state[operation.collection].push(record); else state[operation.collection][index] = record;
      emit(state, 'record.updated', { collection: operation.collection, recordId: record.id }, timestamp);
      break;
    }
    case 'run.transition': {
      const run = lookup(state, 'runs', operation.runId);
      requireValue(run && RUN_TRANSITIONS[run.status].includes(operation.status), 'Invalid run transition.');
      const from = run.status; run.status = operation.status;
      emit(state, 'run.transitioned', { runId: run.id, from, to: run.status }, timestamp);
      break;
    }
    case 'run.create': {
      const run = operation.run;
      requireValue(hasText(run?.id) && !lookup(state, 'runs', run.id) && run.status === 'draft', 'New run requires a unique ID and draft status.');
      requireValue(run.mode !== 'live' || state.capabilities.some(capability => capability.status === 'live'), 'Live run requires a verified live capability.');
      state.runs.push(copy(run));
      emit(state, 'run.created', { runId: run.id, mode: run.mode }, timestamp);
      break;
    }
    case 'attempt.record': {
      const attempt = operation.attempt;
      requireValue(hasText(attempt?.id) && lookup(state, 'runs', attempt.runId), 'Attempt ID and existing run are required.');
      requireValue(['complete', 'failed', 'cancelled'].includes(attempt.status) && Array.isArray(attempt.outputs), 'Attempt requires a terminal status and outputs array.');
      requireValue(attempt.status === 'complete' || attempt.outputs.length === 0, 'Failed or cancelled attempts cannot publish outputs.');
      const fingerprint = hashValue(attempt);
      const existing = lookup(state, 'attempts', attempt.id);
      if (existing) { requireValue(existing.fingerprint === fingerprint, 'Attempt replay has different content.'); return; }
      for (const output of attempt.outputs) {
        requireValue(!lookup(state, 'artifacts', output.id), 'Attempt output already exists.');
        saveArtifact(state, output, timestamp);
      }
      state.attempts.push({ ...copy(attempt), fingerprint, createdAt: timestamp });
      emit(state, 'attempt.recorded', { attemptId: attempt.id, runId: attempt.runId, status: attempt.status, outputIds: attempt.outputs.map(output => output.id) }, timestamp);
      break;
    }
    case 'gate.approve': {
      userActor(operation.actor);
      requireValue(approver?.id === operation.actor.id, 'Gate reviewer must match the proposal approver.');
      const artifact = lookup(state, 'artifacts', operation.artifactId);
      requireValue(artifact && ({ A: 'brief', B: 'plan', C: 'output' })[operation.gate] === artifact.kind, 'Gate requires the appropriate artifact kind.');
      const bindings = { artifacts: { [artifact.id]: artifact.hash }, reviews: {} };
      if (operation.gate !== 'A') {
        const previous = state.approvals.findLast(item => item.projectId === artifact.projectId && item.gate === (operation.gate === 'B' ? 'A' : 'B') && item.status === 'approved');
        requireValue(previous && bindingsCurrent(state, previous), 'Previous gate must have a current approval.');
        Object.assign(bindings.artifacts, previous.bindings.artifacts);
        const designs = state.artifacts.filter(item => item.projectId === artifact.projectId && item.kind === 'design');
        requireValue(designs.length > 0, 'Plan approval requires a committed design artifact.');
        for (const design of designs) bindings.artifacts[design.id] = design.hash;
      }
      for (const id of operation.dependencyIds || []) {
        const dependency = lookup(state, 'artifacts', id);
        requireValue(dependency?.projectId === artifact.projectId, 'Approval dependency must exist in the same project.');
        bindings.artifacts[id] = dependency.hash;
      }
      if (operation.gate === 'C') {
        for(const kind of ['plan','design']) {
          const declared=artifact.content[`${kind}Hash`];
          if(declared) requireValue(state.artifacts.some(a=>a.projectId===artifact.projectId&&a.kind===kind&&a.hash===declared&&bindings.artifacts[a.id]===declared), `Output ${kind} hash does not match the current approved ${kind}.`);
        }
        const evidence = operation.evidence;
        requireValue(evidence && Array.isArray(evidence.provenance) && evidence.provenance.some(hasText) && Array.isArray(evidence.limitations) && evidence.limitations.every(hasText) && hasText(evidence.userReview), 'Gate C requires provenance, limitations and user review evidence.');
        const reviews = state.reviews.filter(item => item.artifactId === artifact.id && item.artifactHash === artifact.hash && item.status === 'complete' && item.evidence?.some(hasText) && hasText(item.authorId));
        requireValue(!hasFailingReview(state, artifact.id, artifact.hash), 'Gate C cannot approve a current artifact with a failing review.');
        const qa = reviews.find(item => item.kind === 'qa' && item.verdict === 'PASS');
        const independent = reviews.find(item => item.kind === 'independent' && item.verdict === 'PASS' && item.authorId !== qa?.authorId);
        requireValue(qa && independent, 'Gate C requires passing QA and independent review of the current artifact.');
        for (const review of [qa, independent]) bindings.reviews[review.id] = hashValue(review);
      }
      const approval = { id: `approval-${state.approvals.length + 1}`, projectId: artifact.projectId, gate: operation.gate, artifactId: artifact.id, status: 'approved', bindings, actor: copy(operation.actor), evidence: copy(operation.evidence || {}), createdAt: timestamp };
      state.approvals.push(approval);
      emit(state, 'gate.approved', { approvalId: approval.id, gate: approval.gate, bindings }, timestamp);
      break;
    }
    default: throw new Error('Unsupported proposal operation.');
  }
  invalidateApprovals(state, timestamp);
}

function reduce(state, command, timestamp) {
  const next = copy(state);
  switch (command.type) {
    case 'proposal.create': {
      requireValue(hasText(command.id), 'Proposal ID is required.');
      const existing = lookup(next, 'proposals', command.id);
      const operationHash = hashValue(command.operation);
      if (existing) { requireValue(existing.operationHash === operationHash, 'Proposal ID already has different content.'); return state; }
      // Validate proposed effects before presenting a reviewable proposal; no state escapes.
      const preview = copy(next);
      applyOperation(preview, command.operation, timestamp, command.operation.actor || { kind: 'user', id: 'preview' });
      validateState(preview);
      next.proposals.push({ id: command.id, status: 'pending', operation: copy(command.operation), operationHash, baseHash: domainHash(next), createdAt: timestamp });
      emit(next, 'proposal.created', { proposalId: command.id, operationHash }, timestamp);
      break;
    }
    case 'proposal.resolve': {
      userActor(command.actor);
      const proposal = lookup(next, 'proposals', command.id);
      requireValue(proposal?.status === 'pending', 'Pending proposal is required.');
      requireValue(typeof command.approved === 'boolean', 'Explicit approval decision is required.');
      requireValue(command.operationHash === proposal.operationHash, 'Approval operation hash does not match.');
      proposal.status = command.approved ? 'approved' : 'cancelled';
      proposal.actor = copy(command.actor); proposal.resolvedAt = timestamp;
      emit(next, command.approved ? 'proposal.approved' : 'proposal.cancelled', { proposalId: proposal.id, actor: command.actor, operationHash: proposal.operationHash }, timestamp);
      break;
    }
    case 'proposal.apply': {
      const proposal = lookup(next, 'proposals', command.id);
      if (proposal?.status === 'applied') return state;
      requireValue(proposal?.status === 'approved', 'An approved proposal is required.');
      requireValue(proposal.baseHash === domainHash(next), 'Proposal is stale; create and review a new proposal.');
      applyOperation(next, proposal.operation, timestamp, proposal.actor);
      proposal.status = 'applied'; proposal.appliedAt = timestamp;
      emit(next, 'proposal.applied', { proposalId: proposal.id, operationHash: proposal.operationHash }, timestamp);
      break;
    }
    default: throw new Error('Unsupported state command; use a structured proposal.');
  }
  next.revision += 1;
  validateState(next);
  return next;
}

/** filePath must be a dedicated canonical journal, never a legacy JSON/JSONL file.
 * Serializes all instances addressing the same path in this process. Cross-process
 * writers require an external lock and are outside this local prototype contract.
 */
export function createStateWriter({ filePath, initialState = blankState(), clock = () => new Date().toISOString() } = {}) {
  validateState(initialState);
  let memory = copy(initialState);
  const absolutePath = filePath ? resolve(filePath) : null;
  const key = absolutePath ? (process.platform === 'win32' ? absolutePath.toLowerCase() : absolutePath) : Symbol('state-writer');
  function enqueue(work) {
    const result = (queues.get(key) || Promise.resolve()).then(work);
    const settled = result.catch(() => {});
    queues.set(key, settled);
    void settled.then(() => { if (queues.get(key) === settled) queues.delete(key); });
    return result;
  }
  async function loadJournal() {
    if (!filePath) return memory;
    let raw;
    try { raw = await readFile(filePath, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return copy(initialState); throw error; }
    requireValue(raw.length > 0 && raw.endsWith('\n'), 'Canonical journal is empty or truncated; recovery is required.');
    let previous = null;
    for (const line of raw.trimEnd().split('\n')) {
      const transaction = JSON.parse(line);
      validateState(transaction.state);
      requireValue(transaction.hash === hashValue(transaction.state), 'Canonical journal hash mismatch.');
      if (previous) {
        requireValue(transaction.previousHash === hashValue(previous) && transaction.state.revision === previous.revision + 1, 'Canonical journal revision chain mismatch.');
        requireValue(canonical(transaction.state.events.slice(0, previous.events.length)) === canonical(previous.events), 'Canonical journal events are not append-only.');
      } else requireValue(transaction.previousHash === null, 'Canonical journal must start with a root transaction.');
      previous = transaction.state;
    }
    return previous;
  }
  return Object.freeze({
    read: () => enqueue(async () => copy(await loadJournal())),
    dispatch: command => enqueue(async () => {
      assertJson(command);
      const current = await loadJournal();
      const next = reduce(current, copy(command), clock());
      if (next === current) return copy(current);
      if (filePath) {
        await mkdir(dirname(resolve(filePath)), { recursive: true });
        let exists = true;
        try { await readFile(filePath); } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; }
        const transaction = { previousHash: exists ? hashValue(current) : null, hash: hashValue(next), state: next };
        await appendFile(filePath, `${JSON.stringify(transaction)}\n`, 'utf8');
      }
      memory = next;
      return copy(next);
    }),
  });
}
