import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './lib/harness.mjs';
test('receipt endpoint returns real hashes, missing evidence and rejects non-allowlisted files', async () => {
  const server = await startServer({ scratchData: true });
  try {
    const response = await fetch(server.base + '/api/systems/savra-v2-system/receipt');
    assert.equal(response.status, 200);
    const receipt = await response.json();
    for (const path of ['PRODUCT.md','DESIGN.md','.olympus/05-asset-manifest.md','.olympus/06-build-plan.md','.olympus/07-qa.md','.olympus/run.json']) {
      const item = receipt.artifacts.find(a => a.path === path);
      assert.equal(item.available, true, path); assert.match(item.hash, /^[a-f0-9]{64}$/);
    }
    assert.equal(receipt.workflow.roles.length, 6);
    const preview = await fetch(server.base + '/api/systems/olympus-web-system/outputs/savra-threshold-ritual/preview');
    assert.equal(preview.status,200,'Savra preview must resolve to the restored source');
    assert.equal(preview.headers.get('content-type'),'image/png');
    assert.equal((await fetch(server.base + '/api/systems/savra-v2-system/receipt?artifact=../credentials')).status, 400);
    assert.ok(receipt.artifacts.filter(a => !a.available).every(a => a.reason && a.hash === null));
  } finally { server.proc.kill(); }
});
