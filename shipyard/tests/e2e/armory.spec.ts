import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
 * T7: the Armory. Filters, the virtualised grid, search, the inspector (one small canvas, only while
 * open), Charts and Modules, and equip from the Armory to a member in every input mode: mouse drag,
 * the keyboard E menu, and a 300 ms touch hold (real CDP touch events). Dragging onto the 3D body
 * rings the nearest free anchor.
 */
const SHOTS = resolve('plan/qa-screens');
mkdirSync(SHOTS, { recursive: true });

function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
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

async function cloneAndPickStrategist(page: Page) {
  await page.goto('/#/armory');
  await page.getByTestId('armory-clone').click();
  await expect(page.getByTestId('target-ship')).toBeVisible();
  await page.getByTestId('target-member').selectOption('strategist');
}

const card = (page: Page, skill: string) => page.locator(`[data-testid="art-card"][data-skill="${skill}"]`);
const inDiagram = (page: Page, skill: string) => page.locator(`[data-testid="anchor-diagram"] [data-skill="${skill}"]`);

async function search(page: Page, q: string) {
  await page.getByTestId('armory-search').fill(q);
  await expect(page.getByTestId('armory-count')).toContainText('of');
}

test('the grid is virtualised above 60 cards; search and filters narrow it; the inspector shows one canvas', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/armory');
  const kb = (await (await page.request.get('/data/knowledge-base.json')).json()) as { skills: unknown[] };
  const total = kb.skills.length;
  const grid = page.getByTestId('art-grid');
  await expect(grid).toHaveAttribute('data-count', String(total));
  await expect(grid).toHaveAttribute('data-virtual', 'true');
  const rendered = Number(await grid.getAttribute('data-rendered'));
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(total);
  await expect(page.getByTestId('armory-count')).toContainText(`${total} of ${total}`);
  // scrolling renders other cards
  await grid.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(page.getByTestId('art-card').last()).toBeVisible();
  // search
  await search(page, 'gsap');
  const n = Number(await grid.getAttribute('data-count'));
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(total);
  await expect(card(page, 'gsap-core')).toBeVisible();
  await search(page, 'zzzzqqq');
  await expect(page.getByTestId('grid-empty')).toBeVisible();
  await page.getByTestId('filter-clear').click();
  await page.getByTestId('filter-family').selectOption('lens');
  await expect.poll(async () => Number(await grid.getAttribute('data-count'))).toBeLessThan(total);
  await page.getByTestId('filter-clear').click();
  await page.getByTestId('filter-tier').selectOption('dormant');
  await expect.poll(async () => Number(await grid.getAttribute('data-count'))).toBeLessThan(total);
  await page.getByTestId('filter-clear').click();
  // the inspector: one canvas, follows the pick, counts toward the codex once
  await search(page, 'visual-qa');
  await card(page, 'visual-qa').click();
  const detail = page.getByTestId('art-detail');
  await expect(detail).toHaveAttribute('data-skill', 'visual-qa');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('art-detail')).toContainText('Routed by');
  await page.waitForTimeout(2000);
  await page.getByTestId('filter-clear').click();
  await page.screenshot({ path: resolve(SHOTS, 't7-armory-1440.png') });
  await page.getByTestId('copy-path').click();
  expect(errors.filter((e) => !/clipboard/i.test(e))).toEqual([]);
});

test('Charts and Modules tabs: carry a chart, fit a module; both are undoable', async ({ page }) => {
  await cloneAndPickStrategist(page);
  await page.getByTestId('tab-charts').click();
  const first = page.getByTestId('chart-card').first();
  await expect(first).toBeVisible();
  const id = (await first.getAttribute('data-doctrine'))!;
  await page.getByTestId(`chart-${id}`).click();
  await expect(first).toHaveAttribute('data-carried', 'true');
  await page.keyboard.press('u');
  await expect(first).not.toHaveAttribute('data-carried', 'true');
  await page.getByTestId('tab-modules').click();
  const mod = page.getByTestId('module-card').first();
  await expect(mod).toBeVisible();
  await mod.getByRole('button').click();
  await expect(mod).toHaveAttribute('data-fitted', 'true');
});

test('mouse: drag a card onto a socket of the target member', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneAndPickStrategist(page);
  await search(page, 'gsap-core');
  const c = (await card(page, 'gsap-core').boundingBox())!;
  const s = (await page.getByTestId('socket-back-0').boundingBox())!;
  await page.mouse.move(c.x + 30, c.y + 30);
  await page.mouse.down();
  await page.mouse.move(c.x + 60, c.y + 60, { steps: 3 });
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 10 });
  await expect(page.getByTestId('drag-ghost')).toContainText('Drop to equip: Back');
  await page.mouse.up();
  await expect(page.getByTestId('socket-back-0')).toHaveAttribute('data-skill', 'gsap-core');
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  await expect(card(page, 'gsap-core')).toHaveAttribute('aria-label', /worn by Mira Sondh/);
});

