import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('workflow receipt supplies source-backed owners and a closed artifact dependency vocabulary', async () => {
  const m = JSON.parse(await readFile(new URL('../data/workflows/savra-v2.json', import.meta.url)));
  assert.deepEqual(m.roles.map(r => r.id), ['design-director', 'visual-analyst', 'asset-producer', 'design-engineer', 'independent-critic', 'analytics-specialist']);
  const artifacts = new Set(m.artifacts.map(a => a.id));
  for (const fact of [...m.roles, ...m.phases, ...m.gates, ...m.artifacts]) {
    assert.ok(['verified', 'reconstructed', 'unknown'].includes(fact.provenance.status));
    assert.ok(m.sources.some(source => source.id === fact.provenance.source));
  }
  for (const role of m.roles) { assert.ok(role.responsibility); assert.ok(role.skills.length); assert.equal(role.canDelegate, false); }
  for (const phase of m.phases) {
    assert.ok(m.roles.some(r => r.id === phase.owner));
    for (const id of [...phase.inputs, ...phase.outputs]) assert.ok(artifacts.has(id), id);
  }
  assert.equal(m.roles.find(r => r.id === 'independent-critic').readOnly, true);
  assert.equal(m.policy.maxRepairCycles, 2);
  assert.equal(m.policy.authorCriticSequential, true);
  for (const key of ['model', 'prompts', 'skillLoadOrder', 'hostSettings']) assert.equal(m.historical[key].provenance.status, 'unknown');
});
