# Task 2 — Canonical prototype state contract

Status: implemented. No commit was created. Existing server routes, domain services, public UI, package files and user data were not edited by this task.

## Files

- `state.mjs`: schema version 1; JSON validation and stable SHA-256 hashes; deterministic fixture factory; read-only legacy snapshot migration; one validated command writer; optional append-only transaction journal.
- `scripts/state.test.mjs`: 12 focused Node built-in tests. Temporary journal files live in OS-generated `apollo-state-test-*` directories and are removed by the tests.
- This report, as explicitly requested by the task brief.

## Public module API

Exports: `SCHEMA_VERSION`, `ENVIRONMENT_STATUSES`, `RUN_TRANSITIONS`, `hashValue(value)`, `validateState(state)`, `createFixtureState()`, `migrateState(snapshot)`, and `createStateWriter({ filePath?, initialState?, clock? })`.

The writer exposes `read()` and `dispatch(command)`, both asynchronous. Returned snapshots are detached copies. With no path, state stays in memory. A file path must designate a dedicated canonical JSONL journal, never an existing legacy file. No default storage file is created and no server integration was needed for this contract slice.

Command sequence:

1. `proposal.create` takes a caller-supplied stable `id` and an `operation`. It validates the proposed effect on a discarded copy and stores the visible operation, its hash and the current domain hash.
2. `proposal.resolve` takes `id`, an explicit boolean `approved`, `actor: { kind: 'user', id }`, and the exact `operationHash` being reviewed. Oracle actors cannot approve. Cancellation is recorded.
3. `proposal.apply` takes `id`. It requires prior user approval, rejects a stale domain hash and applies the operation through the same writer. Reapplying an already-applied proposal returns the existing state without adding journal entries or events.

Supported operations: `record.put`, `artifact.save`, `run.create`, `run.transition`, `attempt.record`, and `gate.approve`. Writable record collections are projects, intakes, plans, comparisons, reviews, notifications and capabilities. Plans/comparisons remain draft records; approved production content is represented by versioned plan/design artifacts and their gate bindings.

## State and approval decisions

- Fixtures cover project, intake, plan, Setup A/B comparison, run, artifact, review, notification and capability records. Fixture timestamps/content are stable. Demo mode and unknown measurements/verification remain explicit; no estimated cost or latency is invented.
- Legacy migration accepts supplied workspace/project and run/config snapshots. It preserves project/run IDs and result text as imported output artifacts, without touching source data. Legacy live claims become unverified. Unbound legacy approvals never become hash-bound approvals. Legacy chats, attachments and proposals remain authoritative in their existing services; migration warnings state that boundary.
- Artifacts have a stable material hash over project, kind and content, plus append-only version snapshots. Artifact identity cannot change between versions.
- Gate A binds a brief. Gate B requires a current A approval and a committed design artifact, then binds plan, brief and design. Gate C requires a current B approval, current output, provenance, limitations, explicit user-review evidence, QA and an independently authored review for that precise output hash. The gate reviewer must match the user who approved the proposal.
- Downstream approvals inherit upstream artifact hashes. Brief edits invalidate A/B/C as applicable; plan/design edits invalidate B/C; output edits invalidate C. Changing a bound review also invalidates C. Invalidations append typed events and preserve historical approvals.
- New runs start as draft. Transitions permit running, pause/resume, blockage, cancellation, failure and completion according to the exported table. Terminal states do not silently restart. Live creation requires a verified capability probe record.
- Attempt IDs bind the entire terminal attempt payload. Identical replay cannot duplicate attempt events or output artifacts; conflicting reuse fails. Failed/cancelled attempts cannot publish successful outputs. A separately created proposal remains its own recorded user action even when its attempt is already recorded.
- Notification reasons are restricted to required input, approval, completion, failure, meaningful change and user-created reminder. Unchanged monitoring cannot become a notification record.

## Persistence and validation

Every committed dispatch adds one transaction containing a validated snapshot and previous/current hashes. Events have typed names, stable sequence IDs and UTC timestamps. Reads verify hashes, revision continuity and the unchanged historical event prefix. Truncated/corrupt journals fail closed; they are neither reset nor silently repaired. The optional journal serializes writes from multiple writer instances targeting the same path within one Node process, including Windows path casing.

The supplied actor/evidence fields are assertions at this module boundary. A future route adapter must derive the actor from the actual user approval interaction and supply real probe/review evidence; this module cannot independently authenticate people or inspect arbitrary evidence paths.

## Verification

Initial red run: `node --test scripts/state.test.mjs` failed with `ERR_MODULE_NOT_FOUND` before `state.mjs` existed.

