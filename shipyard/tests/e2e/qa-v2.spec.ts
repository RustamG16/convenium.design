import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T25 author QA for the v2 screens. Skipped unless QA_V2 is set. Like the v1 harness it records and
 * never throws: per screen and width it saves a PNG to plan/qa-screens/v2/, runs axe (serious and
 * critical kept), measures horizontal overflow and keeps console warnings and errors, then writes
 * plan/qa-screens/v2/results.json, which plan/07-qa.md § v2 cites. Runs against the dev server, where
 * the Forge and the live-run dialog exist; with no CLI the dialog shows its "not found" state.
 */
const DIR = resolve('plan/qa-screens/v2');
const SIZES: [number, number][] = [[1440, 900], [1024, 768], [390, 844], [360, 740]];

interface Shot {
  name: string;
  go: (page: Page) => Promise<void>;
}

const race = (ships: string) => async (page: Page) => {
  await page.goto(`/#/regatta?brief=landing-refresh&ships=${ships}`);
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await page.getByTestId('rg-results').waitFor();
  // let the arena's hulls load and settle on the finish (a blank arena at 1024 in the first pass, review m3)
  await page.locator('[data-testid="rg-arena"] canvas').waitFor().catch(() => {});
  await page.waitForTimeout(3000);
};

const SHOTS: Shot[] = [
  // first: after the WebGL screens its capture failed with a protocol error twice (T25, T26)
  { name: 'forge', go: async (p) => { await p.goto('/#/forge'); await p.waitForLoadState('networkidle'); } },
  { name: 'regatta-setup', go: async (p) => { await p.goto('/#/regatta?ships=ss-full-run'); await p.getByTestId('rg-start').waitFor(); } },
  { name: 'regatta-results', go: race('ss-full-run,ss-abridged,ss-mobile-retrofit') },
  {
    name: 'regatta-board',
    go: async (p) => {
      await race('ss-full-run,ss-abridged')(p);
      await p.getByTestId('rg-tab-board').click();
      await p.getByTestId('rg-board-landing-refresh').check();
    },
  },
  {
    name: 'regatta-live-dialog',
    go: async (p) => {
      await race('ss-full-run,ss-abridged')(p);
      await p.locator('[data-testid="rg-live"][data-ship="ss-full-run"]').click();
      await p.getByTestId('rg-live-estimate').or(p.getByTestId('rg-live-problems')).waitFor();
    },
  },
  // the 3D Bridge, not ?2d (review m3)
  { name: 'bridge-tuning', go: async (p) => { await p.goto('/#/ship/ss-full-run/bridge'); await p.getByTestId('tuning-card').waitFor(); await p.waitForTimeout(5000); } },
  { name: 'hangar', go: async (p) => { await p.goto('/#/'); await p.getByTestId('ship-card').first().waitFor(); await p.waitForTimeout(2500); } },
  {
    // two ships in the fleet ring (n1 was only ever seen with one)
    name: 'hangar-fleet',
    go: async (p) => {
      await p.goto('/#/ship/ss-full-run/bridge?member=engineer&2d');
      await p.getByTestId('tune').click();
      await p.getByTestId('clone-confirm').click();
      await p.waitForURL(/ss-full-run-copy/);
      await p.goto('/#/');
      await p.getByTestId('ship-card').first().waitFor();
      // the hero at the top of the page, not the first-ship toast over it (re-review v2, n-f)
      const dismiss = p.getByTestId('toast-dismiss');
      if (await dismiss.count()) await dismiss.click();
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(3000);
    },
  },
];

test.skip(!process.env.QA_V2, 'author QA only (QA_V2=1)');
test.setTimeout(10 * 60_000);

test('v2 screens at four widths', async ({ browser }) => {
  mkdirSync(DIR, { recursive: true });
  const results: Record<string, Record<string, unknown>> = {};
  for (const [w, h] of SIZES) {
    for (const s of SHOTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      const log: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') log.push(`${m.type()}: ${m.text().slice(0, 200)}`);
      });
      page.on('pageerror', (e) => log.push(`pageerror: ${e.message.slice(0, 200)}`));
      const key = `${s.name}@${w}`;
      try {
        await s.go(page);
        await page.screenshot({ path: `${DIR}/${s.name}-${w}.png` }).catch(async () => {
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `${DIR}/${s.name}-${w}.png` });
        });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        const a = await new AxeBuilder({ page: page as never }).analyze();
        const axe = a.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
        results[key] = { overflow, axe, console: log };
      } catch (e) {
        results[key] = { error: String(e).slice(0, 300), console: log };
      }
      await ctx.close();
    }
  }
  writeFileSync(`${DIR}/results.json`, JSON.stringify(results, null, 1));
});
