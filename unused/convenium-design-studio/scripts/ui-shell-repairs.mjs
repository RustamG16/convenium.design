import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { launch } from './lib/cdp.mjs';
import { startServer, navigate, settle, evaluate, captureConsole } from './lib/harness.mjs';

const server = await startServer({ scratchData: true });
const browser = await launch();
const checks = [], failures = [];
function check(name, actual, expected) {
  try { assert.deepEqual(actual, expected); checks.push(name); }
  catch { failures.push({ name, actual, expected }); }
}
try {
  const page = await browser.newPage(); const errors = []; captureConsole(page, errors);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(page, server.base + '/?repair-1#/home'); await settle(page, 3500);
  await evaluate(page, 'document.querySelector(".shell-skip").focus()');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' }); await settle(page, 120);
  check('skip retains route', await evaluate(page, 'location.hash'), '#/home');
  check('skip focuses main landmark', await evaluate(page, 'document.activeElement.id'), 'main-content');
  check('skip retains Home view', await evaluate(page, 'document.querySelector(".view.is-active").id'), 'home');

  const before = await (await fetch(server.base + '/api/workspace')).json();
  await evaluate(page, 'document.querySelector("[data-global-route=projects]").click()'); await settle(page, 120);
  await evaluate(page, 'document.querySelector("#shell-create-project").click()'); await settle(page, 500);
  const after = await (await fetch(server.base + '/api/workspace')).json();
  const created = after.projects.find(project => !before.projects.some(old => old.id === project.id));
  check('create adds exactly one project', after.projects.length, before.projects.length + 1);
  assert.ok(created, 'project creation must succeed before checking route consistency');
  check('created project and chat own URL', await evaluate(page, 'location.hash'), '#/projects/' + encodeURIComponent(created.id) + '/work/' + encodeURIComponent(created.chats[0].id));
  check('created project owns Work heading', await evaluate(page, 'document.querySelector("#work-title").textContent'), created.name);
  check('created project owns route trail', await evaluate(page, 'document.querySelector("#route-trail").textContent.includes(' + JSON.stringify(created.name) + ')'), true);
  check('created project and chat own Oracle context', await evaluate(page, 'document.querySelector("#shell-oracle-context").textContent'), created.name + ' / Work / ' + created.chats[0].name);
  check('created project focuses prompt', await evaluate(page, 'document.activeElement.id'), 'work-prompt');
  await page.send('Page.reload'); await settle(page, 2500);
  check('new project reload retains Work heading', await evaluate(page, 'document.querySelector("#work-title").textContent'), created.name);
  check('repair runtime console is clean', errors, []);
  console.log(JSON.stringify({ passed: checks.length, failures }, null, 2));
  assert.equal(failures.length, 0, 'shell repair regressions');
} finally {
  await browser.close(); server.proc.kill();
  const scratch = server.dataDir && resolve(server.dataDir);
  if (scratch?.startsWith(resolve(tmpdir()) + sep) && basename(scratch).startsWith('apollo-harness-')) rmSync(scratch, { recursive: true, force: true });
}
