import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SCHEMA_VERSION, createFixtureState, migrateState, validateState, hashValue, createStateWriter } from '../state.mjs';

const user = { kind: 'user', id: 'test-reviewer' };
const fixedClock = () => '2026-09-15T12:00:00.000Z';
async function apply(writer, operation, id = crypto.randomUUID()) {
  await writer.dispatch({ type: 'proposal.create', id, operation });
  const proposal = (await writer.read()).proposals.find(item => item.id === id);
  await writer.dispatch({ type: 'proposal.resolve', id, approved: true, actor: user, operationHash: proposal.operationHash });
  return writer.dispatch({ type: 'proposal.apply', id });
}
const artifact = (id, kind, content) => ({ type: 'artifact.save', artifact: { id, projectId: 'project-demo', kind, content } });
async function approvedChain(writer) {
  for (const [id, kind] of [['brief', 'brief'], ['plan', 'plan'], ['design', 'design']]) await apply(writer, artifact(id, kind, { text: id }));
  await apply(writer, { type: 'gate.approve', gate: 'A', artifactId: 'brief', actor: user });
  await apply(writer, { type: 'gate.approve', gate: 'B', artifactId: 'plan', actor: user, dependencyIds: ['brief', 'design'] });
}

test('versioned deterministic fixtures include every domain and honestly unknown capabilities', () => {
  const a = createFixtureState();
  assert.deepEqual(a, createFixtureState());
  assert.equal(a.schemaVersion, SCHEMA_VERSION);
  for (const key of ['projects', 'intakes', 'plans', 'comparisons', 'runs', 'artifacts', 'reviews', 'notifications', 'capabilities']) assert.ok(a[key].length, key);
  assert.equal(a.capabilities[0].status, 'unknown');
  assert.equal(a.runs[0].mode, 'demo');
  assert.equal(a.runs[0].metrics.cost, null);
  assert.equal(validateState(a), true);
  assert.throws(() => migrateState({ schemaVersion: 999 }), /version/i);
  assert.throws(() => validateState({ ...a, events: [{ type: 'made-up' }] }), /event/i);
});

test('legacy imports are deterministic, keep IDs, never promote configured credentials to live', () => {
  const legacy = { workspace: { projects: [{ id: 'p', name: 'Existing' }] }, runs: [{ runId: 'r', mode: 'live', results: [{ text: 'kept', tokens: 0 }] }], config: { mode: 'live-unverified' } };
  const migrated = migrateState(legacy);
  assert.deepEqual(migrated, migrateState(legacy));
  assert.equal(migrated.projects[0].id, 'p');
  assert.equal(migrated.runs[0].id, 'r');
  assert.equal(migrated.runs[0].mode, 'unverified');
  assert.equal(migrated.capabilities[0].status, 'unverified');
  assert.equal(migrated.artifacts[0].content.text, 'kept');
  assert.equal(legacy.runs[0].mode, 'live');
  assert.equal(hashValue({ b: 1, a: 2 }), hashValue({ a: 2, b: 1 }));
});

test('domain writes require a visible approved proposal with matching hash', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await assert.rejects(writer.dispatch(artifact('brief', 'brief', {})), /command/i);
  await writer.dispatch({ type: 'proposal.create', id: 'p', operation: artifact('brief', 'brief', {}) });
  await assert.rejects(writer.dispatch({ type: 'proposal.apply', id: 'p' }), /approved/i);
  await assert.rejects(writer.dispatch({ type: 'proposal.resolve', id: 'p', approved: true, actor: { kind: 'oracle', id: 'oracle' } }), /user/i);
  await assert.rejects(writer.dispatch({ type: 'proposal.resolve', id: 'p', approved: true, actor: user, operationHash: 'wrong' }), /hash/i);
  assert.equal((await writer.read()).artifacts.some(item => item.id === 'brief'), false);
});

test('run transitions reject impossible jumps and accept pause, resume and failure', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await assert.rejects(apply(writer, { type: 'run.transition', runId: 'run-demo', status: 'complete' }), /transition/i);
  for (const status of ['running', 'paused', 'running', 'failed']) await apply(writer, { type: 'run.transition', runId: 'run-demo', status });
  assert.equal((await writer.read()).runs[0].status, 'failed');
});

