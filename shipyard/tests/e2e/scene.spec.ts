import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T4: the ported 3D scene on SS Full Run, run on software WebGL (SwiftShader). One project at a time.
 * Every screenshot lands in plan/qa-screens/ and is looked at before commit; the assertions here
 * keep a blank canvas, a missing GLB, a stand-in capsule where a GLB exists and a console error
 * from passing.
 */
const SHOTS = resolve('plan/qa-screens');
mkdirSync(SHOTS, { recursive: true });

interface Problems {
  errors: string[];
  glb: { url: string; status: number }[];
  /** crew GLB requests in the order they were issued */
  crewOrder: string[];
}

function watch(page: Page): Problems {
  const p: Problems = { errors: [], glb: [], crewOrder: [] };
  page.on('request', (r) => {
    const m = /\/media\/crew\/([a-z]+)\.glb/.exec(r.url());
    if (m && !p.crewOrder.includes(m[1])) p.crewOrder.push(m[1]);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') p.errors.push(m.text());
  });
  page.on('pageerror', (e) => p.errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (/\.glb(\?|$)/.test(r.url())) p.glb.push({ url: r.url(), status: r.status() });
  });
  return p;
}

/** How much of an element's pixels differ from its own corner (the card background): the canvas is not blank. */
async function pixelStats(page: Page, target: Locator) {
  const png = await target.screenshot();
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    const ref = [data[0], data[1], data[2]];
    let differing = 0;
    const colours = new Set<number>();
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i] - ref[0]) + Math.abs(data[i + 1] - ref[1]) + Math.abs(data[i + 2] - ref[2]) > 60) differing++;
      colours.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4));
    }
    return { differing: differing / (data.length / 4), colours: colours.size };
  }, png.toString('base64'));
}

interface SceneHook {
  scene: { traverse(fn: (o: { name: string; userData: Record<string, unknown> }) => void): void };
  gl: { getContext(): { getExtension(name: string): { loseContext(): void } | null } };
  get(): { controls?: { autoRotate?: boolean } };
}

/** Artifacts and stand-ins in the turntable's scene graph, through the DEV hook. */
async function turntableScene(page: Page) {
  return page.evaluate(() => {
    const hook = (window as unknown as { __turntable?: SceneHook }).__turntable;
    if (!hook) return null;
    const skills: string[] = [];
    let standIn = 0;
    hook.scene.traverse((o) => {
      if (typeof o.userData.skill === 'string') skills.push(o.userData.skill);
      if (o.name === 'stand-in') standIn++;
    });
    return { skills, standIn, autoRotate: hook.get().controls?.autoRotate ?? null };
  });
}

async function openBridge(page: Page, member: string, query = '') {
  await page.goto(`/#/ship/ss-full-run/bridge?member=${member}${query}`);
  await expect(page.getByTestId('crew-profile')).toBeVisible();
}

