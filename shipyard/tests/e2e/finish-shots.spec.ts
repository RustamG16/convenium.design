import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T11 evidence: one screenshot per changed screen at 1440 and 390. Skipped unless SHOT_TAG is set
 * (`SHOT_TAG=before` or `after`), so the normal suite does not write images.
 */
const TAG = process.env.SHOT_TAG;
const DIR = resolve('plan/qa-screens/finish');

const SCREENS: { name: string; hash: string; settle?: string }[] = [
  { name: 'hangar', hash: '/' },
  { name: 'board', hash: '/ship/ss-full-run/board' },
  { name: 'bridge', hash: '/ship/ss-full-run/bridge?member=captain' },
  { name: 'armory', hash: '/armory' },
  { name: 'voyage', hash: '/ship/ss-full-run/voyage' },
  { name: 'preflight', hash: '/ship/ss-full-run/preflight' },
];

test.describe('finish screenshots', () => {
  test.skip(!TAG, 'set SHOT_TAG=before|after');
  test.setTimeout(240_000);
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    test(`shots at ${w}`, async ({ page }) => {
      mkdirSync(DIR, { recursive: true });
      await page.setViewportSize({ width: w, height: h });
      for (const s of SCREENS) {
        if (process.env.SHOT_ONLY && !process.env.SHOT_ONLY.split(',').includes(s.name)) continue;
        await page.goto(`/#${s.hash}`);
        await page.reload();
        if (s.name === 'bridge') await page.locator('[data-testid="turntable"][data-ready="true"]').waitFor({ timeout: 60_000 }).catch(() => undefined);
        await page.waitForTimeout(s.name === 'hangar' || s.name === 'bridge' || s.name === 'board' ? 4500 : 1500);
        await page.screenshot({ path: `${DIR}/${s.name}-${TAG}-${w}.png` });
      }
    });
  }
});
