import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { launch } from './lib/cdp.mjs';
import { startServer, navigate, settle, evaluate, captureConsole } from './lib/harness.mjs';

const server = await startServer({ scratchData: true });
const browser = await launch();
const checks = [], failures = [];
function check(name, actual, expected) { try { assert.deepEqual(actual, expected); checks.push(name); } catch { failures.push({ name, actual, expected }); } }
try {
  const page = await browser.newPage(); const errors = []; captureConsole(page, errors);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(page, server.base + '/?oracle-1#/home'); await settle(page, 2500);
  await evaluate(page, 'document.querySelector("#toggle-oracle").click()'); await settle(page, 100);
  check('Oracle has text input', await evaluate(page, 'document.querySelector("#oracle-context-input")?.tagName'), 'TEXTAREA');
  check('text mode is selected', await evaluate(page, 'document.querySelector("#oracle-text-mode")?.getAttribute("aria-pressed")'), 'true');
  check('unavailable voice is honest', await evaluate(page, '({disabled:document.querySelector("#oracle-voice-mode")?.disabled,label:document.querySelector("#oracle-voice-mode")?.textContent.trim()})'), { disabled: true, label: 'Voice unavailable' });
  check('Home context token exists', await evaluate(page, '[...document.querySelectorAll("#oracle-context-tokens [data-token-kind=page]")].map(n=>n.textContent.trim())'), ['Home']);
  await evaluate(page, 'document.querySelector("[data-global-route=plan]").click()'); await settle(page, 100);
  check('page token follows route', await evaluate(page, '[...document.querySelectorAll("#oracle-context-tokens [data-token-kind=page]")].map(n=>n.textContent.trim())'), ['Plan']);
  check('Oracle remains open across route changes', await evaluate(page, 'document.querySelector("#oracle-dock").getAttribute("aria-hidden")'), 'false');
  check('runtime console is clean', errors, []);
  console.log(JSON.stringify({ passed: checks.length, failures }, null, 2));
  assert.equal(failures.length, 0, 'Oracle UI regressions');
} finally {
  await browser.close(); server.proc.kill();
  const scratch = server.dataDir && resolve(server.dataDir);
  if (scratch?.startsWith(resolve(tmpdir()) + sep) && basename(scratch).startsWith('apollo-harness-')) rmSync(scratch, { recursive: true, force: true });
}