for (const member of ['captain', 'engineer'] as const) {
  test(`bridge ${member}: real 3D turntable, lit, wearing artifacts, GLB 200, no console errors`, async ({ page }) => {
    test.setTimeout(180_000);
    const p = watch(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openBridge(page, member);
    const turntable = page.getByTestId('turntable');
    await expect(turntable).toBeVisible();
    // The GLB arrives and the stand-in is gone.
    await expect.poll(async () => p.glb.some((g) => g.url.includes(`/media/crew/${member}.glb`)), { timeout: 60_000 }).toBe(true);
    await expect
      .poll(async () => (await turntableScene(page))?.standIn, { timeout: 60_000, message: 'the stand-in capsule must leave once the GLB is in' })
      .toBe(0);
    await page.waitForTimeout(2500);
    // Not blank: a large share of the card differs from its background and many colours appear.
    const stats = await pixelStats(page, turntable);
    expect(stats.differing, 'share of non-background pixels').toBeGreaterThan(0.05);
    expect(stats.colours, 'distinct colours').toBeGreaterThan(150);
    // Artifacts on the body: every worn skill the DOM lists is in the scene graph.
    const listed = await page.locator('[data-testid="worn-list"] li[data-anchor]').evaluateAll((els) => els.map((e) => e.getAttribute('data-skill')));
    const scene = await turntableScene(page);
    expect(listed.length).toBeGreaterThan(0);
    for (const skill of listed) expect(scene?.skills, `${skill} on the body`).toContain(skill);
    await page.screenshot({ path: resolve(SHOTS, `t4-bridge-${member}-1440.png`) });
    for (const g of p.glb) expect(g.status, g.url).toBe(200);
    expect(p.errors).toEqual([]);
  });
}

test('bridge ?2d: the DOM profile with the design sheet and glyphs, no canvas', async ({ page }) => {
  const p = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openBridge(page, 'captain', '&2d');
  await expect(page.getByTestId('portrait')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('[data-testid="loadout-rack"] svg.glyph').first()).toBeVisible();
  await expect(page.getByTestId('replay-walk')).toHaveCount(0);
  await expect(page.getByTestId('portrait').locator('img')).toHaveJSProperty('complete', true);
  await page.screenshot({ path: resolve(SHOTS, 't4-bridge-2d-1440.png') });
  expect(p.glb).toEqual([]);
  expect(p.errors).toEqual([]);
});

test('no WebGL: the board route falls through to the DOM bridge, no canvas, no GLB', async ({ page }) => {
  const p = watch(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as never;
    } as typeof original;
  });
  await page.goto('/#/ship/ss-full-run/board');
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/bridge/);
  await expect(page.getByTestId('portrait')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByTestId('replay-walk')).toHaveCount(0);
  expect(p.glb).toEqual([]);
  expect(p.errors).toEqual([]);
});

