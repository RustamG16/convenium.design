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
  // the result is said where the race is, and the course marks the winner in words (review v2, M3/M5)
  await expect(page.getByTestId('rg-head-winner')).toContainText('SS Mobile Retrofit wins with 93.6 of 100');
  await expect(page.getByTestId('rg-head-winner')).toBeFocused();
  await expect(page.getByTestId('rg-lane-winner')).toHaveCount(1);
  await expect(page.locator('[data-testid="rg-lane"][data-winner]')).toHaveAttribute('data-ship', 'ss-mobile-retrofit');
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
  // v3: the arena is DOM; under reduced motion it stays, still, showing the finish
  await expect(page.getByTestId('rg-arena')).toHaveAttribute('data-still', 'true');
  await expect(page.getByTestId('rg-lane')).toHaveCount(2);
  await ctx.close();
});

test('the arena pictures the course in the DOM: lanes, buoys and the finish gate, with no canvas', async ({ page }) => {
  // v3 (reference regatta-space-arcade.png): the course is drawn as DOM lanes over the race plate, readable by assistive tech
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-abridged');
  await page.getByTestId('rg-start').click();
  const arena = page.getByTestId('rg-arena');
  await expect(arena).toHaveAttribute('data-lanes', '2');
  await expect(arena).not.toHaveAttribute('aria-hidden', 'true');
  await expect(arena.locator('canvas')).toHaveCount(0);
  await expect(page.getByTestId('rg-lane')).toHaveCount(2);
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-results')).toBeVisible();
});

test('a ship can be sent to the Regatta from its menu', async ({ page }) => {
  await page.goto('/#/ship/ss-full-run/bridge');
  await page.getByTestId('ship-more').click();
  await page.getByTestId('to-regatta').click();
  await expect(page).toHaveURL(/#\/regatta\?ships=ss-full-run/);
  await expect(page.locator('[data-testid="rg-ship"][data-ship="ss-full-run"] input')).toBeChecked();
});

test('a tuned copy against its parent: the dry run says it cannot judge tuning (review v2, M1 and m7)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/#/ship/ss-full-run/bridge?member=engineer');
  await page.getByTestId('tune').click();
  await page.getByTestId('clone-confirm').click();
  await expect(page).toHaveURL(/ss-full-run-copy\/bridge/);
  await page.getByTestId('tune').click();
  await page.getByTestId('tune-addendum').fill('Cite one concrete defect per rubric row.');
  await page.getByTestId('tune-save').click();
  await expect(page.getByTestId('tuning-judged')).toContainText('cannot read an addendum');
  await page.getByTestId('ship-more').click();
  await page.getByTestId('to-regatta').click();
  // the copy sails against the ship it came from
  await expect(page.locator('[data-testid="rg-ship"][data-ship="ss-full-run"] input')).toBeChecked();
  await expect(page.locator('[data-testid="rg-ship"][data-ship="ss-full-run-copy"] input')).toBeChecked();
  await page.locator('[data-testid="rg-brief"][data-brief="landing-refresh"] input').check();
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-head-winner')).toHaveAttribute('data-tuning-only', 'true');
  await expect(page.getByTestId('rg-winner')).toContainText('No winner');
  await expect(page.getByTestId('rg-lane-winner')).toHaveCount(0);
  // nor in the arena: no post lights, no pennant (re-review v2, N1)
  await expect(page.getByTestId('rg-arena')).toHaveAttribute('data-winners', '0');

  // a mixed race names the tuning-only pair instead of letting a tier's cost read as a win (re-review v2, n-a)
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-full-run-copy,ss-abridged');
  // a hash-only change keeps the finished race mounted: reload to get a fresh setup
  await page.reload();
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-head-winner')).not.toHaveAttribute('data-tuning-only', 'true');
  await expect(page.getByTestId('rg-head-twins')).toContainText('SS Full Run and SS Full Run copy differ only in tuning');
  await expect(page.getByTestId('rg-twins')).toBeVisible();
  // the copy carries only an addendum, so it ties its parent at the top: no winner, no pennant (re-review 2, new-b)
  await expect(page.getByTestId('rg-head-winner')).toHaveAttribute('data-no-winner', 'true');
  await expect(page.getByTestId('rg-head-winner')).toContainText('No winner');
  await expect(page.getByTestId('rg-arena')).toHaveAttribute('data-winners', '0');
  await expect(page.getByTestId('rg-lane-winner')).toHaveCount(0);
});

test('a critic tuned below the builder: the dry run names the pre-flight check it fails (re-review 3, new-f)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/#/ship/ss-full-run/bridge?member=critic');
  await page.getByTestId('tune').click();
  await page.getByTestId('clone-confirm').click();
  await expect(page).toHaveURL(/ss-full-run-copy\/bridge/);
  await page.getByTestId('tune').click();
  await page.getByTestId('tune-model-haiku').check();
  await page.getByTestId('tune-save').click();
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-full-run-copy');
  await page.reload();
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await expect(page.getByTestId('rg-head-winner')).toHaveAttribute('data-tuning-only', 'true');
  // not "any gap is cost": the copy loses pre-flight points to a named tier rule
  await expect(page.getByTestId('rg-head-twins')).toContainText("SS Full Run copy fails “The critic's model tier is at least the builder's”");
  await expect(page.getByTestId('rg-arena')).toHaveAttribute('data-winners', '0');
});