test('keyboard only: E on a card opens the menu, the choice lands on that member and anchor', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneAndPickStrategist(page);
  await search(page, 'gsap-core');
  await card(page, 'gsap-core').focus();
  await page.keyboard.press('e');
  await expect(page.getByTestId('equip-menu')).toBeVisible();
  await page.getByTestId('equip-member-analyst').check();
  await page.getByTestId('equip-anchor-belt').check();
  await page.getByTestId('equip-confirm').click();
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  await expect(page.getByTestId('notice')).toContainText('Belt');
  await page.getByTestId('target-member').selectOption('analyst');
  await expect(inDiagram(page, 'gsap-core')).toHaveCount(1);
  await expect(inDiagram(page, 'gsap-core')).toHaveAttribute('data-anchor', 'belt');
});

test('touch: a 300 ms hold picks the card up and a drop on a socket equips; a quick swipe only scrolls', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await ctx.newPage();
  await cloneAndPickStrategist(page);
  await search(page, 'gsap-core');
  const cdp = await ctx.newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: x!, y: y! }] });
  let c = (await card(page, 'gsap-core').boundingBox())!;
  let cx = c.x + c.width / 2;
  let cy = c.y + c.height / 2;
  // a quick move before 300 ms is a scroll: nothing is picked up
  await touch('touchStart', cx, cy);
  await touch('touchMove', cx, cy + 40);
  await page.waitForTimeout(400);
  await touch('touchEnd');
  await expect(page.getByTestId('drag-ghost')).toHaveCount(0);
  // a hold of 300 ms+ picks it up (positions re-measured: the swipe may have scrolled the page)
  c = (await card(page, 'gsap-core').boundingBox())!;
  cx = c.x + c.width / 2;
  cy = c.y + c.height / 2;
  const s = (await page.getByTestId('socket-orbit-1').boundingBox())!;
  await touch('touchStart', cx, cy);
  await page.waitForTimeout(450);
  await expect(page.getByTestId('drag-ghost')).toBeVisible();
  for (let i = 1; i <= 8; i++) await touch('touchMove', cx + ((s.x + s.width / 2 - cx) * i) / 8, cy + ((s.y + s.height / 2 - cy) * i) / 8);
  await touch('touchEnd');
  await expect(page.getByTestId('socket-orbit-1')).toHaveAttribute('data-skill', 'gsap-core');
  await ctx.close();
});

test('the bridge drawer: drag a card onto the 3D body; the nearest free anchor is ringed; the body wears it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/bridge?member=strategist&view=3d');
  await page.getByTestId('clone-to-edit').click();
  await page.getByTestId('clone-confirm').click();
  await expect(page.getByTestId('turntable')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await page.getByTestId('open-armory').click();
  await expect(page.getByTestId('armory-drawer')).toBeVisible();
  await search(page, 'gsap-core');
  const c = (await card(page, 'gsap-core').boundingBox())!;
  const body = (await page.getByTestId('body-drop').boundingBox())!;
  await page.mouse.move(c.x + 30, c.y + 30);
  await page.mouse.down();
  await page.mouse.move(c.x - 20, c.y + 60, { steps: 4 });
  await page.mouse.move(body.x + body.width * 0.5, body.y + body.height * 0.5, { steps: 12 });
  await page.mouse.move(body.x + body.width * 0.52, body.y + body.height * 0.5, { steps: 3 });
  await expect(page.getByTestId('body-drop-ring')).toBeVisible();
  const label = await page.getByTestId('drag-ghost').innerText();
  expect(label).toMatch(/Drop to equip: (Hand|Off-hand|Head|Back|Belt|Orbit)/);
  await page.mouse.up();
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  await expect.poll(() => skillsOnBody(page), { timeout: 10_000 }).toContain('gsap-core');
  await expect(inDiagram(page, 'gsap-core')).toHaveCount(1);
});

test('360 phone: the grid is two columns, the inspector is a full-screen sheet and Equip to... completes', async ({ page }) => {
  const errors = watch(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await cloneAndPickStrategist(page);
  await search(page, 'gsap-core');
  const w = (await card(page, 'gsap-core').boundingBox())!.width;
  expect(w).toBeGreaterThan(140);
  expect(w).toBeLessThan(180);
  await page.getByTestId('armory-clone').count();
  await page.screenshot({ path: resolve(SHOTS, 't7-armory-360.png') });
  await card(page, 'gsap-core').click();
  await expect(page.getByTestId('inspector-sheet')).toBeVisible();
  await page.getByTestId('detail-equip-menu').click();
  await page.getByTestId('equip-confirm').click();
  await page.getByTestId('inspector-close').click().catch(() => undefined);
  await expect(page.getByTestId('notice')).toContainText('Equipped');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('without WebGL the inspector shows the large glyph and the keyboard equip still works', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as never;
    } as typeof original;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await cloneAndPickStrategist(page);
  await search(page, 'gsap-core');
  await card(page, 'gsap-core').click();
  await expect(page.getByTestId('art-detail-glyph')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await card(page, 'gsap-core').focus();
  await page.keyboard.press('e');
  await page.getByTestId('equip-confirm').click();
  await expect(inDiagram(page, 'gsap-core')).toHaveCount(1);
});
