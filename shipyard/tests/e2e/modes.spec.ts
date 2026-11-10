import { expect, test } from '@playwright/test';
import { byClick, byKeyboard, journey } from './journey';

// v3: the Bridge shows the crew render by default; these tests drive the 3D turntable, so the viewer's choice is preset to 3D
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('convenium.shipyard.ui.bridgeView', '3d');
    } catch {
      /* storage blocked: the URL's view=3d still applies */
    }
  });
});


/**
 * Acceptance 7 on the desktop project: keyboard only, reduced motion, and no WebGL each complete the
 * journey (commission, equip, plan, pre-flight, export). The 360 px phone is `phone.spec.ts`
 * (`PW_PHONE=1 npx playwright test`, one project at a time).
 */
test('keyboard only: no pointer touches the page between the first load and the export', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await journey(page, byKeyboard, 'Keys Only', { keyboard: true });
});

test('reduced motion: the journey completes and the 3D turntable is still there, still', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await journey(page, byClick, 'Calm Run');
  await page.goto('/#/ship/calm-run/bridge?member=strategist&view=3d');
  await expect(page.getByTestId('turntable')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await ctx.close();
});

test('no WebGL: the DOM views carry the whole journey', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as never;
    } as typeof original;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await journey(page, byClick, 'Flat Run');
  await page.goto('/#/');
  await expect(page.getByTestId('fleet-ring')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
});