Final targeted run: `node --test scripts/state.test.mjs` — 12 passed, 0 failed. Coverage includes deterministic schema/fixtures, legacy import honesty, explicit approval hashes, invalid run transitions, A/B/C invalidation, Gate C evidence requirements, stale proposals, detached snapshots, retry deduplication across restart/concurrent writers, draft-only configurations, live probe requirements, quiet notifications, truncated journal preservation and proposal cancellation.

`node --check state.mjs` passed. Existing `npm.cmd run check:syntax` passed. `git diff --check` returned success with pre-existing/configured LF-to-CRLF warnings. The full browser `npm.cmd run check` suite is an integration-level check for the parent task; this isolated slice changes no browser or route code.

## Concerns and next integration boundary

- The contract is additive and intentionally not wired into existing APIs. Later UI/server work must call this writer for new canonical behavior while preserving existing service authority until replacement parity is demonstrated.
- Persistence is bounded prototype storage: it appends a full snapshot per mutation and replays the journal on access. Large histories need a separately reviewed compaction/index strategy.
- Multiple processes must not write the same journal without an external lock. Same-process concurrent instances are covered and tested.
- A truncated journal requires explicit recovery; no automatic destructive truncation is implemented.
- New tests are directly runnable and are not added to the existing npm scripts, avoiding ownership overlap with package/integration work. The parent should include them in its aggregate verification.

## Repair round 1 — independent review findings

All three reproduced defects were addressed within `state.mjs` and `scripts/state.test.mjs`. No UI, server, legacy service or user-data changes were made.

1. **Sparse JSON arrays:** canonical JSON validation now recursively rejects holes and extra named array properties. They cannot enter hashing, state validation or mutation, preventing hashes that change after JSON serialization. Dense arrays including explicit nulls retain stable round-trip hashes. Regression tests cover top-level holes, nested holes, array interior holes, state fixtures and rejected artifact proposals without partial state changes.
2. **Malformed review records:** `validateState` now validates every review's status, kind, existing artifact, matching project, historical artifact-version hash, evidence reference array, explicit author/null and verdict enum. Verdicts are `PASS`, `FAIL` or `unknown`; completed reviews require an explicit PASS/FAIL verdict, named author and nonempty evidence. The deterministic fixture carries `verdict: 'unknown'`. This applies to both writer preview/commit and journal/initial-state loading. Tests cover the reported `{id:'invalid',status:'nonsense'}` record and twelve additional invalid/missing-field cases, all rejected without mutation.
3. **Gate C with failed reviews:** completed status no longer implies passing QA. Both QA and independent review must explicitly say `PASS`, and any completed `FAIL` review of the current artifact blocks Gate C even if another passing review exists. Separate regression tests exercise failing QA and failing independent review. Existing positive Gate C coverage now supplies explicit PASS verdicts.

Verification: before the repair, the expanded suite reproduced four failing test cases (sparse arrays, review validation, failing QA, failing independent review). After the repair, `node --test scripts/state.test.mjs` reports **16 passed, 0 failed**. `node --check state.mjs`, `node --check scripts/state.test.mjs` and `npm.cmd run check:syntax` all pass.

Integration note: canonical review producers must now supply `verdict` explicitly; no missing verdict is inferred as a pass. A previous experimental canonical journal containing reviews without verdicts fails validation until explicitly migrated; this isolated module has not been connected to existing APIs or their data. Existing persistence/authentication/evidence limitations above remain unchanged.

## Repair round 2 — newly added failing evidence

The reviewer reproduced a missing invalidation path: an approved Gate C bound existing passing reviews, but a newly created failing review did not change those bound records. Gate C therefore remained approved.

The shared approval-currentness check now also evaluates all completed failing reviews for the bound output artifact/version. A newly added FAIL review makes Gate C stale and emits the existing `approval.invalidated` event. The same predicate is used by initial approval, state validation, journal reads and canonical migration; imported snapshots cannot retain approved C alongside disqualifying evidence. Prior A/B approvals remain current because this evidence applies only to the reviewed output.

The regression reproduces the exact sequence: passing QA and independent review → approve C → add a distinct completed FAIL review → assert C stale, A/B approved and one invalidation event. It also verifies valid stale-state migration and rejection of a forged/imported still-approved snapshot containing the added failure.

Before repair: 16 passed, 1 failed, with C incorrectly remaining `approved`. After repair: `node --test scripts/state.test.mjs` reports **17 passed, 0 failed**. `node --check state.mjs`, `node --check scripts/state.test.mjs` and `npm.cmd run check:syntax` pass. Only the Task 2 module, test and report changed. No new concerns beyond the documented prototype persistence and evidence-authentication boundaries.
