import { expect, test } from '@playwright/test';
import { byTap, journey } from './journey';

/** Acceptance 7, the 360 px phone with touch: `PW_PHONE=1 npx playwright test` (the phone project only). */
test('360 px phone, touch: commission, equip, plan, pre-flight, export', async ({ page }) => {
  test.setTimeout(150_000);
  expect(page.viewportSize()?.width).toBe(360);
  await journey(page, byTap, 'Phone Run');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