test('editing brief invalidates Gate A and B while editing output invalidates only Gate C', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await approvedChain(writer);
  await apply(writer, artifact('output', 'output', { text: 'result' }));
  await apply(writer, { type: 'record.put', collection: 'reviews', record: { id: 'qa', projectId: 'project-demo', artifactId: 'output', artifactHash: (await writer.read()).artifacts.find(a => a.id === 'output').hash, kind: 'qa', status: 'complete', verdict: 'PASS', evidence: ['local/qa.md'], authorId: 'builder' } });
  await apply(writer, { type: 'record.put', collection: 'reviews', record: { id: 'critic', projectId: 'project-demo', artifactId: 'output', artifactHash: (await writer.read()).artifacts.find(a => a.id === 'output').hash, kind: 'independent', status: 'complete', verdict: 'PASS', evidence: ['local/review.md'], authorId: 'critic' } });
  await apply(writer, { type: 'gate.approve', gate: 'C', artifactId: 'output', dependencyIds: ['plan', 'design'], actor: user, evidence: { provenance: ['local/source.md'], limitations: ['Demo only'], userReview: 'Reviewed this version' } });
  await apply(writer, artifact('output', 'output', { text: 'revised' }));
  let approvals = (await writer.read()).approvals;
  assert.equal(approvals.find(a => a.gate === 'A').status, 'approved');
  assert.equal(approvals.find(a => a.gate === 'B').status, 'approved');
  assert.equal(approvals.find(a => a.gate === 'C').status, 'stale');
  await apply(writer, artifact('brief', 'brief', { text: 'changed audience' }));
  approvals = (await writer.read()).approvals;
  assert.equal(approvals.find(a => a.gate === 'A').status, 'stale');
  assert.equal(approvals.find(a => a.gate === 'B').status, 'stale');
});

test('Gate C cannot pass without real review evidence and independently authored QA', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await approvedChain(writer);
  await apply(writer, artifact('output', 'output', {}));
  await assert.rejects(apply(writer, { type: 'gate.approve', gate: 'C', artifactId: 'output', actor: user }), /evidence|review/i);
});

test('Gate C rejects output whose declared plan hash is obsolete despite passing reviews',async()=>{
 const writer=createStateWriter({initialState:createFixtureState(),clock:fixedClock});await approvedChain(writer);
 await apply(writer,artifact('old-output','output',{planHash:'obsolete',designHash:(await writer.read()).artifacts.find(a=>a.id==='design').hash}));
 const output=(await writer.read()).artifacts.find(a=>a.id==='old-output');
 for(const kind of ['qa','independent'])await apply(writer,{type:'record.put',collection:'reviews',record:{id:kind,projectId:'project-demo',artifactId:output.id,artifactHash:output.hash,kind,status:'complete',verdict:'PASS',evidence:['executed-check'],authorId:kind}});
 await assert.rejects(apply(writer,{type:'gate.approve',gate:'C',artifactId:output.id,actor:user,evidence:{provenance:['local'],limitations:['fixture'],userReview:'Reviewed'}}),/plan.*hash/i);
});

test('stale proposals fail without partial changes; snapshots cannot mutate writer state', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await writer.dispatch({ type: 'proposal.create', id: 'old', operation: artifact('brief', 'brief', {}) });
  const old = (await writer.read()).proposals[0];
  await writer.dispatch({ type: 'proposal.resolve', id: 'old', approved: true, actor: user, operationHash: old.operationHash });
  await apply(writer, artifact('design', 'design', {}));
  const before = await writer.read();
  await assert.rejects(writer.dispatch({ type: 'proposal.apply', id: 'old' }), /stale/i);
  assert.deepEqual(await writer.read(), before);
  before.events.length = 0;
  assert.ok((await writer.read()).events.length);
});

