import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T5: artifacts in 3D and DOM, on software WebGL. All registry skills draw through ArtifactMesh in
 * one canvas; the inspector shows one; an equip on the store appears on the body and an unequip
 * takes it off again, within a few frames.
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

type Graph = { traverse(fn: (o: { name: string; userData: Record<string, unknown>; isMesh?: boolean }) => void): void };

async function skillsIn(page: Page, hook: '__sheet' | '__turntable') {
  return page.evaluate((h) => {
    const scene = (window as unknown as Record<string, { scene: Graph } | undefined>)[h]?.scene;
    if (!scene) return null;
    const skills: string[] = [];
    let meshes = 0;
    scene.traverse((o) => {
      if (typeof o.userData.skill === 'string') skills.push(o.userData.skill);
      if (o.isMesh) meshes++;
    });
    return { skills, meshes };
  }, hook);
}

test('the lab draws every registry skill through ArtifactMesh, with a glyph in the DOM', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/lab');
  const kb = (await (await page.request.get('/data/knowledge-base.json')).json()) as { skills: { id: string; artifact: { family: string } }[] };
  expect(kb.skills.length).toBeGreaterThanOrEqual(101);
  const sheet = page.getByTestId('artifact-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('data-count', String(kb.skills.length));
  await expect.poll(async () => (await skillsIn(page, '__sheet'))?.skills.length ?? 0, { timeout: 90_000 }).toBe(kb.skills.length);
  const drawn = await skillsIn(page, '__sheet');
  expect(new Set(drawn?.skills)).toEqual(new Set(kb.skills.map((s) => s.id)));
  // Every one is a real mesh: no family drew nothing.
  expect(drawn!.meshes).toBeGreaterThanOrEqual(kb.skills.length);
  // DOM: one glyph per skill.
  await expect(page.locator('[data-testid="lab-glyphs"] li')).toHaveCount(kb.skills.length);
  await expect(page.locator('[data-testid="lab-glyphs"] svg.glyph')).toHaveCount(kb.skills.length);
  const families = new Set(await page.locator('[data-testid="lab-glyphs"] svg.glyph').evaluateAll((els) => els.map((e) => e.getAttribute('data-family'))));
  expect(families.size).toBe(11);
  await page.waitForTimeout(3000);
  const stats = await pixelStats(page, sheet);
  expect(stats.differing, 'share of non-background pixels (artifacts drawn smaller since T6)').toBeGreaterThan(0.015);
  expect(stats.colours).toBeGreaterThan(150);
  await sheet.screenshot({ path: resolve(SHOTS, 't5-all-artifacts.png') });
  expect(errors).toEqual([]);
});

test('the inspector shows one artifact and follows the pick', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/lab');
  const inspector = page.getByTestId('artifact-inspector');
  await expect(inspector).toBeVisible();
  await expect(inspector).toHaveAttribute('data-skill', 'visual-qa');
  await page.waitForTimeout(2500);
  const before = await pixelStats(page, inspector);
  expect(before.differing).toBeGreaterThan(0.02);
  await page.locator('[data-testid="lab-glyphs"] li[data-skill="webgl-experience"] button').click();
  await expect(inspector).toHaveAttribute('data-skill', 'webgl-experience');
  await expect(page.getByTestId('lab-picked')).toContainText('webgl-experience');
  await page.waitForTimeout(1500);
  await inspector.screenshot({ path: resolve(SHOTS, 't5-inspector.png') });
  expect(errors).toEqual([]);
});

test('an equip on the store appears on the body; an unequip takes it off', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/lab');
  await page.getByTestId('lab-clone').click();
  await page.getByTestId('lab-member').selectOption('strategist');
  await page.getByTestId('lab-skill').selectOption('gsap-core');
  const turntable = page.getByTestId('turntable');
  await expect(turntable).toHaveAttribute('data-member', 'strategist');
  await expect.poll(async () => (await skillsIn(page, '__turntable'))?.skills.length ?? 0, { timeout: 90_000 }).toBeGreaterThan(0);
  const before = (await skillsIn(page, '__turntable'))!.skills;
  expect(before).not.toContain('gsap-core');
  const worn = await page.locator('[data-testid="lab-worn"] li').count();
  expect(worn).toBe(before.length);
  await page.waitForTimeout(2000);
  const shotBefore = await turntable.screenshot();

  await page.getByTestId('lab-equip').click();
  await expect(page.getByTestId('lab-result')).toContainText('Equipped gsap-core on strategist');
  // The DOM list and the 3D body both gain it.
  await expect(page.locator('[data-testid="lab-worn"] li[data-skill="gsap-core"]')).toHaveCount(1);
  await expect.poll(async () => (await skillsIn(page, '__turntable'))?.skills ?? [], { timeout: 15_000 }).toContain('gsap-core');
  const after = (await skillsIn(page, '__turntable'))!.skills;
  expect(after.length).toBe(before.length + 1);
  await page.waitForTimeout(1500);
  const shotAfter = await turntable.screenshot();
  expect(Buffer.compare(shotBefore, shotAfter), 'the body picture changed').not.toBe(0);
  await turntable.screenshot({ path: resolve(SHOTS, 't5-equip-on-body.png') });

  // A duplicate is refused with its reason and the body is unchanged.
  await page.getByTestId('lab-equip').click();
  await expect(page.getByTestId('lab-result')).toContainText('Refused');
  expect((await skillsIn(page, '__turntable'))!.skills.length).toBe(after.length);

  // Unequip takes it off the body.
  await page.getByTestId('lab-unequip-gsap-core').click();
  await expect.poll(async () => (await skillsIn(page, '__turntable'))?.skills ?? [], { timeout: 15_000 }).not.toContain('gsap-core');
  expect(errors).toEqual([]);
});

test('without WebGL the lab still lists every artifact with its glyph and the equip still reaches the DOM list', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as never;
    } as typeof original;
  });
  const errors = watch(page);
  await page.goto('/#/lab');
  await expect(page.getByTestId('lab-no-webgl')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('[data-testid="lab-glyphs"] svg.glyph').first()).toBeVisible();
  await page.getByTestId('lab-clone').click();
  await page.getByTestId('lab-member').selectOption('strategist');
  await page.getByTestId('lab-skill').selectOption('gsap-core');
  await page.getByTestId('lab-equip').click();
  await expect(page.locator('[data-testid="lab-worn"] li[data-skill="gsap-core"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