test('reduced motion keeps the 3D turntable and stops it turning', async ({ page }) => {
  test.setTimeout(120_000);
  const p = watch(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openBridge(page, 'strategist');
  await expect(page.locator('[data-testid="turntable"] canvas')).toHaveCount(1);
  await expect.poll(async () => (await turntableScene(page))?.autoRotate, { timeout: 60_000 }).toBe(false);
  await expect.poll(async () => (await turntableScene(page))?.standIn, { timeout: 60_000 }).toBe(0);
  await page.waitForTimeout(1500);
  const stats = await pixelStats(page, page.getByTestId('turntable'));
  expect(stats.differing).toBeGreaterThan(0.04);
  expect(p.errors).toEqual([]);
});

test('a lost WebGL context drops the bridge to the DOM profile', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openBridge(page, 'captain');
  await expect.poll(async () => (await turntableScene(page)) !== null, { timeout: 60_000 }).toBe(true);
  await page.evaluate(() => (window as unknown as { __turntable: SceneHook }).__turntable.gl.getContext().getExtension('WEBGL_lose_context')?.loseContext());
  await expect(page.getByTestId('portrait')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('boarding walk: runs on SS Full Run, crew at their stations, walks to the pipeline', async ({ page }) => {
  test.setTimeout(300_000);
  const p = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/board');
  const intro = page.getByTestId('ship-intro');
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute('data-waypoint', 'airlock');
  await expect(page.getByTestId('boarding').getByRole('group', { name: 'Crew aboard' }).getByRole('button')).toHaveCount(7);
  await expect(page.locator('[data-testid="ship-intro"] canvas')).toHaveCount(1);
  // The kit and the crew load; the canvas is not blank.
  await expect.poll(async () => p.glb.filter((g) => g.url.includes('/media/ship-kit/')).length, { timeout: 120_000 }).toBeGreaterThan(8);
  // Condition, not a sleep: the canvas has drawn once it holds more than 200 colours (a loaded run needs longer than a quiet one).
  await expect.poll(async () => (await pixelStats(page, page.locator('[data-testid="ship-intro"] canvas'))).colours, { timeout: 60_000, message: 'the boarding canvas is not blank' }).toBeGreaterThan(200);
  // Walk in: the autopilot carries the camera down the corridor and the card follows.
  const z0 = await page.evaluate(() => (window as unknown as { __ship: { walker: { pos: { z: number } } } }).__ship.walker.pos.z);
  await page.getByTestId('waypoint-next').click();
  await expect(intro).toHaveAttribute('data-waypoint', 'corridor', { timeout: 120_000 });
  const z1 = await page.evaluate(() => (window as unknown as { __ship: { walker: { pos: { z: number } } } }).__ship.walker.pos.z);
  expect(z1).toBeLessThan(z0 - 3);
  await expect(page.getByTestId('pipeline')).toBeVisible();
  // Loading budget: the captain and the two stations before him first (3.5 MB), the other four after.
  // The other four are requested after the first three finish, so wait for them (a loaded machine is slower), do not count at once.
  await expect.poll(() => p.crewOrder.length, { timeout: 120_000, message: 'all seven crew GLBs are requested' }).toBe(7);
  expect(p.crewOrder.slice(0, 3).sort()).toEqual(['captain', 'critic', 'engineer']);
  for (const g of p.glb) expect(g.status, g.url).toBe(200);
  expect(p.errors).toEqual([]);
});

test('boarding walk, reduced motion: every stop arrives at once; the bridge shows the crew and the welcome', async ({ page }) => {
  test.setTimeout(300_000);
  const p = watch(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/board');
  const intro = page.getByTestId('ship-intro');
  await expect(intro).toBeVisible();
  await expect.poll(async () => p.glb.filter((g) => g.url.includes('/media/crew/')).length, { timeout: 120_000 }).toBeGreaterThanOrEqual(7);
  // The walk visits every station in order, instantly.
  await page.getByTestId('rail-engineer').click();
  await expect(intro).toHaveAttribute('data-waypoint', 'engineer', { timeout: 30_000 });
  await page.getByTestId('rail-captain').click();
  await expect(intro).toHaveAttribute('data-waypoint', 'captain', { timeout: 30_000 });
  await expect(page.getByTestId('waypoint-card')).toContainText('Welcome aboard');
  // Condition, not a sleep: the welcome frame is drawn once it holds 300+ colours and most of it differs from flat.
  await expect.poll(async () => (await pixelStats(page, page.locator('[data-testid="ship-intro"] canvas'))).colours, { timeout: 60_000 }).toBeGreaterThan(300);
  const stats = await pixelStats(page, page.locator('[data-testid="ship-intro"] canvas'));
  expect(stats.differing).toBeGreaterThan(0.2);
  await page.screenshot({ path: resolve(SHOTS, 't4-board-1440.png') });
  // The walk ends on the bridge: the captain's profile opens.
  await page.getByTestId('meet-the-crew').click();
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/bridge\?member=captain/);
  for (const g of p.glb) expect(g.status, g.url).toBe(200);
  expect(p.errors).toEqual([]);
  expect(existsSync(resolve(SHOTS, 't4-board-1440.png'))).toBe(true);
});

test('the walk plays once per ship: opening the ship again goes to the bridge', async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run');
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/board/);
  await page.getByTestId('skip-to-bridge').click();
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/bridge/);
  await page.goto('/#/ship/ss-full-run');
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/bridge/);
  // Replay from the bridge.
  await page.getByTestId('ship-more').click();
  await page.getByTestId('replay-walk').click();
  await expect(page).toHaveURL(/#\/ship\/ss-full-run\/board/);
});

test('boarding walk on the fleet ship: the gauge bay is a stop, its stand-in stands in the aisle, the captain stop is reachable', async ({ page }) => {
  test.setTimeout(300_000);
  const p = watch(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-mobile-fleet/board');
  const intro = page.getByTestId('ship-intro');
  await expect(intro).toBeVisible();
  await expect(page.getByTestId('rail-gauge')).toBeVisible();
  await expect.poll(async () => p.glb.filter((g) => g.url.includes('/media/crew/')).length, { timeout: 120_000 }).toBeGreaterThanOrEqual(3);
  await page.getByTestId('rail-gauge').click();
  await expect(intro).toHaveAttribute('data-waypoint', 'gauge', { timeout: 30_000 });
  await expect(page.getByTestId('waypoint-card')).toContainText('Gauge');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: resolve(SHOTS, 't4-board-fleet-gauge-1440.png') });
  await page.getByTestId('rail-captain').click();
  await expect(intro).toHaveAttribute('data-waypoint', 'captain', { timeout: 30_000 });
  const eye = await page.evaluate(() => (window as unknown as { __ship: { walker: { pos: { x: number; z: number } } } }).__ship.walker.pos);
  expect(eye.z).toBeCloseTo(-4.9, 1);
  expect(p.errors).toEqual([]);
});
