/**
 * v2 T20: variants on the Bridge. Tuning a member is per ship and undoable; a template asks to be
 * cloned first; "Fork as a variant" makes the B ship to trial against; "Promote" hands the tier to
 * the Forge (dev) without writing anything here.
 */
import { expect, test } from '@playwright/test';

test.skip(!!process.env.PW_PHONE, 'desktop project only');

test('tune a member on a clone, undo it, fork a variant, and hand the tier to the Forge', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/#/ship/ss-full-run/bridge?member=engineer');
  await expect(page.getByTestId('tuning-card')).toBeVisible();
  await expect(page.getByTestId('tuning-model')).toContainText('as the library says');

  // a template asks to be cloned first
  await page.getByTestId('tune').click();
  await page.getByTestId('clone-confirm').click();
  await expect(page).toHaveURL(/ss-full-run-copy\/bridge/);

  await page.getByTestId('tune').click();
  await page.getByTestId('tune-model-opus').check();
  await page.getByTestId('tune-addendum').fill('Keep every motion under 300 ms.');
  await page.getByTestId('tune-save').click();
  await expect(page.getByTestId('tuning-model')).toContainText('Spawns at opus');
  await expect(page.getByTestId('tuning-model')).toContainText('the library says sonnet');
  await expect(page.getByTestId('tuning-addendum')).toHaveText('Keep every motion under 300 ms.');

  // undo from the toast takes the tuning off
  await page.getByTestId('notice-undo').click();
  await expect(page.getByTestId('tuning-model')).toContainText('as the library says');
  await expect(page.getByTestId('tuning-card')).not.toHaveAttribute('data-tuned', 'true');

  // tune again, then fork the ship as a variant: the copy keeps the tuning and opens on its Bridge
  await page.getByTestId('tune').click();
  await page.getByTestId('tune-model-opus').check();
  await page.getByTestId('tune-save').click();
  await page.getByTestId('ship-more').click();
  await page.getByTestId('fork-variant').click();
  await expect(page).toHaveURL(/ss-full-run-copy-b\/bridge/);
  await expect(page.getByTestId('notice')).toContainText('SS Full Run copy B');

  // promote hands the tier to the Forge; nothing is written until the Forge applies
  await page.goto('/#/ship/ss-full-run-copy-b/bridge?member=engineer');
  await expect(page.getByTestId('tuning-model')).toContainText('Spawns at opus');
  await page.getByTestId('tune-promote').click();
  await expect(page).toHaveURL(/#\/forge\?agent=design-engineer&model=opus/);
  await expect(page.locator('.forge-rack-item[aria-current]')).toHaveAttribute('data-id', 'design-engineer');
  await expect(page.locator('input[name="agent-model"]').nth(0)).toBeChecked();
});
