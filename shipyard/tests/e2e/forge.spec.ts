/**
 * v2 T19: the Forge end to end on the dev server. A skill is created through the form, previewed as a
 * diff, applied (project.py all + verify.py), shows up in the open app through the live library, and
 * is deleted again through the Forge. Whatever happens, `finally` puts library/ and every generated
 * tree back to exactly where they were, and asserts it.
 */
import { expect, test, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(process.cwd(), '..');
const REGISTRY = resolve(REPO, 'library/registry/skills.registry.json');
const PROBE = 'zz-forge-e2e';
const PROBE_DIR = resolve(REPO, 'library/skills/03-motion-3d', PROBE);
const TREES = ['library', '.claude', '.agents', '.codex', 'ship/data', 'shipyard/public/data'];
const python = process.env.PYTHON || 'python';
const status = () => spawnSync('git', ['status', '--porcelain', '--', ...TREES], { cwd: REPO, encoding: 'utf8' }).stdout;

test.skip(!!process.env.PW_PHONE || !!process.env.PW_BASE_URL, 'dev server, desktop project only');

async function previewAndApply(page: Page) {
  await page.getByTestId('forge-preview-btn').click();
  await expect(page.getByTestId('forge-preview')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('forge-apply').click();
  await expect(page.getByTestId('forge-result')).toHaveAttribute('data-ok', 'true', { timeout: 120_000 });
}

test('create a skill in the Forge, see it live, delete it, and leave the library as it was', async ({ page }) => {
  test.setTimeout(360_000);
  const before = status();
  const registry = readFileSync(REGISTRY, 'utf8');
  try {
    await page.goto('/#/forge');
    await expect(page.getByTestId('forge')).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __noReload: number }).__noReload = 1));

    // create
    await page.getByTestId('forge-tab-skills').click();
    await page.getByTestId('forge-skill-rack-new').click();
    await page.getByTestId('forge-skill-id').fill(PROBE);
    await page.getByTestId('forge-skill-category').selectOption('03-motion-3d');
    await page.getByTestId('forge-skill-group').fill('Motion');
    await page.getByTestId('forge-skill-description').fill('A probe skill the Forge e2e creates and deletes again.');
    await page.getByTestId('forge-preview-btn').click();
    await expect(page.getByTestId('forge-diff')).toContainText(`"id": "${PROBE}"`, { timeout: 20_000 });
    await expect(page.getByTestId('forge-preview')).toContainText(`library/skills/03-motion-3d/${PROBE}/SKILL.md`);
    await page.getByTestId('forge-apply').click();
    await expect(page.getByTestId('forge-result')).toHaveAttribute('data-ok', 'true', { timeout: 120_000 });
    await expect(page.getByTestId('forge-stat')).toContainText('skills.registry.json');

    // the live library swaps the new knowledge base in, without a reload
    await expect(page.getByTestId('library-banner')).toContainText('1 new skill', { timeout: 20_000 });
    await expect(page.locator(`[data-testid="forge-skill-rack"] [data-id="${PROBE}"]`)).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload)).toBe(1);
    expect(existsSync(resolve(PROBE_DIR, 'SKILL.md'))).toBe(true);

    // delete it again through the Forge: refused without the id typed back, then applied
    await page.getByTestId('forge-again').click();
    await page.locator(`[data-testid="forge-skill-rack"] [data-id="${PROBE}"]`).click();
    await page.getByTestId('forge-mode-delete').check();
    await expect(page.getByTestId('forge-preview-btn')).toBeDisabled();
    await page.getByTestId('forge-confirm').fill(PROBE);
    await previewAndApply(page);
    await expect(page.locator(`[data-testid="forge-skill-rack"] [data-id="${PROBE}"]`)).toHaveCount(0, { timeout: 20_000 });
    expect(existsSync(PROBE_DIR)).toBe(false);
  } finally {
    if (readFileSync(REGISTRY, 'utf8') !== registry || existsSync(PROBE_DIR)) {
      writeFileSync(REGISTRY, registry, 'utf8');
      rmSync(PROBE_DIR, { recursive: true, force: true });
      execFileSync(python, ['library/tools/project.py', 'all'], { cwd: REPO, encoding: 'utf8' });
    }
    expect(status(), 'library/ and the generated trees are back where they were').toBe(before);
  }
});

test('the Forge refuses a bad request and names the problem', async ({ page }) => {
  await page.goto('/#/forge');
  await page.getByTestId('forge-tab-skills').click();
  await page.getByTestId('forge-skill-rack-new').click();
  // a taken id passes the form's own checks but not the server's
  await page.getByTestId('forge-skill-id').fill('animate');
  await page.getByTestId('forge-skill-category').selectOption({ index: 1 });
  await page.getByTestId('forge-skill-group').fill('Motion');
  await page.getByTestId('forge-skill-description').fill('A duplicate of an existing skill id.');
  await page.getByTestId('forge-preview-btn').click();
  await expect(page.getByTestId('forge-problems')).toContainText('skill animate already exists', { timeout: 20_000 });
});

test('a cross-origin request to the Forge is refused', async ({ request }) => {
  const r = await request.post('/__shipyard/forge/preview', { headers: { origin: 'https://evil.example' }, data: { kind: 'skill', op: 'delete', payload: { id: 'animate', confirm: 'animate' } } });
  expect(r.status()).toBe(403);
});
