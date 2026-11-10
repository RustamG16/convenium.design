import { expect, test, type Page } from '@playwright/test';
import { REPO } from './journey';

/**
 * T11, the simplicity pass (plan/simplicity-brief.md): one filled primary per screen, one ship sub-nav,
 * clone-on-edit from a template, the Armory compare strip, the Hangar's primary in the first viewport,
 * the wrapped Voyage track, the Controls disclosure and the remembered Profile disclosure.
 */
const primaries = (page: Page, scope = 'main') => page.locator(`${scope} .btn-primary:visible`);
// v3 (reference bridge-space-arcade.png): the Bridge's Tune agent panel carries its own filled CTA, Send to Regatta;
// the screen's one primary is counted without it, and the panel has exactly that one
const screenPrimaries = (page: Page) => page.locator('main .btn-primary:not(.tune-regatta):visible');

test.describe('one primary per screen', () => {
  test('hangar: Commission a ship is the only filled button', async ({ page }) => {
    // v3 (reference hangar-space-arcade.png): the ship names open the ships; the one filled CTA is Commission
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/');
    await expect(page.getByTestId('fleet-row')).toBeVisible();
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByTestId('commission')).toHaveClass(/btn-primary/);
    await expect(page.getByTestId('open-ship').first()).not.toHaveClass(/btn-primary/);
  });

  for (const screen of ['bridge', 'voyage', 'preflight'] as const) {
    test(`template ${screen}: Clone to edit is the only filled button (Pre-flight: Copy kickoff prompt)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/#/ship/ss-full-run/${screen}`);
      await expect(page.getByTestId('ship-subnav')).toBeVisible();
      await expect(screenPrimaries(page)).toHaveCount(1);
      if (screen === 'bridge') await expect(primaries(page, '.tune-panel')).toHaveCount(1);
      // no folder path yet: entering it is the one primary (finish review M1); with it, Copy kickoff prompt is
      if (screen === 'preflight') {
        await expect(page.getByTestId('goal-export')).toHaveClass(/btn-primary/);
        await expect(page.getByTestId('goal-export')).toHaveText('Enter the folder path');
        await expect(page.getByTestId('copy-kickoff')).not.toHaveClass(/btn-primary/);
        await expect(page.getByTestId('copy-kickoff-why')).toHaveText('Enter the folder path above to enable.');
        await page.getByTestId('goal-export').click();
        await expect(page.getByTestId('design-path')).toBeFocused();
        await page.getByTestId('design-path').fill(REPO);
        await expect(primaries(page)).toHaveCount(1);
        await expect(page.getByTestId('copy-kickoff')).toHaveClass(/btn-primary/);
        await expect(page.getByTestId('goal-export')).toHaveText('Export');
      } else await expect(page.getByTestId('clone-to-edit')).toHaveClass(/btn-primary/);
    });
  }

  test('a clone: bridge has Equip a skill, voyage has Add stage, pre-flight has Copy kickoff prompt as the single primary', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/ship/ss-full-run/bridge?member=strategist');
    await page.getByTestId('clone-to-edit').click();
    await page.getByTestId('clone-confirm').click();
    await expect(page).toHaveURL(/ship\/ss-full-run-copy\/bridge/);
    await expect(screenPrimaries(page)).toHaveCount(1);
    await expect(primaries(page, '.tune-panel')).toHaveCount(1);
    await expect(page.getByTestId('equip-skill')).toHaveClass(/btn-primary/);
    await page.getByTestId('to-voyage').click();
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByTestId('add-stage')).toHaveClass(/btn-primary/);
    await page.getByTestId('to-preflight').click();
    await expect(primaries(page)).toHaveCount(1);
    await page.getByTestId('design-path').fill(REPO);
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByTestId('copy-kickoff')).toHaveClass(/btn-primary/);
    // the files are a quiet group
    await expect(page.getByTestId('export-files').locator('button.btn-primary')).toHaveCount(0);
  });

  test('armory: Clone is the primary with no ship; Equip is the primary once a card is picked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/armory');
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByTestId('armory-clone')).toBeVisible();
    await page.getByTestId('armory-clone').click();
    await expect(page.getByTestId('target-ship')).toBeVisible();
    await page.getByTestId('armory-search').fill('gsap-core');
    await page.locator('[data-testid="art-card"][data-skill="gsap-core"]').click();
    await expect(page.getByTestId('art-detail')).toBeVisible();
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByTestId('detail-equip')).toHaveClass(/btn-primary/);
  });

  test('boarding walk: Walk in is the primary, Skip to bridge a text button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/ship/ss-full-run/board');
    await expect(page.getByTestId('waypoint-card')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('waypoint-next')).toHaveText('Walk in');
    await expect(primaries(page, '[data-testid="ship-intro"]')).toHaveCount(1);
    await expect(page.getByTestId('skip-to-bridge')).toHaveClass(/btn-text/);
  });
});