test('attempt replay deduplicates events and outputs, including restart and concurrent writers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'apollo-state-test-'));
  try {
    const filePath = join(dir, 'canonical.jsonl');
    const writer = createStateWriter({ filePath, initialState: createFixtureState(), clock: fixedClock });
    const operation = { type: 'attempt.record', attempt: { id: 'attempt-1', runId: 'run-demo', status: 'complete', outputs: [{ id: 'result-1', projectId: 'project-demo', kind: 'output', content: { text: 'demo' } }] } };
    await apply(writer, operation, 'attempt-proposal');
    const before = await writer.read();
    const raw = await readFile(filePath, 'utf8');
    const restarted = createStateWriter({ filePath, clock: fixedClock });
    await Promise.all([writer.dispatch({ type: 'proposal.apply', id: 'attempt-proposal' }), restarted.dispatch({ type: 'proposal.apply', id: 'attempt-proposal' })]);
    assert.deepEqual(await restarted.read(), before);
    assert.equal(await readFile(filePath, 'utf8'), raw);
    await apply(restarted, operation, 'same-attempt-new-proposal');
    const after = await restarted.read();
    assert.equal(after.attempts.length, 1);
    assert.equal(after.artifacts.filter(a => a.id === 'result-1').length, 1);
    assert.equal(after.events.filter(e => e.type === 'attempt.recorded').length, 1);
    assert.deepEqual(after.events.slice(0, before.events.length), before.events);
    await assert.rejects(apply(restarted, { ...operation, attempt: { ...operation.attempt, status: 'failed', outputs: [] } }), /attempt.*different/i);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('design changes invalidate B; plan configuration records cannot masquerade as approved', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await approvedChain(writer);
  await apply(writer, artifact('design', 'design', { color: 'changed' }));
  const approvals = (await writer.read()).approvals;
  assert.equal(approvals.find(a => a.gate === 'A').status, 'approved');
  assert.equal(approvals.find(a => a.gate === 'B').status, 'stale');
  await assert.rejects(apply(writer, { type: 'record.put', collection: 'plans', record: { id: 'plan-demo', status: 'approved' } }), /draft/i);
});

test('new runs require draft state and live mode requires a probe; quiet notifications reject unchanged monitoring', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await assert.rejects(apply(writer, { type: 'run.create', run: { id: 'new', status: 'draft', mode: 'live' } }), /verified/i);
  await apply(writer, { type: 'run.create', run: { id: 'new', status: 'draft', mode: 'demo' } });
  await assert.rejects(apply(writer, { type: 'record.put', collection: 'capabilities', record: { id: 'runtime', status: 'live', configured: true } }), /probe/i);
  await assert.rejects(apply(writer, { type: 'record.put', collection: 'notifications', record: { id: 'noise', reason: 'unchanged-monitoring' } }), /silent/i);
});

test('truncated journals fail closed without resetting data or appending more events', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'apollo-state-test-'));
  try {
    const filePath = join(dir, 'canonical.jsonl');
    const writer = createStateWriter({ filePath, initialState: createFixtureState(), clock: fixedClock });
    await apply(writer, artifact('brief', 'brief', {}));
    await appendFile(filePath, '{"partial":');
    const damaged = await readFile(filePath, 'utf8');
    await assert.rejects(writer.read(), /truncated/i);
    await assert.rejects(writer.dispatch({ type: 'proposal.create', id: 'after-corruption', operation: artifact('design', 'design', {}) }), /truncated/i);
    assert.equal(await readFile(filePath, 'utf8'), damaged);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('cancelling a proposal is recorded and cannot apply its operation', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await writer.dispatch({ type: 'proposal.create', id: 'cancel-me', operation: artifact('brief', 'brief', {}) });
  const proposal = (await writer.read()).proposals[0];
  await writer.dispatch({ type: 'proposal.resolve', id: proposal.id, approved: false, actor: user, operationHash: proposal.operationHash });
  await assert.rejects(writer.dispatch({ type: 'proposal.apply', id: proposal.id }), /approved/i);
  const state = await writer.read();
  assert.equal(state.proposals[0].status, 'cancelled');
  assert.equal(state.events.at(-1).type, 'proposal.cancelled');
  assert.equal(state.artifacts.some(item => item.id === 'brief'), false);
});

test('sparse arrays are rejected recursively before hashing or mutation', async () => {
  for (const input of [Array(1), { nested: [Array(2)] }, [1, , 3]]) assert.throws(() => hashValue(input), /sparse/i);
  assert.notEqual(hashValue([]), hashValue([null]));
  const dense = { nested: [[null, 'value'], [], 0] };
  assert.equal(hashValue(dense), hashValue(JSON.parse(JSON.stringify(dense))));
  const initialState = createFixtureState();
  const writer = createStateWriter({ initialState, clock: fixedClock });
  await assert.rejects(apply(writer, artifact('sparse', 'output', { nested: Array(1) })), /sparse/i);
  assert.deepEqual(await writer.read(), initialState);
  initialState.intakes[0].questions = Array(1);
  assert.throws(() => validateState(initialState), /sparse/i);
});

