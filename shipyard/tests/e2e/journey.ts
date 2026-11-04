import { expect, type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';

/**
 * The acceptance-7 journey: commission, equip, plan, pre-flight, export. One function, run in four
 * modes (keyboard only, reduced motion, no WebGL, a 360 px phone). `activate` is how a control is
 * pressed: a click, a tap, or focus plus Enter (keyboard only: no pointer touches the page).
 */
export const REPO = resolve('..');

export type Activate = (l: Locator) => Promise<void>;

export const byClick: Activate = (l) => l.click();
export const byTap: Activate = (l) => l.tap();
export const byKeyboard: Activate = async (l) => {
  await l.focus();
  await l.page().keyboard.press('Enter');
};

export async function journey(page: Page, activate: Activate, name: string, opts: { keyboard?: boolean } = {}) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // 1. commission by cloning the default ship
  await page.goto('/#/');
  await activate(page.getByTestId('commission'));
  const clone = page.getByTestId('mode-clone');
  if (opts.keyboard) {
    await clone.focus();
    await page.keyboard.press('Space');
  } else await clone.check();
  await page.getByTestId('commission-name').fill(name);
  await activate(page.getByTestId('commission-confirm'));
  await expect(page).toHaveURL(new RegExp(`ship/${id}/bridge`));
  await expect(page.getByTestId('crew-profile')).not.toHaveAttribute('data-readonly', 'true');

  // 2. equip a skill: the picker (every registry skill), then the E menu on a hold artifact
  await page.goto(`/#/ship/${id}/bridge?member=strategist`);
  await activate(page.getByTestId('equip-skill'));
  await page.getByTestId('picker-search').fill('gsap-core');
  await activate(page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]'));
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
  await expect(page.getByTestId('worn-list')).toContainText('Gsap');

  // 3. plan: add a stage and move it a place earlier
  await page.goto(`/#/ship/${id}/voyage`);
  await activate(page.getByTestId('add-stage'));
  const label = page.getByTestId('stage-label');
  await label.fill('Journey stage');
  await label.blur();
  if (page.viewportSize() && page.viewportSize()!.width < 1200) await activate(page.getByTestId('inspector-close'));
  const card = page.locator('.stage-card[data-stage="new-stage"]');
  await expect(card).toContainText('Journey stage');
  if (opts.keyboard) {
    await card.focus();
    await page.keyboard.press('Alt+ArrowLeft');
  } else {
    await activate(card.locator('xpath=ancestor::li').getByTestId('move-earlier'));
  }
  await expect(page.getByTestId('voyage-track')).toContainText('Journey stage');

  // 4. pre-flight, then 5. export 00-run-plan.md
  await activate(page.getByTestId('to-preflight'));
  await expect(page.getByRole('heading', { level: 1, name: 'Pre-flight' })).toBeVisible();
  await page.getByTestId('design-path').fill(REPO);
  const [download] = await Promise.all([page.waitForEvent('download'), activate(page.getByTestId('download-plan'))]);
  expect(download.suggestedFilename()).toBe('00-run-plan.md');
  await expect(page.getByTestId('export-message')).toContainText('Downloaded 00-run-plan.md');
}
