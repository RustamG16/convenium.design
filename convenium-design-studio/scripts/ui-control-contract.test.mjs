import test from 'node:test';
import assert from 'node:assert/strict';
import { launch } from './lib/cdp.mjs';
import { startServer, navigate, settle, evaluate } from './lib/harness.mjs';
test('primary screens expose one primary action and a named job', async () => {
  const server = await startServer({ scratchData: true }); const browser = await launch();
  try {
    const page = await browser.newPage();
    await navigate(page, server.base + '/#/home'); await settle(page, 1800);
    for (const route of ['home','plan','agents','system','settings']) {
      await evaluate(page, `location.hash = '#/${route}'`); await settle(page, 200);
      const result = await evaluate(page, `({ count: [...document.querySelectorAll('.view.is-active [data-primary-action]')].filter(e=>e.getBoundingClientRect().width>0).length, title: document.querySelector('.view.is-active h1')?.textContent })`);
      assert.equal(result.count, 1, route); assert.ok(result.title);
    }
  } finally { await browser.close(); server.proc.kill(); }
});
