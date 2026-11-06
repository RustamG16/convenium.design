import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T6: the Bridge. Template banner and Clone to edit, edit mode, recruit, dismiss, undo, the anchor
 * diagram, and acceptance 2 (an equip made through the UI is on the 3D body and in the DOM anchor
 * diagram). The head-artifact face check is the seven screenshots, which are looked at by eye.
 */
const SHOTS = resolve('plan/qa-screens');
mkdirSync(SHOTS, { recursive: true });
const MEMBERS = ['captain', 'strategist', 'analyst', 'critic', 'engineer', 'producer', 'metrics'];

function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && /attribution/i.test(m.text())) errors.push(`warning: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

type Graph = { traverse(fn: (o: { userData: Record<string, unknown> }) => void): void };
const skillsOnBody = (page: Page) =>
  page.evaluate(() => {
    const scene = (window as unknown as { __turntable?: { scene: Graph } }).__turntable?.scene;
    const out: string[] = [];
    scene?.traverse((o) => {
      if (typeof o.userData.skill === 'string') out.push(o.userData.skill);
    });
    return out;
  });

async function cloneFrom(page: Page, member: string) {
  await page.goto(`/#/ship/ss-full-run/bridge?member=${member}`);
  await page.getByTestId('clone-to-edit').click();
  await page.getByTestId('clone-confirm').click();
  await expect(page).toHaveURL(/ship\/ss-full-run-copy\/bridge/);
  await expect(page.getByTestId('template-banner')).toHaveCount(0);
}

test('acceptance 1: cleared storage shows exactly one ship; its bridge is a read-only template', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card')).toHaveCount(1);
  await page.goto('/#/ship/ss-full-run/bridge?member=captain');
  await expect(page.getByTestId('template-banner')).toContainText(/template/i);
  await expect(page.getByTestId('crew-profile')).toHaveAttribute('data-readonly', 'true');
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(7);
  // Edit gestures exist on a template but only open the Clone to edit dialog; nothing changes (simplicity.spec covers the landing).
  await page.getByTestId('equip-skill').click();
  await expect(page.getByTestId('clone-dialog')).toBeVisible();
  await page.getByTestId('clone-cancel').click();
  await expect(page.getByTestId('crew-profile')).toHaveAttribute('data-readonly', 'true');
  await expect(page.locator('[data-testid="anchor-diagram"] [data-drop-anchor]')).toHaveCount(0);
});

test('seven bodies: the face stays clear of the head artifact (screenshots, looked at)', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const m of MEMBERS) {
    await page.goto(`/#/ship/ss-full-run/bridge?member=${m}`);
    const t = page.getByTestId('turntable');
    await expect(t).toHaveAttribute('data-member', m);
    await expect(t).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(SHOTS, `t6-bridge-${m}-1440.png`) });
  }
  expect(errors).toEqual([]);
});

test('turntable loading state: the sheet fills the card first, then fades; the card never changes size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/bridge?member=critic');
  const t = page.getByTestId('turntable');
  await expect(t).toBeVisible();
  const before = await t.boundingBox();
  await expect(page.getByTestId('turntable-veil')).toHaveAttribute('data-hidden', /true|false/);
  await expect(t).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  const after = await t.boundingBox();
  expect(after!.height).toBeCloseTo(before!.height, 0);
  expect(after!.width).toBeCloseTo(before!.width, 0);
  await expect(page.getByTestId('turntable-veil')).toHaveAttribute('data-hidden', 'true');
});

test('acceptance 2: an equip through the UI is on the 3D body and in the DOM anchor diagram; undo takes it off', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneFrom(page, 'strategist');
  const t = page.getByTestId('turntable');
  await expect(t).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await expect.poll(async () => (await skillsOnBody(page)).length, { timeout: 30_000 }).toBeGreaterThan(0);
  expect(await skillsOnBody(page)).not.toContain('gsap-core');
  await page.getByTestId('equip-skill').click();
  await page.getByTestId('picker-search').fill('gsap-core');
  await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
  await expect.poll(() => skillsOnBody(page), { timeout: 10_000 }).toContain('gsap-core');
  // a duplicate is refused with its reason
  await page.getByTestId('equip-skill').click();
  await page.getByTestId('picker-search').fill('gsap-core');
  await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
  await expect(page.getByTestId('notice')).toContainText('already carries');
  // U undoes
  await page.keyboard.press('u');
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(0);
  await expect.poll(() => skillsOnBody(page), { timeout: 10_000 }).not.toContain('gsap-core');
  expect(errors).toEqual([]);
});

