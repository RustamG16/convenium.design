/**
 * v2 T23: live trials from the Regatta, against a FAKE Claude Code CLI (tests/fixtures/fake-claude.mjs).
 * The fake never calls a model. It needs its own dev server, because CLAUDE_BIN is read by the server:
 *
 *   CLAUDE_BIN=<abs>/tests/fixtures/fake-claude.mjs FAKE_CLAUDE_MODE_FILE=<a temp file outside test-results/, which Playwright empties> \
 *     npx vite --port 5174 --strictPort
 *   LIVE_FAKE=1 FAKE_CLAUDE_MODE_FILE=<same> PW_BASE_URL=http://localhost:5174 npx playwright test tests/e2e/live-trial.spec.ts
 *
 * The first test runs on the normal dev server too: with no CLI it must say so, with one it must ask
 * for the typed phrase before Start does anything.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

test.skip(!!process.env.PW_PHONE, 'desktop project only');

const FAKE = process.env.LIVE_FAKE === '1';
const MODE_FILE = process.env.FAKE_CLAUDE_MODE_FILE ?? '';
const setMode = (m: 'complete' | 'hang' | 'garbage') => writeFileSync(MODE_FILE, m, 'utf8');

async function openLive(page: Page, ship: string) {
  await page.goto('/#/regatta?brief=landing-refresh&ships=ss-full-run,ss-abridged');
  await page.getByTestId('rg-start').click();
  await page.getByTestId('rg-skip').click();
  await page.locator(`[data-testid="rg-live"][data-ship="${ship}"]`).click();
  await expect(page.getByTestId('rg-live-dialog')).toBeVisible();
}

async function startLive(page: Page, ship: string) {
  await expect(page.getByTestId('rg-live-estimate')).toBeVisible();
  await expect(page.getByTestId('rg-live-estimate')).toContainText('Estimate');
  await expect(page.getByTestId('rg-live-start')).toBeDisabled();
  await page.getByTestId('rg-live-confirm').fill(`run ${ship}`);
  await page.getByTestId('rg-live-start').click();
  await expect(page.getByTestId('rg-live-log')).toBeVisible();
}

test('the live run asks for an estimate and a typed phrase, or says the CLI is missing', async ({ page }) => {
  test.skip(!!process.env.PW_BASE_URL && !FAKE, 'dev server only');
  await openLive(page, 'ss-full-run');
  await expect(page.getByTestId('rg-live-estimate')).toBeVisible();
  const missing = page.getByTestId('rg-live-unavailable');
  if (await missing.isVisible()) {
    await expect(missing).toContainText('CLAUDE_BIN');
    await expect(page.getByTestId('rg-live-start')).toHaveCount(0);
  } else {
    await expect(page.getByTestId('rg-live-start')).toBeDisabled();
    await page.getByTestId('rg-live-confirm').fill('run something-else');
    await expect(page.getByTestId('rg-live-start')).toBeDisabled();
  }
  await page.getByTestId('rg-live-close').click();
  await expect(page.getByTestId('rg-live-dialog')).toHaveCount(0);
});

test.describe('with the fake CLI', () => {
  test.skip(!FAKE || !MODE_FILE, 'set LIVE_FAKE=1 and FAKE_CLAUDE_MODE_FILE, on a dev server started with CLAUDE_BIN');

  test('a complete run is Verified, saved, and places the ship on the leaderboard', async ({ page }) => {
    setMode('complete');
    await openLive(page, 'ss-full-run');
    await startLive(page, 'ss-full-run');
    const result = page.getByTestId('rg-live-result');
    await expect(result).toBeVisible({ timeout: 30_000 });
    await expect(result).toHaveAttribute('data-saved', 'true');
    await expect(result).toContainText('Verified');
    // what the run says about itself is shown apart and never counted (review v2, M2)
    await expect(page.getByTestId('rg-live-reported')).toContainText('Model-reported');
    await expect(page.getByTestId('rg-live-log')).toContainText('scratch folder');
    await page.getByTestId('rg-live-close').click();

    await page.getByTestId('rg-tab-board').click();
    await page.getByTestId('rg-board-landing-refresh').check();
    const rows = page.getByTestId('rg-board-row');
    await expect(rows.filter({ hasText: 'SS Full Run' })).toHaveAttribute('data-place', '1');
    // a ship with only a dry result is still listed, never placed
    await expect(rows.filter({ hasText: 'SS Abridged' })).toHaveAttribute('data-place', 'none');
  });

  test('cancel stops the run and leaves no process behind', async ({ page }) => {
    const pidFile = `${MODE_FILE}.pid`;
    rmSync(pidFile, { force: true });
    setMode('hang');
    await openLive(page, 'ss-abridged');
    await startLive(page, 'ss-abridged');
    await expect(page.getByTestId('rg-live-log')).toContainText('still working', { timeout: 15_000 });
    await expect.poll(() => existsSync(pidFile)).toBe(true);
    const pid = Number(readFileSync(pidFile, 'utf8'));
    await page.getByTestId('rg-live-cancel').click();
    const result = page.getByTestId('rg-live-result');
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toContainText('Cancelled');
    await expect(result).not.toHaveAttribute('data-saved', 'true');
    const alive = () => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    };
    await expect.poll(alive, { timeout: 10_000 }).toBe(false);
    // the lock is released: the next estimate is not busy
    await page.getByTestId('rg-live-close').click();
    await page.locator('[data-testid="rg-live"][data-ship="ss-abridged"]').click();
    await expect(page.getByTestId('rg-live-confirm')).toBeVisible();
  });

  test('malformed output ends the run unsaved and shows what came back', async ({ page }) => {
    setMode('garbage');
    await openLive(page, 'ss-full-run');
    await startLive(page, 'ss-full-run');
    const result = page.getByTestId('rg-live-result');
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toContainText('Unavailable');
    await expect(result).not.toHaveAttribute('data-saved', 'true');
    await expect(page.getByTestId('rg-live-log')).toContainText('this is not json');
  });
});
