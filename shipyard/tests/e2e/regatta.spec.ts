/**
 * v2 T22: the Regatta. Two ships sail one brief (dry), the course reveals buoy by buoy (or at once with
 * reduced motion), the results compare every criterion with the best marked in words, and the board
 * lists the ships unranked until a live, Verified run exists.
 */
import { expect, test } from '@playwright/test';

test.skip(!!process.env.PW_PHONE, 'desktop project only');

test('a two-ship dry regatta: course, results, labels, and an honest board', async ({ page }) => {
  await page.goto('/#/regatta');
  await expect(page.getByTestId('rg-start')).toBeDisabled();
  await page.locator('[data-testid="rg-brief"][data-brief="mobile-retrofit"] input').check();
  await page.locator('[data-testid="rg-ship"][data-ship="ss-mobile-retrofit"] input').check();
  await expect(page.getByTestId('rg-start')).toBeDisabled(); // one ship is not a regatta
  await page.locator('[data-testid="rg-ship"][data-ship="ss-full-run"] input').check();
  await page.getByTestId('rg-start').click();

  await expect(page.getByTestId('rg-lane')).toHaveCount(2);
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-results')).toBeVisible();
  await expect(page.getByTestId('rg-lane-total')).toHaveCount(2);
  await expect(page.getByTestId('rg-winner')).toContainText('SS Mobile Retrofit wins the dry run with 93.6 of 100');
  await expect(page.getByTestId('rg-results')).toContainText('Simulated');
  const table = page.getByTestId('rg-table');
  await expect(table.locator('tbody tr')).toHaveCount(7); // six criteria and the total
  await expect(table.locator('td[data-best]').first()).toContainText('Best');

  // the board: dry results never rank anyone
  await page.getByTestId('rg-tab-board').click();
  await page.getByTestId('rg-board-mobile-retrofit').check();
  await expect(page.getByTestId('rg-board-empty')).toBeVisible();
  await expect(page.getByTestId('rg-board-row')).toHaveCount(2);
  for (const row of await page.getByTestId('rg-board-row').all()) {
    await expect(row).toHaveAttribute('data-place', 'none');
    await expect(row).toContainText('Simulated');
  }

  // the same race again replaces the dry records instead of piling them up
  await page.getByTestId('rg-tab-race').click();
  await page.getByTestId('rg-new').click();
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await page.getByTestId('rg-tab-board').click();
  await page.locator('.rg-records summary').click();
  await expect(page.getByTestId('rg-record')).toHaveCount(2);
});

test('reduced motion shows the finish at once', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-abridged');
  await page.getByTestId('rg-start').click();
  await expect(page.getByTestId('rg-results')).toBeVisible({ timeout: 2_000 });
  await expect(page.getByTestId('rg-skip')).toHaveCount(0);
  await ctx.close();
});

test('a ship can be sent to the Regatta from its menu', async ({ page }) => {
  await page.goto('/#/ship/ss-full-run/bridge');
  await page.getByTestId('ship-more').click();
  await page.getByTestId('to-regatta').click();
  await expect(page).toHaveURL(/#\/regatta\?ships=ss-full-run/);
  await expect(page.locator('[data-testid="rg-ship"][data-ship="ss-full-run"] input')).toBeChecked();
});
