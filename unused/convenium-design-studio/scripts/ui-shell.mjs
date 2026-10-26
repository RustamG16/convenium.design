import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, sep, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { launch } from './lib/cdp.mjs';
import { ROOT, startServer, navigate, settle, evaluate, captureConsole } from './lib/harness.mjs';

const checks = [];
function check(name, actual, expected) { assert.deepEqual(actual, expected, name); checks.push(name); }
const server = await startServer({ scratchData: true });
const browser = await launch();
try {
  const page = await browser.newPage(); const errors = []; captureConsole(page, errors);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(page, server.base + '/?shell-test#/home'); await settle(page, 3500);
  assert.deepEqual(errors, [], 'startup errors');
  check('runtime initializes', await evaluate(page, 'document.body.dataset.shellState'), 'ready');
  const routes = ['home', 'projects', 'plan', 'playground', 'results', 'knowledge', 'system', 'agents', 'settings'];
  check('exact global order', await evaluate(page, '[...document.querySelectorAll("[data-global-route]")].map(el => el.dataset.globalRoute)'), routes);
  for (const route of routes) {
    await evaluate(page, `document.querySelector('[data-global-route="${route}"]').click()`); await settle(page, 130);
    const found = await evaluate(page, `({active: [...document.querySelectorAll('[data-global-route][aria-current="page"]')].map(el => el.dataset.globalRoute), visible: [...document.querySelectorAll('.view')].filter(el => getComputedStyle(el).display !== 'none').length, focus: document.activeElement.tagName, oracle: document.querySelector('#toggle-oracle').getBoundingClientRect().width > 0, trail: document.querySelector('#route-trail').textContent })`);
    check(`${route}: one owner`, found.active, [route]); check(`${route}: one visible root`, found.visible, 1);
    check(`${route}: heading focus`, found.focus, 'H1'); check(`${route}: Oracle visible`, found.oracle, true);
    assert.match(found.trail, /Projects.*\//); checks.push(`${route}: persistent trail`);
  }
  const workspace = await (await fetch(server.base + '/api/workspace')).json(); const project = workspace.projects[0];
  for (const [legacy, root, owner] of [['work','work','projects'],['systems','systems','plan'],['architecture','architecture','system'],['runs','runs','results'],['oracle','oracle','projects']]) {
    await evaluate(page, `location.hash = '#/${legacy}'`); await settle(page, 150);
    check(`${legacy}: legacy surface`, await evaluate(page, 'document.querySelector(".view.is-active").id'), root);
    check(`${legacy}: owner`, await evaluate(page, 'document.querySelector("[data-global-route][aria-current]").dataset.globalRoute'), owner);
  }
  await navigate(page, server.base + '/?deep-link#/projects/' + encodeURIComponent(project.id) + '/plan/configure'); await settle(page, 900);
  check('deep-link survives reload', await evaluate(page, 'document.querySelector(".view.is-active").id'), 'systems');
  assert.match(await evaluate(page, 'document.querySelector("#route-trail").textContent'), /Plan \/ Configure/); checks.push('nested view trail');
  const created = await (await fetch(server.base + '/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  await navigate(page, server.base + '/?switch-project#/projects/' + encodeURIComponent(created.project.id) + '/work'); await settle(page, 2500);
  check('deep link selects requested project', await evaluate(page, 'document.querySelector("#work-title").textContent'), created.project.name);
  await evaluate(page, `[...document.querySelectorAll('.project-item')].find(button => button.querySelector('strong').textContent === ${JSON.stringify(project.name)}).click()`); await settle(page, 200);
  check('project selection includes the selected chat in its deep link', await evaluate(page, 'location.hash'), '#/projects/' + encodeURIComponent(project.id) + '/work/' + encodeURIComponent(project.chats[0].id));
  assert.ok((await evaluate(page, 'document.querySelector("#route-trail").textContent')).includes(project.name)); checks.push('legacy project selection updates trail');
  await evaluate(page, `location.hash = '#/projects/not-a-project/work'`); await settle(page, 120);
  check('missing project unavailable', await evaluate(page, 'document.body.dataset.shellState'), 'unavailable');
  check('missing project cannot mutate another project', await evaluate(page, 'document.querySelector("#work").inert'), true);
  check('missing project does not show another project', await evaluate(page, 'document.querySelector(".view.is-active").id'), 'route-unavailable');
  await evaluate(page, `document.querySelector('[data-global-route="home"]').click()`); await settle(page, 150);
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '9', code: 'Digit9', modifiers: 1 }); await settle(page, 120);
  check('Alt+9 opens Settings', await evaluate(page, 'location.hash'), '#/settings');
  await evaluate(page, 'document.querySelector("#toggle-oracle").click()');
  check('Oracle remains reachable', await evaluate(page, 'document.querySelector("#oracle-dock").getAttribute("aria-hidden")'), 'false');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  check('Oracle Escape restores trigger focus', await evaluate(page, 'document.activeElement.id'), 'toggle-oracle');
  await evaluate(page, `location.hash = '#/system'`); await settle(page, 120);
  const laneCount = await evaluate(page, 'document.querySelectorAll(".architecture-agent").length');
  for (let index = 0; index < laneCount; index++) {
    await evaluate(page, `location.hash = '#/system'`); await settle(page, 100);
    await evaluate(page, `document.querySelectorAll('.architecture-agent')[${index}].click()`); await settle(page, 100);
    check(`agent lane ${index}: canonical configuration destination`, await evaluate(page, 'location.hash'), '#/plan/configure');
  }
  await evaluate(page, `location.hash = '#/system'`); await settle(page, 100);
  await evaluate(page, 'document.querySelector("#inspector-open-slots").click()'); await settle(page, 100);
  check('inspector opens canonical configuration destination', await evaluate(page, 'location.hash'), '#/plan/configure');
  await evaluate(page, `location.hash = '#/work'`); await settle(page, 120);
  await evaluate(page, 'document.querySelector("#work-prompt").focus()');
  await evaluate(page, `document.querySelector('[data-global-route="settings"]').click()`); await settle(page, 120);
  await evaluate(page, 'history.back()'); await settle(page, 200);
  check('history restores workspace focus', await evaluate(page, 'document.activeElement.id'), 'work-prompt');
  for (const width of [390, 820, 1280, 1440, 1920]) {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 820 }); await settle(page, 100);
    await evaluate(page, `document.querySelector('[data-global-route="home"]').click()`); await settle(page, 80);
    const geometry = await evaluate(page, `({rail: getComputedStyle(document.querySelector('#global-rail')).display, railWidth: document.querySelector('#global-rail').getBoundingClientRect().width, overflow: document.documentElement.scrollWidth > innerWidth, menu: getComputedStyle(document.querySelector('#toggle-navigation')).display, stage: document.querySelector('#shell-stage').getBoundingClientRect().width > 0, next: document.querySelector('#shell-next-action').getBoundingClientRect().width > 0 })`);
    check(`${width}: no document overflow`, geometry.overflow, false);
    check(`${width}: stage visible`, geometry.stage, true); check(`${width}: next action visible`, geometry.next, true);
    if (width >= 820) check(`${width}: fixed 210px rail`, geometry.railWidth, 210);
    else {
      check('390: rail replaced by drawer', geometry.rail, 'none');
      await evaluate(page, 'document.querySelector("#toggle-navigation").click()');
      check('drawer opens and focuses current route', await evaluate(page, 'document.activeElement.dataset.globalRoute'), 'home');
      await evaluate(page, 'document.querySelector("[data-global-route=settings]").focus()');
      await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
      check('drawer traps forward Tab', await evaluate(page, 'document.activeElement.classList.contains("brand")'), true);
      await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
      check('drawer Escape restores focus', await evaluate(page, 'document.activeElement.id'), 'toggle-navigation');
    }
    mkdirSync(join(ROOT, '.olympus', 'shell-evidence'), { recursive: true });
    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(ROOT, '.olympus', 'shell-evidence', `home-${width}.png`), Buffer.from(shot.data, 'base64'));
  }
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  check('reduced motion <=1ms', await evaluate(page, 'parseFloat(getComputedStyle(document.querySelector("#toggle-oracle")).transitionDuration) <= .001'), true);
  await page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await settle(page, 150);
  check('offline shell state', await evaluate(page, 'document.body.dataset.shellState'), 'offline');
  check('offline Oracle disabled', await evaluate(page, 'document.querySelector("#toggle-oracle").disabled'), true);
  await page.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await settle(page, 150);
  check('online shell recovers', await evaluate(page, 'document.body.dataset.shellState'), 'ready');
  check('console/runtime errors', errors, []);

  const emptyPage = await browser.newPage();
  await emptyPage.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/workspace' }] });
  emptyPage.on('Fetch.requestPaused', event => emptyPage.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify({ projects: [], proposals: [] })).toString('base64') }));
  await navigate(emptyPage, server.base + '/?shell-empty#/projects'); await settle(emptyPage, 2500);
  check('empty workspace state', await evaluate(emptyPage, 'document.body.dataset.shellState'), 'empty');
  check('empty workspace has a creation action', await evaluate(emptyPage, 'document.querySelector("#shell-create-project").textContent'), 'Create your first project');

  const unavailablePage = await browser.newPage(); let pausedConfig;
  await unavailablePage.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/config' }] });
  unavailablePage.on('Fetch.requestPaused', event => { pausedConfig = event.requestId; });
  await navigate(unavailablePage, server.base + '/?shell-unavailable#/home'); await settle(unavailablePage, 200);
  check('loading is visible before config arrives', await evaluate(unavailablePage, 'document.body.dataset.shellState'), 'loading');
  check('loading view announces busy', await evaluate(unavailablePage, 'document.querySelector("#home").getAttribute("aria-busy")'), 'true');
  await unavailablePage.send('Fetch.fulfillRequest', { requestId: pausedConfig, responseCode: 503, body: Buffer.from('Unavailable').toString('base64') }); await settle(unavailablePage, 150);
  check('startup failure preserves unavailable shell', await evaluate(unavailablePage, 'document.body.dataset.shellState'), 'unavailable');
  check('startup failure offers retry', await evaluate(unavailablePage, 'document.querySelector("#shell-retry").hidden'), false);
  check('startup failure preserves nine routes', await evaluate(unavailablePage, 'document.querySelectorAll("[data-global-route]").length'), 9);
  console.log(JSON.stringify({ pass: true, checks: checks.length, evidence: '.olympus/shell-evidence', scratchData: server.dataDir }, null, 2));
} finally {
  await browser.close(); server.proc.kill();
  const scratch = server.dataDir && resolve(server.dataDir);
  if (scratch?.startsWith(resolve(tmpdir()) + sep) && basename(scratch).startsWith('apollo-harness-')) rmSync(scratch, { recursive: true, force: true });
}
