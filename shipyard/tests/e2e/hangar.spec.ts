import { expect, test, type ConsoleMessage } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

interface KbShape {
  skills: unknown[];
  crew: { id: string; name: string }[];
  workflows: { default: string; ships: { id: string; name: string; summary: string; stages: { crew?: string[] }[] }[] };
}

const kb = JSON.parse(readFileSync(resolve('public/data/knowledge-base.json'), 'utf8')) as KbShape;
const flagship = kb.workflows.ships.find((s) => s.id === kb.workflows.default)!;
const defaultCrew = kb.crew.filter((c) => flagship.stages.some((s) => s.crew?.includes(c.id)));

function trackConsole(page: import('@playwright/test').Page) {
  const problems: string[] = [];
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

test('Hangar shows exactly one ship, SS Full Run, read from the knowledge base', async ({ page }) => {
  const problems = trackConsole(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Shipyard' })).toBeVisible();
  const cards = page.getByTestId('ship-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(flagship.name);
  await expect(cards.first()).toContainText(flagship.summary);
  await expect(page.getByTestId('template-lock')).toContainText('Template');

  // Seven crew: crew.json minus gauge.
  expect(defaultCrew).toHaveLength(7);
  const chips = page.getByTestId('crew-chips').getByRole('listitem');
  await expect(chips).toHaveCount(7);
  for (const c of defaultCrew) await expect(page.getByTestId('crew-chips')).toContainText(c.name);
  await expect(page.getByTestId('crew-chips')).not.toContainText(kb.crew.find((c) => c.id === 'gauge')!.name);

  // Hull integrity is computed by pre-flight on the converted ship; the default ship is clean.
  await expect(page.getByTestId('hull-ring')).toHaveAttribute('aria-label', /Hull integrity 100 percent, 14 of 14 checks passed/);
  await expect(cards.first()).toContainText('Pre-flight is clean');

  // The count is read from the KB, never hard-coded.
  await expect(page.getByTestId('skill-count')).toHaveText(String(kb.skills.length));

  // Empty drydock state.
  await expect(page.getByTestId('drydock-empty')).toContainText('Clone SS Full Run');

  expect(problems).toEqual([]);
});

test('How it works? carries the honest promise', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('how-it-works').click();
  await expect(page.getByText('Nothing here runs an agent; it writes the plan a session runs.')).toBeVisible();
});

test('every route resolves on hash history; screens not built yet are labelled stubs', async ({ page }) => {
  const problems = trackConsole(page);
  // Voyage (T8) is still a stub; the others are real screens (armory, board, bridge, pre-flight, logbook).
  for (const hash of ['#/ship/ss-full-run/voyage']) {
    await page.goto(`/${hash}`);
    await expect(page.getByTestId('stub-page')).toContainText('Stub');
  }
  await page.goto('/#/armory');
  await expect(page.getByTestId('armory-page')).toBeVisible();
  await page.goto('/#/logbook');
  await expect(page.getByRole('heading', { level: 1, name: 'Logbook' })).toBeVisible();
  await page.goto('/#/ship/ss-full-run/preflight');
  await expect(page.getByRole('heading', { level: 1, name: 'Pre-flight' })).toBeVisible();
  await page.goto('/#/ship/ss-full-run/bridge');
  await expect(page.getByTestId('stub-page')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('malformed saved state falls back to defaults with a banner', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('convenium.shipyard.v1', '{"version":1,"ships":"nope"}');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('persist-banner')).toContainText('could not be read');
  await expect(page.getByTestId('ship-card')).toHaveCount(1);
});

test('dev save validates, refuses a bad ship and writes a good one', async ({ request }) => {
  const bad = await request.post('/__shipyard/save', { data: { schema: 'shipyard.ship.v1', id: '../evil' } });
  expect(bad.status()).toBe(400);

  const id = 'e2e-save-probe';
  const target = resolve('ships', `${id}.ship.json`);
  const now = new Date().toISOString();
  const ship = {
    schema: 'shipyard.ship.v1',
    id,
    name: 'E2E probe',
    class: 'custom',
    kbHash: 'x'.repeat(8),
    crew: [{ id: 'cap', agent: 'design-director', character: { name: 'Cap', body: 'standin', pigment: '#D9A441' }, station: 1, loadout: [] }],
    voyage: [{ kind: 'stage', id: 'plan', label: 'Plan', phase: 'prepare', member: 'cap', activeSkill: null, outputs: ['06-build-plan.md'], stop: 'written' }],
    createdAt: now,
    updatedAt: now,
  };
  try {
    const ok = await request.post('/__shipyard/save', { data: ship });
    expect(ok.status()).toBe(200);
    expect(((await ok.json()) as { path: string }).path).toBe(`shipyard/ships/${id}.ship.json`);
    expect(existsSync(target)).toBe(true);
  } finally {
    rmSync(target, { force: true });
  }
});