test('review records reject invalid status, identity, kind, evidence, verdict and author', async () => {
  const initialState = createFixtureState();
  const writer = createStateWriter({ initialState, clock: fixedClock });
  const valid = { ...initialState.reviews[0], id: 'review-new', status: 'complete', verdict: 'PASS', evidence: ['local/review.md'], authorId: 'critic' };
  const invalid = [
    { id: 'invalid', status: 'nonsense' },
    { ...valid, status: 'nonsense' }, { ...valid, artifactId: 'missing' },
    { ...valid, artifactHash: 'unbound' }, { ...valid, projectId: null },
    { ...valid, kind: 'invented' }, { ...valid, evidence: 'local/review.md' },
    { ...valid, evidence: [''] }, { ...valid, evidence: [] },
    { ...valid, verdict: 'maybe' }, { ...valid, verdict: 'unknown' }, { ...valid, authorId: null },
  ];
  const withoutVerdict = { ...valid }; delete withoutVerdict.verdict; invalid.push(withoutVerdict);
  for (const record of invalid) {
    await assert.rejects(apply(writer, { type: 'record.put', collection: 'reviews', record }), /review/i);
    assert.deepEqual(await writer.read(), initialState);
  }
  await apply(writer, { type: 'record.put', collection: 'reviews', record: valid });
});

for (const failingKind of ['qa', 'independent']) test(`Gate C rejects a completed ${failingKind} review with FAIL verdict`, async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await approvedChain(writer);
  await apply(writer, artifact('output', 'output', {}));
  const artifactHash = (await writer.read()).artifacts.find(item => item.id === 'output').hash;
  for (const kind of ['qa', 'independent']) await apply(writer, {
    type: 'record.put', collection: 'reviews', record: {
      id: kind, projectId: 'project-demo', artifactId: 'output', artifactHash, kind,
      status: 'complete', verdict: kind === failingKind ? 'FAIL' : 'PASS', evidence: [`local/${kind}.md`], authorId: kind,
    },
  });
  const before = await writer.read();
  await assert.rejects(apply(writer, { type: 'gate.approve', gate: 'C', artifactId: 'output', actor: user,
    evidence: { provenance: ['local/source.md'], limitations: [], userReview: 'Reviewed' },
  }), /passing|fail/i);
  assert.deepEqual(await writer.read(), before);
});

test('adding a new failing review invalidates existing Gate C approval and rejects imported approved state', async () => {
  const writer = createStateWriter({ initialState: createFixtureState(), clock: fixedClock });
  await approvedChain(writer);
  await apply(writer, artifact('output', 'output', { text: 'reviewed output' }));
  const artifactHash = (await writer.read()).artifacts.find(item => item.id === 'output').hash;
  for (const kind of ['qa', 'independent']) await apply(writer, {
    type: 'record.put', collection: 'reviews', record: {
      id: kind, projectId: 'project-demo', artifactId: 'output', artifactHash, kind,
      status: 'complete', verdict: 'PASS', evidence: [`local/${kind}.md`], authorId: kind,
    },
  });
  await apply(writer, { type: 'gate.approve', gate: 'C', artifactId: 'output', actor: user,
    evidence: { provenance: ['local/source.md'], limitations: [], userReview: 'Reviewed this version' },
  });
  const approved = await writer.read();
  assert.equal(approved.approvals.find(item => item.gate === 'C').status, 'approved');
  const failingReview = {
    id: 'new-failing-review', projectId: 'project-demo', artifactId: 'output', artifactHash,
    kind: 'independent', status: 'complete', verdict: 'FAIL', evidence: ['local/new-finding.md'], authorId: 'second-critic',
  };
  await apply(writer, { type: 'record.put', collection: 'reviews', record: failingReview });
  const after = await writer.read();
  assert.equal(after.approvals.find(item => item.gate === 'C').status, 'stale');
  assert.equal(after.approvals.find(item => item.gate === 'A').status, 'approved');
  assert.equal(after.approvals.find(item => item.gate === 'B').status, 'approved');
  assert.equal(after.events.filter(event => event.type === 'approval.invalidated' && event.data.gate === 'C').length, 1);
  assert.equal(validateState(after), true);
  assert.deepEqual(migrateState(after), after);
  const invalidImport = structuredClone(approved);
  invalidImport.reviews.push(failingReview);
  assert.throws(() => validateState(invalidImport), /approved|stale/i);
  assert.throws(() => migrateState(invalidImport), /approved|stale/i);
});