test('the ship sub-nav: Bridge, Voyage, Pre-flight on every ship screen, the current one marked, readiness and More', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const marks: [string, string][] = [
    ['bridge', 'Bridge'],
    ['voyage', 'Voyage'],
    ['preflight', 'Pre-flight'],
  ];
  for (const [screen, label] of marks) {
    await page.goto(`/#/ship/ss-full-run/${screen}`);
    const nav = page.getByRole('navigation', { name: /SS Full Run screens/ });
    await expect(nav.getByRole('link')).toHaveText(['Bridge', 'Voyage', 'Pre-flight']);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label);
    await expect(page.getByTestId('ship-ready')).toContainText('14 of 14');
  }
  // the links go where they say
  await page.goto('/#/ship/ss-full-run/bridge');
  await page.getByTestId('to-voyage').click();
  await expect(page).toHaveURL(/\/voyage/);
  await page.getByTestId('to-preflight').click();
  await expect(page).toHaveURL(/\/preflight/);
  await page.getByTestId('to-bridge').click();
  await expect(page).toHaveURL(/\/bridge/);
  // overflow: the quiet extras, reachable by keyboard
  await page.getByTestId('ship-more').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('back-to-hangar')).toBeVisible();
  await page.getByTestId('back-to-hangar').click();
  await expect(page).toHaveURL(/#\/$/);
});

test.describe('clone on edit', () => {
  test('Bridge: an edit gesture on a template asks first, changes nothing, then lands in the clone on the same member', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/ship/ss-full-run/bridge?member=strategist');
    await page.getByTestId('equip-skill').click();
    await expect(page.getByTestId('clone-dialog')).toBeVisible();
    // not cloned yet: cancel leaves the hangar with its one ship and an empty drydock
    await page.getByTestId('clone-cancel').click();
    await expect(page).toHaveURL(/ship\/ss-full-run\/bridge/);
    await page.goto('/#/');
    await expect(page.getByTestId('drydock-empty')).toBeVisible();
    // an empty socket, Edit and Recruit ask the same way
    await page.goto('/#/ship/ss-full-run/bridge?member=strategist');
    for (const id of ['edit-identity', 'recruit']) {
      await page.getByTestId(id).click();
      await expect(page.getByTestId('clone-dialog')).toBeVisible();
      await page.getByTestId('clone-cancel').click();
    }
    await page.getByTestId('edit-identity').click();
    await page.getByTestId('clone-confirm').click();
    await expect(page).toHaveURL(/ship\/ss-full-run-copy\/bridge\?.*member=strategist/);
    await expect(page.getByTestId('template-banner')).toHaveCount(0);
    await expect(page.getByTestId('crew-profile')).not.toHaveAttribute('data-readonly', 'true');
    await expect(page.getByTestId('crew-strategist')).toHaveAttribute('aria-current', 'true');
  });

  test('Voyage: Add stage on a template asks first and lands in the clone keeping the selected stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/ship/ss-full-run/voyage');
    const first = page.getByTestId('stage-item').nth(1).locator('[data-card]');
    await first.click();
    const stage = new URL(page.url().replace('#', '')).searchParams.get('stage');
    expect(stage).toBeTruthy();
    await page.getByTestId('add-stage').click();
    await expect(page.getByTestId('clone-dialog')).toBeVisible();
    await page.getByTestId('clone-confirm').click();
    await expect(page).toHaveURL(/ship\/ss-full-run-copy\/voyage\?stage=/);
    expect(page.url()).toContain(`stage=${stage}`);
    await expect(page.getByTestId('template-banner')).toHaveCount(0);
    await expect(page.locator(`.stage-card[data-stage="${stage}"]`)).toHaveAttribute('data-selected', 'true');
  });
});

test.describe('the Armory compare strip', () => {
  test('shows where it lands and the pre-flight effect, and one button equips in one step', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/armory');
    // the grid is full width until something sits beside it
    const gridBox = (await page.getByTestId('art-grid').boundingBox())!;
    expect(gridBox.width).toBeGreaterThan(1200);
    await page.getByTestId('armory-clone').click();
    await page.getByTestId('target-member').selectOption('strategist');
    await page.getByTestId('armory-search').fill('gsap-core');
    await page.locator('[data-testid="art-card"][data-skill="gsap-core"]').click();
    const strip = page.getByTestId('art-compare');
    await expect(strip).toBeVisible();
    await expect(page.getByTestId('compare-place')).toHaveText(/Fills an empty socket: \w|Replaces .+ on \w/);
    await expect(page.getByTestId('compare-preflight')).toHaveText(/^Pre-flight: (no change|adds \d+ (warning|warnings|blocker|blockers))/);
    await expect(page.getByTestId('detail-equip')).toContainText('Equip to Mira Sondh');
    await page.getByTestId('detail-equip').click();
    await expect(page.getByTestId('notice')).toContainText('Equipped');
    await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
    await expect(page.getByTestId('compare-line')).toContainText('already carries');
    await expect(page.getByTestId('detail-equip')).toBeDisabled();
  });

  test('a card shows its title in full and no word is cut in half', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/armory');
    await page.getByTestId('armory-search').fill('superpowers');
    const names = page.locator('[data-testid="art-card"] .art-card-name');
    await expect(names.first()).toBeVisible();
    const clipped = await names.evaluateAll((els) => els.filter((e) => e.scrollHeight > e.clientHeight + 1).length);
    expect(clipped).toBe(0);
    await expect(page.getByTestId('armory-equip-to')).toBeVisible();
    await expect(page.getByText('EQUIPTO', { exact: true })).toHaveCount(0);
  });
});

