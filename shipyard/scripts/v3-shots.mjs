// v3 QA screens (plan 13 § Order and checks): each arcade screen at 1440×900, saved next to its reference
// in plan/qa-screens/v3-*.png. Needs the dev server on :5173. Run: node scripts/v3-shots.mjs
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const BASE = process.env.PW_BASE_URL ?? 'http://localhost:5173';
const OUT = resolve('plan/qa-screens');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = (name) => page.screenshot({ path: resolve(OUT, `v3-${name}-1440.png`) });

await page.goto(`${BASE}/#/`);
await page.getByTestId('fleet-row').waitFor();
await page.waitForTimeout(800);
await shot('hangar');

await page.goto(`${BASE}/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-abridged,ss-mobile-retrofit`);
await page.getByTestId('rg-start').click();
await page.getByTestId('rg-arena').waitFor();
await page.waitForTimeout(1500);
await shot('regatta-race');
const skip = page.getByTestId('rg-skip');
if (await skip.count()) await skip.click();
await page.getByTestId('rg-results').waitFor();
await page.waitForTimeout(600);
await shot('regatta-finish');
await page.getByTestId('rg-results').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot('regatta-results');

await page.goto(`${BASE}/#/ship/ss-full-run/bridge?member=analyst`);
await page.getByTestId('crew-stage').waitFor();
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await shot('bridge');

await page.goto(`${BASE}/#/forge?agent=fleet-measurer`);
await page.getByTestId('forge-agent-preview').waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await shot('forge');

await browser.close();
console.log('saved v3 screens to', OUT);
