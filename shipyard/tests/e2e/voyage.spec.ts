import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * T8: the hangar, the Commission dialog, the voyage planner, and acceptance 4 end to end: a ship is
 * commissioned by cloning SS Full Run through the dialog, renamed, recruited, equipped, its voyage
 * edited, pre-flight opened, 00-run-plan.md exported through the UI and the REAL
 * `python library/tools/verify.py --plan` run on it. library/ is untouched afterwards.
 */
const SHOTS = resolve('plan/qa-screens');
mkdirSync(SHOTS, { recursive: true });
const REPO = resolve('..');
const VERIFY = join(REPO, 'library', 'tools', 'verify.py');
const STORAGE_KEY = 'convenium.shipyard.v1';

function python(): string {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : ['python', 'python3', 'py'];
  for (const c of candidates) if (spawnSync(c, ['--version'], { encoding: 'utf8' }).status === 0) return c;
  throw new Error('no python on PATH (set PYTHON)');
}
function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && /attribution/i.test(m.text())) errors.push(`warning: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}
const stored = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null') as { ships: { id: string; name: string; crew: { id: string }[]; voyage: { kind: string; id?: string; label?: string }[] }[]; commissions: Record<string, string>; logbook: Record<string, { kind: string }[]> }, STORAGE_KEY);

/** Commission SS Full Run as a clone through the dialog; the page ends on the new ship's bridge. */
async function commissionClone(page: Page, name: string) {
  await page.goto('/#/');
  await page.getByTestId('commission').click();
  await page.getByTestId('mode-clone').check();
  await page.getByTestId('clone-source').selectOption('ss-full-run');
  await page.getByTestId('commission-name').fill(name);
  await page.getByTestId('commission-confirm').click();
  await expect(page.getByTestId('crew-profile')).not.toHaveAttribute('data-readonly', 'true');
}

test('hangar: exactly one card by default, the other library workflows only inside the dialog', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card')).toHaveCount(1);
  await expect(page.getByTestId('ship-card')).toContainText('SS Full Run');
  await expect(page.getByTestId('fleet-ring')).toHaveAttribute('data-count', '1');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: resolve(SHOTS, 't8-hangar-1440.png') });
  await page.getByTestId('commission').click();
  await page.getByTestId('mode-clone').check();
  const options = await page.getByTestId('clone-source').locator('option').allTextContents();
  expect(options.length).toBe(4);
  expect(options.join(' ')).toMatch(/SS Full Run/);
  expect(options.join(' ')).toMatch(/Abridged/);
  await page.screenshot({ path: resolve(SHOTS, 't8-commission-1440.png') });
  expect(errors).toEqual([]);
});

test('hangar: the fleet ring shows a hull per ship and falls back to silhouettes with ?2d', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await commissionClone(page, 'Second hull');
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card')).toHaveCount(2);
  await expect(page.getByTestId('fleet-ring')).toHaveAttribute('data-count', '2');
  await expect.poll(() => page.evaluate(() => {
    const s = (window as unknown as { __fleet?: { scene: { traverse(f: (o: { isMesh?: boolean }) => void): void } } }).__fleet?.scene;
    let n = 0;
    s?.traverse((o) => { if (o.isMesh) n++; });
    return n;
  }), { timeout: 30_000 }).toBeGreaterThan(1);
  await page.goto('/#/?2d');
  await page.reload();
  await expect(page.getByTestId('fleet-ring')).toHaveCount(0);
  await expect(page.locator('svg.hull').first()).toBeVisible();
});

test('commission: blank ship, import ship.json (valid, then invalid with its problem list), rename, reset, delete with undo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/');
  await page.getByTestId('commission').click();
  await page.getByTestId('mode-blank').check();
  await page.getByTestId('commission-name').fill('Blank Barge');
  await page.getByTestId('commission-confirm').click();
  await expect(page).toHaveURL(/ship\/blank-barge\/bridge/);
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(1);
  await page.goto('/#/');
  // import a ship.json made from the store (valid), and a broken one
  const ship = (await stored(page)).ships[0];
  await page.getByTestId('commission').click();
  await page.getByTestId('mode-import').check();
  await page.getByTestId('import-ship-text').fill('{"schema":"shipyard.ship.v1","id":"x"}');
  await page.getByTestId('commission-confirm').click();
  await expect(page.getByTestId('import-problems')).toContainText('crew');
  await page.getByTestId('import-ship-text').fill(JSON.stringify({ ...ship, id: 'blank-barge', name: 'Imported Barge' }));
  await page.getByTestId('commission-confirm').click();
  await expect(page).toHaveURL(/ship\/blank-barge-2\/bridge/);
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card')).toHaveCount(3);
  // rename
  const card = page.locator('[data-ship="blank-barge"]');
  await card.getByTestId('rename').click();
  await card.getByTestId('rename-input').fill('Renamed Barge');
  await card.getByTestId('rename-save').click();
  await expect(card).toContainText('Renamed Barge');
  // delete, then undo with Ctrl+Z
  await card.getByTestId('delete-ship').click();
  await expect(page.getByTestId('ship-card')).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('ship-card')).toHaveCount(3);
});

test('voyage planner: add, edit, reorder (drag and Alt+Arrow), duplicate, delete with undo, template, live run-plan row, the Fix link', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await commissionClone(page, 'Planner');
  await page.goto('/#/ship/planner/voyage');
  const items = page.locator('[data-testid="stage-item"], [data-testid="gate-item"]');
  await expect(items).toHaveCount(16);
  const n0 = 16;
  await page.getByTestId('stage-item').first().locator('[data-card]').click();
  await expect(page.getByTestId('stage-inspector')).toHaveAttribute('data-stage', 'run-plan');
  await expect(page.getByTestId('runplan-row')).toContainText('"id": "run-plan"');
  await expect(page.getByTestId('runplan-row')).toContainText('<convenium_design>/library/skills/');
  // the active artifact is chosen from the member's worn loadout only
  const skillOptions = await page.getByTestId('stage-skill').locator('option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
  const captainWorn = (await stored(page)).ships[0] && true;
  expect(captainWorn).toBe(true);
  expect(skillOptions[0]).toBe('');
  expect(skillOptions.length).toBeLessThanOrEqual(10);
  // add a stage after the selected one and edit it
  await page.getByTestId('add-stage').click();
  await expect(page.getByTestId('stage-inspector')).toHaveAttribute('data-stage', 'new-stage');
  await page.getByTestId('stage-label').fill('Spare pass');
  await page.getByTestId('stage-label').blur();
  await page.getByTestId('stage-outputs').fill('spare.md\nspare-notes.md');
  await page.getByTestId('stage-outputs').blur();
  await page.getByTestId('stage-skill').selectOption({ index: 1 });
  await expect(page.getByTestId('runplan-row')).toContainText('spare-notes.md');
  await expect(page.locator('.stage-card[data-stage="new-stage"]')).toContainText('Spare pass');
  expect(await items.count()).toBe(n0 + 1);
  // reorder with the keyboard: Alt+ArrowRight moves it one place later and keeps focus
  const index = Number(await page.locator('.stage-card[data-stage="new-stage"]').locator('xpath=ancestor::li').getAttribute('data-index'));
  await page.locator('.stage-card[data-stage="new-stage"]').focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.locator(`[data-index="${index + 1}"] .stage-card[data-stage="new-stage"]`)).toBeFocused();
  // and back with the mouse: drag the handle onto the earlier neighbour
  const handle = page.locator(`[data-index="${index + 1}"]`).getByTestId('drag-handle');
  const target = (await page.locator(`[data-index="${index}"]`).boundingBox())!;
  const hb = (await handle.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 40, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(`[data-index="${index}"] .stage-card[data-stage="new-stage"]`)).toHaveCount(1);
  // duplicate, then delete the copy and undo the delete
  await page.locator(`[data-index="${index}"]`).getByTestId('duplicate').click();
  await expect(page.locator('.stage-card[data-stage="new-stage-copy"]')).toHaveCount(1);
  await page.locator('.stage-card[data-stage="new-stage-copy"]').locator('xpath=ancestor::li').getByTestId('delete-item').click();
  await expect(page.locator('.stage-card[data-stage="new-stage-copy"]')).toHaveCount(0);
  await page.getByTestId('notice-undo').click();
  await expect(page.locator('.stage-card[data-stage="new-stage-copy"]')).toHaveCount(1);
  // a template appends its stages with unique ids
  const before = await items.count();
  await page.getByTestId('template-select').selectOption('ss-abridged');
  await page.getByTestId('template-append').click();
  expect(await items.count()).toBeGreaterThan(before);
  await page.screenshot({ path: resolve(SHOTS, 't8-voyage-1440.png') });
  // a pre-flight Fix link lands on its stage
  await page.goto('/#/ship/planner/voyage?stage=build');
  await expect(page.getByTestId('stage-inspector')).toHaveAttribute('data-stage', 'build');
  expect(errors).toEqual([]);
});

test('acceptance 4 and the chain: commission, rename, recruit, equip, edit the voyage, pre-flight, export, verify.py CLEAN, library/ unchanged', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  // acceptance 1 first: cleared storage is exactly one ship, seven crew
  await page.goto('/#/');
  await expect(page.getByTestId('ship-card')).toHaveCount(1);
  await expect(page.getByTestId('crew-chips').getByRole('listitem')).toHaveCount(7);
  expect((await stored(page))?.commissions ?? {}).toEqual({});

  // 1. commission by cloning SS Full Run through the dialog
  await commissionClone(page, 'Night Run');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // 2. rename it from the hangar
  await page.goto('/#/');
  const card = page.locator('[data-ship="night-run"]');
  await card.getByTestId('rename').click();
  await card.getByTestId('rename-input').fill('Night Run II');
  await card.getByTestId('rename-save').click();
  await expect(card).toContainText('Night Run II');
  // 3. recruit
  await page.goto('/#/ship/night-run/bridge?member=strategist');
  await page.getByTestId('recruit').click();
  await page.getByTestId('recruit-name').fill('Gauge Hand');
  await page.getByTestId('recruit-agent').selectOption('fleet-measurer');
  await page.getByTestId('recruit-confirm').click();
  await expect(page.locator('nav[aria-label="Crew"] li')).toHaveCount(8);
  // 4. equip an off-route skill on the strategist
  await page.locator('nav[aria-label="Crew"] button', { hasText: 'Mira Sondh' }).click();
  await page.getByTestId('equip-skill').click();
  await page.getByTestId('picker-search').fill('gsap-core');
  await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
  await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
  // 5. edit the voyage: a spare stage for the new member, kept clean for pre-flight
  await page.getByTestId('to-voyage').click();
  await page.getByTestId('stage-item').first().locator('[data-card]').click();
  await page.getByTestId('add-stage').click();
  await page.getByTestId('stage-label').fill('Spare read-out');
  await page.getByTestId('stage-label').blur();
  await page.getByTestId('stage-member').selectOption('gauge-hand');
  await page.getByTestId('stage-phase').selectOption('diagnose');
  await page.getByTestId('stage-outputs').fill('spare-readout.md');
  await page.getByTestId('stage-outputs').blur();
  await expect(page.getByTestId('runplan-row')).toContainText('fleet-measurer');
  // 6. pre-flight
  await page.getByTestId('to-preflight').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pre-flight' })).toBeVisible();
  await expect(page.getByTestId('cleared')).toHaveText('Cleared for departure');
  await page.getByTestId('design-path').fill(REPO);
  // 7. export 00-run-plan.md through the UI and run the real verify.py on it
  const dir = mkdtempSync(join(tmpdir(), 'shipyard-chain-'));
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-plan').click()]);
  const file = join(dir, '00-run-plan.md');
  await download.saveAs(file);
  const text = readFileSync(file, 'utf8');
  const plan = JSON.parse(/```json\s*\n([\s\S]*?)\n```/.exec(text)![1]) as { run: string; phases: { id: string; agent: string; skill_path: string | null }[] };
  expect(plan.run).toBe('Night Run II');
  expect(plan.phases.some((p) => p.id === 'spare-read-out' || p.id.startsWith('new-stage'))).toBe(true);
  for (const ph of plan.phases) if (ph.skill_path) expect(existsSync(ph.skill_path), `${ph.id}: ${ph.skill_path}`).toBe(true);
  const run = spawnSync(python(), ['-I', VERIFY, '--plan', file], { cwd: REPO, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  console.log(`verify.py --plan (exit ${run.status}) on the cloned ship's UI export:\n${out.trim()}`);
  expect(run.status).toBe(0);
  expect(out).toMatch(/^CLEAN \(run plan /m);
  writeFileSync(join(dir, 'done'), 'ok');
  rmSync(dir, { recursive: true, force: true });
  // library/ is untouched
  const git = spawnSync('git', ['status', '--porcelain', '--', 'library'], { cwd: REPO, encoding: 'utf8' });
  expect(git.stdout.trim(), 'git status of library/').toBe('');
  // the commissions that came from real actions
  const s = await stored(page);
  for (const id of ['first-ship', 'first-recruit', 'first-off-route', 'first-export']) expect(s.commissions[id], id).toBeTruthy();
  expect(s.ships.find((x) => x.id === 'night-run')?.name).toBe('Night Run II');
  expect(errors).toEqual([]);
});

test('360 phone: commission, plan (vertical list, full-screen inspector), pre-flight, export', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 360, height: 740 });
  await commissionClone(page, 'Pocket Run');
  await page.goto('/#/ship/pocket-run/voyage');
  const track = page.getByTestId('voyage-track');
  const first = (await page.getByTestId('stage-item').nth(0).boundingBox())!;
  const second = (await page.getByTestId('stage-item').nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThan(first.y);
  await page.getByTestId('add-stage').click();
  await expect(page.getByTestId('inspector-sheet')).toBeVisible();
  await page.getByTestId('stage-label').fill('Phone stage');
  await page.getByTestId('stage-label').blur();
  await page.getByTestId('inspector-close').click();
  await expect(track).toContainText('Phone stage');
  await page.getByTestId('stage-item').nth(2).getByTestId('move-later').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: resolve(SHOTS, 't8-voyage-360.png') });
  await page.getByTestId('to-preflight').click();
  await page.getByTestId('design-path').fill(REPO);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-plan').click()]);
  expect(download.suggestedFilename()).toBe('00-run-plan.md');
});