test('acceptance 2 without WebGL (?2d): the anchor diagram carries the equip', async ({ page }) => {
  await cloneFrom(page, 'strategist');
  await page.goto('/#/ship/ss-full-run-copy/bridge?member=strategist&2d');
  await page.reload();
  await expect(page.getByTestId('portrait')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByTestId('equip-skill').click();
  await page.getByTestId('picker-search').fill('gsap-core');
  await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
});

test('keyboard: E on a hold artifact opens the equip menu; Delete takes a worn one off; a full anchor offers swap or the hold', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneFrom(page, 'captain');
  // the captain has 3 in the hold (design-analytics, visual-qa, copywriting)
  const chip = page.locator('[data-testid="hold-chip"][data-skill="visual-qa"]');
  await chip.focus();
  await page.keyboard.press('e');
  await expect(page.getByTestId('equip-menu')).toBeVisible();
  // every socket is in use for a 9-worn captain: pick a full anchor, expect the swap offer
  await page.getByTestId('equip-anchor-head').check();
  await page.getByTestId('equip-confirm').click();
  await expect(page.getByTestId('anchor-full')).toBeVisible();
  await page.getByTestId('full-hold').click();
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="visual-qa"]')).toHaveCount(1);
  const before = await page.locator('[data-testid="anchor-diagram"] [data-filled]').count();
  const socket = page.locator('[data-testid="anchor-diagram"] [data-skill="visual-qa"]');
  await socket.focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('[data-testid="anchor-diagram"] [data-filled]')).toHaveCount(before - 1);
});

test('edit mode, recruit to 8 then refused, dismiss with undo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneFrom(page, 'engineer');
  await page.getByTestId('edit-identity').click();
  await page.getByTestId('edit-name').fill('Ada Wrench');
  await page.getByTestId('edit-pigment-3').check();
  await page.getByTestId('edit-body-standin').check();
  await page.getByTestId('edit-save').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ada Wrench');
  await expect(page.getByTestId('agent-chip')).toContainText('design-engineer');
  await expect(page.getByTestId('agent-chip')).toContainText('Verified');
  // recruit the eighth
  await page.getByTestId('recruit').click();
  await page.getByTestId('recruit-name').fill('Gauge Hand');
  await page.getByTestId('recruit-agent').selectOption('fleet-measurer');
  await page.getByTestId('recruit-confirm').click();
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(8);
  await expect(page.getByTestId('recruit')).toBeDisabled();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gauge Hand');
  // dismiss, then undo
  await page.getByTestId('dismiss').click();
  await page.getByTestId('dismiss-yes').click();
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(7);
  await page.getByTestId('notice-undo').click();
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(8);
});

test('mouse drag from the hold onto a socket equips; the 3D body highlights the nearest free anchor', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneFrom(page, 'strategist');
  await expect(page.getByTestId('turntable')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  // free a socket and put the artifact in the hold
  const first = page.locator('[data-testid="anchor-diagram"] [data-filled]').first();
  await first.click();
  await page.getByTestId('socket-hold').click();
  const chip = page.locator('[data-testid="hold-chip"]').first();
  const skill = await chip.getAttribute('data-skill');
  const cb = (await chip.boundingBox())!;
  const body = (await page.getByTestId('body-drop').boundingBox())!;
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  await page.mouse.move(cb.x + 20, cb.y - 40, { steps: 4 });
  // The turntable card is taller than the viewport now: aim at a point of it that is on screen (below the 64 px header).
  const top = Math.max(body.y, 80);
  const bottom = Math.min(body.y + body.height, 880);
  await page.mouse.move(body.x + body.width * 0.5, top + (bottom - top) * 0.3, { steps: 8 });
  await expect(page.getByTestId('body-drop-ring')).toBeVisible();
  await expect(page.getByTestId('drag-ghost')).toContainText('Drop to equip');
  await page.mouse.up();
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  await expect(page.locator(`[data-testid="anchor-diagram"] [data-skill="${skill}"]`)).toHaveCount(1);
});

test('360 phone: the rack is a bottom sheet and the equip completes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await cloneFrom(page, 'strategist');
  await expect(page.getByTestId('crew-profile')).toBeVisible();
  const sheet = page.getByTestId('rack-sheet');
  await expect(sheet).toHaveAttribute('data-snap', 'peek');
  await page.getByTestId('rack-handle').click();
  await expect(sheet).toHaveAttribute('data-snap', 'mid');
  const h = (await sheet.boundingBox())!.height;
  expect(h).toBeGreaterThan(740 * 0.38);
  expect(h).toBeLessThan(740 * 0.42);
  await page.getByTestId('rack-handle').click();
  await expect(sheet).toHaveAttribute('data-snap', 'full');
  await page.getByTestId('equip-skill').click();
  await page.getByTestId('picker-search').fill('gsap-core');
  await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: resolve(SHOTS, 't6-bridge-360.png') });
});
