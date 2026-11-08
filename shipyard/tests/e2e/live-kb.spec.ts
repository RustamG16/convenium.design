/**
 * v2 T18: the live library, end to end on the dev server. A skill added to library/ shows the stale
 * banner; once the generator runs (as Claude does after editing the library), the open Armory shows the
 * new artifact without a page reload, and the banner says what changed. The registry is restored and
 * the knowledge base regenerated in `finally`, whatever happens.
 */
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(process.cwd(), '..');
const REGISTRY = resolve(REPO, 'library/registry/skills.registry.json');
const KB = resolve(process.cwd(), 'public/data/knowledge-base.json');
const PROBE = 'zz-live-probe';
const python = process.env.PYTHON || 'python';
const generate = () => execFileSync(python, ['library/tools/project.py', 'shipyard'], { cwd: REPO, encoding: 'utf8' });

test.skip(!!process.env.PW_PHONE, 'desktop project only');

test('a skill added to the library appears in the open Armory with no reload', async ({ page }) => {
  test.setTimeout(90_000);
  const original = readFileSync(REGISTRY, 'utf8');
  const kbBefore = readFileSync(KB, 'utf8');
  try {
    await page.goto('/#/armory');
    await expect(page.getByTestId('art-card').first()).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __noReload: number }).__noReload = 1));
    await expect(page.locator(`[data-testid="art-card"][data-skill="${PROBE}"]`)).toHaveCount(0);

    const records = JSON.parse(original) as Record<string, unknown>[];
    const template = records.find((r) => r.id === 'animate')!;
    const probe = { ...template, id: PROBE, name: PROBE, description: 'Live-library probe added by the e2e and removed after it.', status: 'manual' };
    writeFileSync(REGISTRY, `${JSON.stringify([...records, probe], null, 1)}\n`, 'utf8');

    // the watcher asks the generator whether the knowledge base is stale, and says so
    await expect(page.getByTestId('library-banner')).toHaveAttribute('data-state', 'stale', { timeout: 20_000 });
    await expect(page.getByTestId('library-rebuild')).toBeVisible();

    generate();
    await expect(page.getByTestId('library-banner')).toHaveAttribute('data-state', 'updated', { timeout: 20_000 });
    await expect(page.getByTestId('library-banner')).toContainText('1 new skill');
    await page.getByTestId('armory-search').fill(PROBE);
    await expect(page.locator(`[data-testid="art-card"][data-skill="${PROBE}"]`)).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload)).toBe(1);
  } finally {
    writeFileSync(REGISTRY, original, 'utf8');
    generate();
    expect(readFileSync(KB, 'utf8')).toBe(kbBefore);
  }
});

test('the dev server reports library status', async ({ request }) => {
  const r = await request.get('/__shipyard/status');
  expect(r.ok()).toBe(true);
  expect(await r.json()).toMatchObject({ ok: true });
});
