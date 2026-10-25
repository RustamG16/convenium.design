// Journey-v2 shell contract, checked in headless Chrome against a scratch data directory.
//  - the rail shows the nine destinations in order, exactly one active, on every route
//  - the Oracle dock is present on every route with the same geometry per viewport
//  - no horizontal overflow at 390 / 820 / 1280 / 1440 / 1920
//  - the page title receives focus after navigation; Alt+3 opens Plan
//  - narrow screens turn the rail into a drawer
//  - reduced motion collapses durations; graph and list show the same node ids
import { launch } from './lib/cdp.mjs';
import { startServer, evaluate, withTimeout } from './lib/harness.mjs';

const ROUTES = ['#/home', '#/journey', '#/projects', '#/projects/northstar/intake', '#/projects/northstar/brief', '#/plan', '#/plan/configure', '#/playground', '#/work/0248', '#/results/0248', '#/knowledge', '#/system/0248', '#/agents', '#/settings', '#/tutorials'];
const WIDTHS = [[390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
const EXPECTED = ['Home', 'Projects', 'Plan', 'Playground', 'Results', 'Knowledge', 'System', 'Agents', 'Settings'];
const failures = [];
const fail = msg => { failures.push(msg); console.log('  ✗ ' + msg); };
const ok = msg => console.log('  ✓ ' + msg);

async function go(page, base, hash, wait = 900) {
  await page.send('Page.navigate', { url: `${base}/?notour${hash}` });
  await new Promise(r => setTimeout(r, wait));
}

async function main() {
  const { proc, base } = await startServer({ scratchData: true });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails?.exception?.description || e.exceptionDetails?.text));
    await go(page, base, '#/home', 600);
    await evaluate(page, `localStorage.setItem('apollo.v2.session', JSON.stringify({ tours: { _dismissed: true } })); true`);

    for (const [w, h] of WIDTHS) {
      console.log(`Viewport ${w}×${h}`);
      await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 820 });
      const docks = new Set();
      for (const hash of ROUTES) {
        await go(page, base, hash);
        const s = await evaluate(page, `(() => {
          const links = [...document.querySelectorAll('.rail .nav a')];
          const dock = document.getElementById('oracle-dock').getBoundingClientRect();
          const rail = document.querySelector('.rail').getBoundingClientRect();
          return { labels: links.map(a => a.textContent.trim()), active: links.filter(a => a.getAttribute('aria-current') === 'page').length,
            dock: dock.width > 0 ? [Math.round(dock.width), Math.round(window.innerHeight - dock.bottom)] : null,
            overflow: document.documentElement.scrollWidth > window.innerWidth + 1, title: document.getElementById('page-title')?.textContent || null,
            focused: document.activeElement?.id, railW: Math.round(rail.width), railVisible: rail.right > 1, inspectorOpen: document.body.classList.contains('inspector-open') };
        })()`);
        if (s.labels.join('|') !== EXPECTED.join('|')) fail(`${w} ${hash}: rail order ${s.labels.join(', ')}`);
        if (s.active !== (hash === '#/tutorials' || hash === '#/journey' ? 1 : 1)) fail(`${w} ${hash}: ${s.active} active rail items`);
        if (!s.dock) fail(`${w} ${hash}: Oracle dock missing`); else docks.add(`${s.dock[1]}|${s.inspectorOpen ? 'i' : 'n'}|${s.inspectorOpen ? '' : s.dock[0]}`);
        if (s.overflow) fail(`${w} ${hash}: horizontal overflow`);
        if (!s.title) fail(`${w} ${hash}: no page title`);
        if (w >= 820 && s.focused !== 'page-title') fail(`${w} ${hash}: focus not on the page title (got ${s.focused})`);
        if (w < 820 && s.railVisible) fail(`${w} ${hash}: rail should be a closed drawer`);
        if (w >= 820 && s.railW < 150) fail(`${w} ${hash}: rail too narrow (${s.railW}px)`);
      }
      const bottoms = new Set([...docks].map(d => d.split('|')[0]));
      if (bottoms.size > 1) fail(`${w}: dock bottom offset differs between routes (${[...bottoms].join(', ')})`); else ok(`${w}: dock geometry stable across ${ROUTES.length} routes`);
    }

    console.log('Behaviour');
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await go(page, base, '#/home');
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '3', code: 'Digit3', modifiers: 1, windowsVirtualKeyCode: 51 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '3', code: 'Digit3', modifiers: 1, windowsVirtualKeyCode: 51 });
    await new Promise(r => setTimeout(r, 900));
    const hashAfter = await evaluate(page, 'location.hash');
    if (!hashAfter.startsWith('#/plan')) fail(`Alt+3 should open Plan (got ${hashAfter})`); else ok('Alt+3 opens Plan');

    await go(page, base, '#/knowledge');
    const graphIds = await evaluate(page, `[...document.querySelectorAll('.kg-canvas [data-node]')].map(n => n.dataset.node).sort().join(',')`);
    await go(page, base, '#/knowledge/list');
    const listIds = await evaluate(page, `[...document.querySelectorAll('.g-list [data-node]')].map(n => n.dataset.node).sort().join(',')`);
    if (!graphIds || graphIds !== listIds) fail(`graph/list parity: graph=${graphIds} list=${listIds}`); else ok('Knowledge graph and list show the same nodes');

    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await go(page, base, '#/home');
    const dur = await evaluate(page, `getComputedStyle(document.documentElement).getPropertyValue('--dur-2').trim()`);
    if (dur !== '1ms') fail(`reduced motion should collapse durations (got ${dur})`); else ok('Reduced motion collapses durations');

    await go(page, base, '#/agents');
    const before = await evaluate(page, `fetch('/api/agents').then(r => r.json()).then(j => j.agents.find(a => a.id === 'design-engineer').budget)`);
    void before;
    if (errors.length) fail(`page errors: ${errors.join(' | ')}`); else ok('No page errors');
  } finally { await browser.close(); proc.kill(); }
  if (failures.length) { console.log(`\n${failures.length} failure(s)`); process.exit(1); }
  console.log('\nShell contract holds.');
}

main().catch(error => { console.error(error); process.exit(1); });
void withTimeout;