test('Hangar: the hero, the flagship card and Commission are all in the first 1440x900 viewport', async ({ page }) => {
  // v3 (reference hangar-space-arcade.png): launch-pad hero, the fleet row and the footer with the Commission CTA fit one screen
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/');
  const flag = page.locator('[data-ship="ss-full-run"]');
  await expect(flag.getByTestId('open-ship')).toBeVisible();
  const card = (await flag.boundingBox())!;
  expect(card.y).toBeGreaterThan(0);
  expect(card.y + card.height).toBeLessThanOrEqual(900);
  const cta = (await page.getByTestId('commission').boundingBox())!;
  expect(cta.y + cta.height).toBeLessThanOrEqual(900);
  await expect(page.getByTestId('hull-ring')).toBeInViewport();
  await expect(page.getByTestId('how-it-works')).toHaveText('How it works');
});

test('Voyage: the track wraps at 1440 and 390, so no card is hidden behind a sideways scroll', async ({ page }) => {
  for (const [w, h] of [[1440, 900], [390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/ship/ss-full-run/voyage');
    const track = page.getByTestId('voyage-track');
    await expect(page.getByTestId('stage-item').first()).toBeVisible();
    const m = await track.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, overflowX: getComputedStyle(el).overflowX }));
    expect(m.sw).toBeLessThanOrEqual(m.cw + 1);
    expect(m.overflowX).not.toBe('auto');
    expect(m.overflowX).not.toBe('scroll');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('Boarding walk: the keys are one Controls disclosure, open on a first visit until a key or 4 s, then closed and one click away', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/board');
  const controls = page.getByTestId('controls');
  await expect(controls).toBeVisible({ timeout: 60_000 });
  await expect(controls).toHaveAttribute('open', '');
  await page.keyboard.press('w');
  await expect(controls).not.toHaveAttribute('open', '');
  // one click (or Enter on the summary) opens it again
  await controls.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('walk-keys')).toBeVisible();
  // after a reload it starts closed
  await page.reload();
  await expect(page.getByTestId('controls')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('controls')).not.toHaveAttribute('open', '');
});

test('Bridge: identity first, the lore behind one Profile disclosure that is remembered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/bridge?member=captain');
  const details = page.getByTestId('profile-details');
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('agent-chip')).toContainText('Model tier');
  await expect(page.getByText('Strengths', { exact: true })).toBeHidden();
  await details.locator('summary').click();
  await expect(page.getByText('Strengths', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('profile-details')).toHaveAttribute('open', '');
  // the truth label is stated once per section, not on every row
  await expect(page.getByTestId('identity-card').locator('.truth')).toHaveCount(2);
});

test('Bridge: the crew figure is large and a slot says what to choose', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/bridge?member=captain');
  // v3 (reference bridge-space-arcade.png): the crew render on its pedestal fills the first of four columns
  const t = (await page.getByTestId('crew-stage').boundingBox())!;
  expect(t.width).toBeGreaterThan(260);
  expect(t.height).toBeGreaterThan(420);
  await page.goto('/#/ship/ss-full-run/bridge?member=critic');
  const rows = page.getByTestId('slot-rows');
  if (await rows.count()) await expect(rows).not.toContainText('Not worn: pick one');
});

test('Pre-flight: Copy kickoff prompt is the primary; the downloads and Save sit in a quiet Files group', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/preflight');
  await page.getByTestId('design-path').fill(REPO);
  await expect(page.getByTestId('copy-kickoff')).toHaveClass(/btn-primary/);
  const files = page.getByTestId('export-files');
  await expect(files.getByTestId('download-ship')).toBeVisible();
  await expect(files.getByTestId('download-plan')).toBeVisible();
  await expect(files.getByTestId('save-ship')).toBeVisible();
  await expect(page.getByTestId('goal-export')).not.toHaveClass(/btn-primary/);
});
