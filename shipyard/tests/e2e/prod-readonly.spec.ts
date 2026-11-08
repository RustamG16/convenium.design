/**
 * v2: the deployed build never writes or runs anything. Runs only against a production preview:
 *   npm run build && npx vite preview   (port 4173), then
 *   PW_BASE_URL=http://localhost:4173 npx playwright test tests/e2e/prod-readonly.spec.ts
 * It makes no /__shipyard request on any screen, lists no Forge, and the Forge route explains itself.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.skip(!process.env.PW_BASE_URL, 'production preview only (set PW_BASE_URL)');

test('the production build makes no dev-server calls and the Forge is read-only', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/__shipyard')) calls.push(r.url());
  });
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card').first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Forge' })).toHaveCount(0);
  await expect(page.getByTestId('library-banner')).toHaveCount(0);
  await page.goto('/#/armory');
  await expect(page.getByTestId('art-card').first()).toBeVisible();
  await page.goto('/#/forge');
  await expect(page.getByTestId('forge-readonly')).toBeVisible();
  await expect(page.getByTestId('forge-preview-btn')).toHaveCount(0);
  expect(calls).toEqual([]);
});

test('the production bundle carries no Forge or live-trial endpoint and no Run live button', async ({ page }) => {
  // the built files on disk (npm run build): the dev-only clients are dead code there and must be gone
  const js = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
  expect(js.length).toBeGreaterThan(0);
  const hits = js.filter((f) => /__shipyard\/(trial|forge)/.test(readFileSync(`dist/assets/${f}`, 'utf8')));
  expect(hits).toEqual([]);
  // and on screen: a finished regatta offers no live run
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-abridged');
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-results')).toBeVisible();
  await expect(page.getByTestId('rg-live')).toHaveCount(0);
});
