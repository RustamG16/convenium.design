### Task 2: Add the canonical prototype state contract

- [ ] Write failing tests for schema version, state transitions, approval hashes, unknown status, append-only events and idempotent attempts.
- [ ] Implement one state writer and migration from current demo shapes.
- [ ] Add fixtures for project, intake, plan, setup comparison, run, artifact, review, notification and capability status.
- [ ] Prove that changing an approved artifact invalidates the appropriate downstream approval.
- [ ] Prove that replaying an attempt does not duplicate events or outputs.

Binding constraints: preserve the existing Node/ESM app, existing APIs and user-owned dirty work; no external dependencies. New behavior belongs in `state.mjs` and an isolated test module where possible. Integrate server routes only as necessary for the new contract, but do not replace existing domain services. All mutations must use the one validated writer; fixtures must label deterministic/demo and unknown states honestly.
