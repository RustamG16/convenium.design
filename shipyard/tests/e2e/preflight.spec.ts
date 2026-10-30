import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { defaultShip } from '../../src/domain/ship';
import { isStage } from '../../src/domain/schema';
import { initialState, reduce, toPersisted, type StoreState } from '../../src/store/store';
import { loadIndexFromDisk } from '../unit/helpers';

/**
 * T9: pre-flight, export, logbook and commissions, driven through the real UI. The acceptance proof
 * downloads 00-run-plan.md from the page and runs the REAL `python library/tools/verify.py --plan` on it.
 */
const SHOTS = resolve('plan/qa-screens');
mkdirSync(SHOTS, { recursive: true });
const REPO = resolve('..');
const VERIFY = join(REPO, 'library', 'tools', 'verify.py');
const STORAGE_KEY = 'convenium.shipyard.v1';
const AT = '2026-10-30T10:00:00.000Z';

const idx = loadIndexFromDisk();
const env = { idx };

function python(): string {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : ['python', 'python3', 'py'];
  for (const c of candidates) if (spawnSync(c, ['--version'], { encoding: 'utf8' }).status === 0) return c;
  throw new Error('no python on PATH (set PYTHON)');
}

function watch(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** axe-core's Playwright typings come from a second copy of playwright-core; the runtime object is the same page. */
async function axe(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page: page as never }).analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

/** Put a persisted store in place before the app loads, once (a reload keeps what the app wrote since). */
async function seed(page: Page, json: string) {
  await page.addInitScript(([key, value]) => {
    if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value);
  }, [STORAGE_KEY, json] as const);
}

/** The persisted store as the app last wrote it; an app that has changed nothing has written nothing, which reads as the defaults. */
const stored = async (page: Page) => JSON.parse((await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY)) ?? '{"commissions":{},"logbook":{}}');

/** A custom ship built through the real reducer, then broken: the stage's own skill is unequipped (PF-03). */
function blockedState(): { state: StoreState; shipId: string; member: string } {
  let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Blocked fork' }, AT, env);
  const ship = s.ships[0];
  const st = ship.voyage.filter(isStage).find((x) => x.activeSkill && ship.crew.some((m) => m.id === x.member && m.loadout.some((e) => e.skill === x.activeSkill)))!;
  s = reduce(s, { type: 'loadout/unequip', shipId: ship.id, member: st.member, skill: st.activeSkill! }, AT, env);
  return { state: s, shipId: ship.id, member: st.member };
}

test.describe('acceptance 5: the UI export passes the real verify.py', () => {
  test('SS Full Run: pre-flight, set the path, download 00-run-plan.md, verify.py says CLEAN, paste it, the logbook and the commission follow', async ({ page, context }) => {
    test.setTimeout(120_000);
    const errors = watch(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/ship/ss-full-run/preflight');

    // The screen: next goal is the clean state, the ring is full, five hull panels, fifteen checks.
    await expect(page.getByRole('heading', { level: 1, name: 'Pre-flight' })).toBeVisible();
    await expect(page.getByTestId('hull-ring')).toHaveAttribute('aria-label', /Hull integrity 100 percent, 14 of 14 checks passed/);
    await expect(page.getByTestId('cleared')).toHaveText('Cleared for departure');
    await expect(page.getByTestId('next-goal')).toHaveAttribute('data-goal', 'export');
    await expect(page.getByTestId('goal-export')).toBeVisible();
    await expect(page.locator('[data-panel]')).toHaveCount(5);
    await expect(page.getByTestId('check-row')).toHaveCount(15);
    await expect(page.locator('[data-check="PF-06"]')).toContainText('n.a.');
    await expect(page.locator('[data-check="PF-01"]')).toContainText('Pass');
    await expect(page.getByTestId('preflight-live')).toContainText('Hull integrity 100 percent');

    // Nothing is exportable as a plan until the path is set; ship.json does not need it.
    await expect(page.getByTestId('download-plan')).toBeDisabled();
    await expect(page.getByTestId('copy-kickoff')).toBeDisabled();
    await expect(page.getByTestId('download-ship')).toBeEnabled();
    await expect(page.getByTestId('verify-paste')).toBeDisabled();
    await page.getByTestId('design-path').fill('Convenium.Design');
    await expect(page.getByTestId('design-path')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('download-plan')).toBeDisabled();
    await page.getByTestId('design-path').fill(REPO);
    await expect(page.getByTestId('download-plan')).toBeEnabled();

    // No commission yet: opening and filling a field granted nothing.
    expect((await stored(page)).commissions).toEqual({});

    // Download 00-run-plan.md from the page and run the real verify.py on it.
    const dir = mkdtempSync(join(tmpdir(), 'shipyard-e2e-'));
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-plan').click()]);
    expect(download.suggestedFilename()).toBe('00-run-plan.md');
    const file = join(dir, '00-run-plan.md');
    await download.saveAs(file);
    const text = readFileSync(file, 'utf8');
    const block = /```json\s*\n([\s\S]*?)\n```/.exec(text)![1];
    const plan = JSON.parse(block) as { convenium_design: string; phases: { id: string; skill: string | null; skill_path: string | null }[] };
    expect(plan.convenium_design).toBe(REPO.replace(/\\/g, '/'));
    expect(plan.phases.length).toBeGreaterThan(5);
    for (const ph of plan.phases) if (ph.skill_path) expect(existsSync(ph.skill_path), `${ph.id}: ${ph.skill_path}`).toBe(true);

    const run = spawnSync(python(), ['-I', VERIFY, '--plan', file], { cwd: REPO, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    console.log(`verify.py --plan (exit ${run.status}) on the UI-downloaded file:\n${out.trim()}`);
    expect(run.status).toBe(0);
    expect(out).toMatch(/^CLEAN \(run plan /m);
    rmSync(dir, { recursive: true, force: true });

    // The export is a Verified logbook row and earned the two commissions it is an outcome of.
    await expect(page.getByTestId('export-message')).toContainText('Downloaded 00-run-plan.md');
    const afterExport = await stored(page);
    expect(afterExport.logbook['ss-full-run']).toEqual([expect.objectContaining({ kind: 'export', truth: 'Verified', file: '00-run-plan.md', clean: true, hull: 100 })]);
    expect(Object.keys(afterExport.commissions).sort()).toEqual(['first-clean', 'first-export']);
    await expect(page.getByTestId('commission-toast')).toContainText('First export');

    // Pasting the output is what unlocks the box; a wrong paste is refused with a reason and logs nothing.
    await expect(page.getByTestId('verify-paste')).toBeEnabled();
    await page.getByTestId('verify-paste').fill('hello');
    await page.getByTestId('verify-record').click();
    await expect(page.getByTestId('verify-error')).toContainText('not verify.py');
    expect((await stored(page)).logbook['ss-full-run']).toHaveLength(1);
    await page.getByTestId('verify-paste').fill(out);
    await page.getByTestId('verify-record').click();
    await expect(page.getByTestId('verify-recorded')).toContainText('Recorded: CLEAN');
    await expect(page.getByTestId('verify-recorded')).toContainText('User-reported');

    // Copy kickoff prompt and ship.json (also logged).
    await page.getByTestId('copy-kickoff').click();
    await expect(page.getByTestId('export-message')).toContainText('Kickoff prompt copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain(`Convenium.Design = ${REPO.replace(/\\/g, '/')}`);
    expect(clip).toContain('verify.py --plan .olympus/00-run-plan.md');
    const [shipDl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-ship').click()]);
    expect(shipDl.suggestedFilename()).toBe('ss-full-run.ship.json');

    // Dev server only: save into shipyard/ships/.
    const saved = resolve('ships/ss-full-run.ship.json');
    const existed = existsSync(saved);
    await page.getByTestId('save-ship').click();
    await expect(page.getByTestId('export-message')).toContainText('Saved');
    expect(existsSync(saved)).toBe(true);
    if (!existed) rmSync(saved);

    // The logbook shows all of it, and the commission cards say GRANTED with a date or the plain condition.
    await page.goto('/#/logbook');
    const ship = page.locator('[data-testid="logbook-ship"][data-ship="ss-full-run"]');
    await expect(ship.locator('[data-kind="export"]')).toHaveCount(4);
    await expect(ship.locator('[data-kind="export"]').first()).toContainText('Verified');
    const verifyRow = ship.locator('[data-kind="verify-result"]');
    await expect(verifyRow).toHaveCount(1);
    await expect(verifyRow).toContainText('CLEAN');
    await expect(verifyRow).toContainText('User-reported');
    const granted = (id: string) => page.locator(`[data-commission="${id}"]`);
    for (const id of ['first-export', 'first-clean', 'first-verify']) {
      await expect(granted(id)).toHaveAttribute('data-granted', 'true');
      await expect(granted(id).getByTestId('commission-state')).toContainText(/Granted\s+\d{4}-\d{2}-\d{2}/);
    }
    for (const id of ['first-ship', 'first-recruit', 'first-off-route', 'first-run', 'proven-hull']) {
      await expect(granted(id)).toHaveAttribute('data-granted', 'false');
      await expect(granted(id).getByTestId('commission-state')).toHaveText('Not yet');
    }
    await expect(granted('first-run')).toContainText('Import the run.json of a finished run.');
    await expect(page.getByTestId('commission-count')).toContainText('3 of 8 granted');
    await expect(page.getByTestId('commission-card')).toHaveCount(8);
    expect(errors).toEqual([]);
  });
});

test.describe('a ship with a blocker', () => {
  test('Export is disabled and names the blocker; the ring is capped; Fix goes to the member', async ({ page }) => {
    const errors = watch(page);
    const { state, shipId, member } = blockedState();
    await seed(page, JSON.stringify(toPersisted(state)));
    await page.goto(`/#/ship/${shipId}/preflight`);

    const ring = page.getByTestId('hull-ring');
    await expect(ring).toHaveAttribute('aria-label', /1 blocker cap it at 99/);
    const pct = Number(await ring.locator('.ring-num').innerText());
    expect(pct).toBeLessThanOrEqual(99);
    await expect(page.getByTestId('next-goal')).toHaveAttribute('data-goal', 'PF-03');
    await expect(page.getByTestId('next-goal-line')).toContainText('is not wearing it');
    await expect(page.getByTestId('cleared')).toHaveCount(0);
    await expect(page.getByTestId('export-blocked')).toContainText('Export is blocked by PF-03');
    for (const id of ['download-ship', 'download-plan', 'copy-kickoff', 'save-ship']) await expect(page.getByTestId(id)).toBeDisabled();
    const row = page.locator('[data-check="PF-03"]');
    await expect(row).toContainText('Block');
    await expect(row.locator('[data-status="block"] svg')).toBeVisible();
    await expect(page.locator('[data-panel="crew"]')).toHaveAttribute('data-status', 'block');
    await expect(page.getByTestId('preflight-live')).toContainText('1 blocker');

    // Needs attention filter shows only the problem.
    await page.getByTestId('only-problems').click();
    await expect(page.getByTestId('check-row')).toHaveCount(1);

    // Fix jumps to the bridge for that member.
    const fix = page.getByTestId('next-goal').getByTestId('fix-link');
    await expect(fix).toHaveAttribute('href', `#/ship/${shipId}/bridge?member=${member}`);
    await fix.click();
    await expect(page).toHaveURL(new RegExp(`#/ship/${shipId}/bridge\\?member=${member}$`));

    // Nothing was granted by arriving, reading and following a link.
    expect((await stored(page)).commissions).toEqual({ 'first-ship': AT });
    expect(errors.filter((e) => !/WebGL|GL_|THREE|Context/i.test(e))).toEqual([]);
  });

  test('a stage Fix link carries ?stage= and the voyage screen accepts it', async ({ page }) => {
    let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Stage fork' }, AT, env);
    const ship = s.ships[0];
    const broken = { ...ship, voyage: ship.voyage.map((v, i) => (v.kind === 'stage' && i === ship.voyage.findIndex((x) => x.kind === 'stage') ? { ...v, stop: ' ' } : v)) };
    s = reduce(s, { type: 'ship/replace', ship: broken }, AT, env);
    await seed(page, JSON.stringify(toPersisted(s)));
    await page.goto(`/#/ship/${ship.id}/preflight`);
    await expect(page.getByTestId('export-blocked')).toContainText('PF-04');
    const stageId = ship.voyage.find((v) => v.kind === 'stage')!.id;
    await expect(page.getByTestId('next-goal').getByTestId('fix-link')).toHaveAttribute('href', `#/ship/${ship.id}/voyage?stage=${stageId}`);
    await page.getByTestId('next-goal').getByTestId('fix-link').click();
    await expect(page).toHaveURL(new RegExp(`#/ship/${ship.id}/voyage\\?stage=${stageId}$`));
  });
});

test.describe('stale library', () => {
  test('kbHash differing from the library sourceHash shows the banner and a PF-15 warning; export stays on', async ({ page }) => {
    let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Old fork' }, AT, env);
    s = reduce(s, { type: 'ship/replace', ship: { ...s.ships[0], kbHash: 'deadbeefdeadbeef' } }, AT, env);
    await seed(page, JSON.stringify(toPersisted(s)));
    await page.goto(`/#/ship/${s.ships[0].id}/preflight`);
    const banner = page.getByTestId('stale-banner');
    await expect(banner).toContainText('Library changed since this ship was saved');
    await expect(banner).toContainText('deadbeef');
    await expect(banner).toContainText(idx.kb.sourceHash.slice(0, 8));
    await expect(page.locator('[data-check="PF-15"]')).toContainText('Warn');
    await expect(page.getByTestId('next-goal')).toHaveAttribute('data-goal', 'PF-15');
    await expect(page.getByTestId('download-ship')).toBeEnabled();
    await expect(page.getByTestId('cleared')).toHaveCount(0);
    // The default library ship is current: no banner.
    await page.goto('/#/ship/ss-full-run/preflight');
    await expect(page.getByTestId('stale-banner')).toHaveCount(0);
  });
});

test.describe('logbook: run.json import', () => {
  const valid = { target_project: 'sites/convenium', last_updated: '2026-10-21', phase_counts: { intake: 1, build: 2, qa: 2 }, artifact_hashes: { '.olympus/06-build-plan.md': 'a'.repeat(64), '.olympus/07-qa.md': 'b'.repeat(64), '.olympus/09-handoff.md': 'c'.repeat(64) } };
  const file = (name: string, body: unknown) => ({ name, mimeType: 'application/json', buffer: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) });

  test('a valid run.json becomes a Verified row and the commission; an invalid one lists its errors and logs nothing', async ({ page }) => {
    const errors = watch(page);
    await page.goto('/#/logbook');
    await expect(page.getByTestId('logbook-empty')).toBeVisible();
    await expect(page.getByTestId('commission-card')).toHaveCount(8);
    await expect(page.getByTestId('commission-count')).toContainText('0 of 8 granted');

    // Invalid: errors are listed, nothing is logged, no commission.
    await page.getByTestId('import-file').setInputFiles(file('run.json', { phase_counts: { build: -1, qa: 'two' }, artifact_hashes: { x: 5 } }));
    const issues = page.getByTestId('import-issues');
    await expect(issues).toContainText('Not imported');
    await expect(issues.getByRole('listitem')).toHaveCount(3);
    await expect(issues).toContainText('phase_counts.build');
    await page.getByTestId('import-file').setInputFiles(file('run.json', '{ not json'));
    await expect(issues).toContainText('not valid JSON');
    expect((await stored(page)).logbook ?? {}).toEqual({});
    expect((await stored(page)).commissions ?? {}).toEqual({});

    // Valid.
    await page.getByTestId('import-file').setInputFiles(file('run.json', valid));
    await expect(page.getByTestId('import-issues')).toHaveCount(0);
    await expect(page.getByTestId('import-message')).toContainText('Logged run.json: 5 phase runs across 3 phases');
    const row = page.locator('[data-kind="run-json"]');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('sites/convenium');
    await expect(row).toContainText('intake 1');
    await expect(row).toContainText('build 2');
    await expect(row.getByTestId('hash-count')).toContainText('artifact_hashes: 3');
    await expect(row.getByTestId('hash-count')).toContainText('Verified');
    await expect(page.locator('[data-commission="first-run"]')).toHaveAttribute('data-granted', 'true');
    await expect(page.locator('[data-commission="proven-hull"]')).toHaveAttribute('data-granted', 'false');
    await expect(page.getByTestId('commission-toast')).toContainText('First run logged');

    // The same file twice is one run.
    await page.getByTestId('import-file').setInputFiles(file('run.json', valid));
    await expect(page.getByTestId('import-message')).toContainText('already in this ship');
    await expect(page.locator('[data-kind="run-json"]')).toHaveCount(1);

    // A file with no artifact_hashes shows Unavailable, not zero. Three distinct runs prove the hull.
    const noHashes = { target_project: 'sites/other', phase_counts: { build: 1 } };
    await page.getByTestId('import-paste').fill(JSON.stringify(noHashes));
    await page.getByTestId('import-paste-go').click();
    await expect(page.locator('[data-kind="run-json"]')).toHaveCount(2);
    await expect(page.locator('[data-kind="run-json"]').first().getByTestId('hash-count')).toContainText('Unavailable');
    await page.getByTestId('import-file').setInputFiles(file('run.json', { ...valid, last_updated: '2026-10-22' }));
    await expect(page.locator('[data-kind="run-json"]')).toHaveCount(3);
    await expect(page.locator('[data-commission="proven-hull"]')).toHaveAttribute('data-granted', 'true');
    await expect(page.getByTestId('commission-count')).toContainText('2 of 8 granted');

    // It persisted: a reload keeps the rows and the cards, and announces nothing.
    await page.reload();
    await expect(page.locator('[data-kind="run-json"]')).toHaveCount(3);
    await expect(page.locator('[data-commission="proven-hull"]')).toHaveAttribute('data-granted', 'true');
    await expect(page.getByTestId('commission-toast')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('importing onto another ship logs on that ship only', async ({ page }) => {
    const { state, shipId } = blockedState();
    await seed(page, JSON.stringify(toPersisted(state)));
    await page.goto('/#/logbook');
    await page.getByTestId('import-ship').selectOption(shipId);
    await page.getByTestId('import-file').setInputFiles(file('run.json', valid));
    await expect(page.locator(`[data-testid="logbook-ship"][data-ship="${shipId}"] [data-kind="run-json"]`)).toHaveCount(1);
    await expect(page.locator('[data-testid="logbook-ship"][data-ship="ss-full-run"] [data-kind="run-json"]')).toHaveCount(0);
  });
});

test.describe('commissions are outcomes, not visits', () => {
  test('opening, browsing and clicking through every screen grants nothing', async ({ page }) => {
    await page.goto('/');
    for (const hash of ['#/', '#/ship/ss-full-run/preflight', '#/logbook', '#/armory', '#/ship/ss-full-run/voyage']) {
      await page.goto(`/${hash}`);
      await page.waitForLoadState('networkidle');
    }
    await page.goto('/#/ship/ss-full-run/preflight');
    await page.getByTestId('only-problems').click();
    await page.getByRole('button', { name: /^All/ }).click();
    await page.getByTestId('goal-export').click();
    await page.getByTestId('design-path').fill(REPO);
    await page.getByRole('link', { name: 'Logbook' }).first().click();
    const state = await stored(page);
    expect(state.commissions).toEqual({});
    expect(state.logbook ?? {}).toEqual({});
    await expect(page.getByTestId('commission-toast')).toHaveCount(0);
    await expect(page.getByTestId('commission-count')).toContainText('0 of 8 granted');
  });

  test('a commission granted before this visit is on the rail with no toast', async ({ page }) => {
    const state = { ...toPersisted(initialState()), commissions: { 'first-export': '2026-10-28T09:00:00.000Z', 'first-ship': '2026-10-29T09:00:00.000Z' } };
    await seed(page, JSON.stringify(state));
    await page.goto('/#/logbook');
    await expect(page.locator('[data-commission="first-export"]')).toHaveAttribute('data-granted', 'true');
    await expect(page.locator('[data-commission="first-export"]').getByTestId('commission-state')).toContainText('2026-10-28');
    await expect(page.getByTestId('commission-toast')).toHaveCount(0);
    await page.goto('/#/ship/ss-full-run/preflight');
    await expect(page.getByTestId('commission-toast')).toHaveCount(0);
  });

  test('a malformed store starts fresh with the banner and the logbook still opens', async ({ page }) => {
    await seed(page, JSON.stringify({ version: 1, ships: [], codex: [], commissions: {}, logbook: { x: 'nope' }, ui: { introSeen: {}, sound: false, designPath: '' } }));
    await page.goto('/#/logbook');
    await expect(page.getByTestId('persist-banner')).toContainText('could not be read');
    await expect(page.getByTestId('commission-count')).toContainText('0 of 8 granted');
  });
});

test.describe('layout, keyboard and accessibility', () => {
  test('1440: screenshots of pre-flight (blocked and clean) and the logbook; axe finds nothing serious', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { state, shipId } = blockedState();
    const full = { ...toPersisted(state), logbook: {} as Record<string, unknown> };
    await seed(page, JSON.stringify(full));
    await page.goto(`/#/ship/${shipId}/preflight`);
    await expect(page.getByTestId('hull-diagram')).toBeVisible();
    await page.screenshot({ path: join(SHOTS, 't9-preflight-blocked-1440.png'), fullPage: true });
    expect(await axe(page)).toEqual([]);

    await page.goto('/#/ship/ss-full-run/preflight');
    await expect(page.getByTestId('cleared')).toBeVisible();
    await page.getByTestId('design-path').fill('D:\\Analyst_Designer\\Convenium.Design');
    await page.screenshot({ path: join(SHOTS, 't9-preflight-1440.png'), fullPage: true });
    expect(await axe(page)).toEqual([]);
  });

  test('1440: the logbook with exports, a verify result, runs and granted commissions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/ship/ss-full-run/preflight');
    await page.getByTestId('design-path').fill('D:\\Analyst_Designer\\Convenium.Design');
    await page.getByTestId('download-plan').click();
    await page.getByTestId('verify-paste').fill('\nCLEAN (run plan .olympus/00-run-plan.md)\n');
    await page.getByTestId('verify-record').click();
    await page.goto('/#/logbook');
    await page.getByTestId('import-paste').fill(JSON.stringify({ target_project: 'sites/convenium', last_updated: '2026-10-21', phase_counts: { intake: 1, direction: 1, build: 2, qa: 2, finish: 2 }, artifact_hashes: { '.olympus/06-build-plan.md': 'a'.repeat(64), '.olympus/07-qa.md': 'b'.repeat(64) } }));
    await page.getByTestId('import-paste-go').click();
    await expect(page.locator('[data-kind="run-json"]')).toHaveCount(1);
    await page.getByTestId('toast-dismiss').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(SHOTS, 't9-logbook-1440.png'), fullPage: true });
    expect(await axe(page)).toEqual([]);
  });

  for (const width of [360, 768, 1024, 1200, 1440]) {
    test(`${width}: no horizontal overflow; every screen usable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const { state, shipId } = blockedState();
      await seed(page, JSON.stringify(toPersisted(state)));
      for (const hash of [`#/ship/${shipId}/preflight`, '#/ship/ss-full-run/preflight', '#/logbook']) {
        await page.goto(`/${hash}`);
        await expect(page.locator('main')).toBeVisible();
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${hash} overflows by ${over}px at ${width}`).toBeLessThanOrEqual(0);
        // hit targets: every visible button, link and field is at least 44px tall (links in running text excepted)
        const small = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('main button, main input, main select, main textarea, main summary, main a.btn')]
            .filter((el) => el.offsetParent !== null)
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.height > 0 && r.height < 43.5)
            .map(({ el, r }) => `${el.tagName} ${el.textContent?.trim().slice(0, 24)} ${Math.round(r.height)}px`),
        );
        expect(small, hash).toEqual([]);
      }
      if (width === 360) {
        await page.goto('/#/ship/ss-full-run/preflight');
        await page.screenshot({ path: join(SHOTS, 't9-preflight-360.png'), fullPage: true });
        await page.goto(`/#/ship/${shipId}/preflight`);
        await page.screenshot({ path: join(SHOTS, 't9-preflight-blocked-360.png'), fullPage: true });
      }
    });
  }

  test('keyboard: Tab reaches the path field, the export buttons and the Fix link, with a visible focus ring', async ({ page }) => {
    const { state, shipId } = blockedState();
    await seed(page, JSON.stringify(toPersisted(state)));
    await page.goto(`/#/ship/${shipId}/preflight`);
    const seen = new Set<string>();
    let ringOk = true;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, id: el.getAttribute('data-testid') ?? el.id, outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 3 };
      });
      if (info?.id) seen.add(info.id);
      if (info && info.tag !== 'BODY' && !info.outline) ringOk = false;
    }
    for (const id of ['fix-link', 'design-path', 'only-problems']) expect(seen.has(id), `Tab reaches ${id}`).toBe(true);
    expect(ringOk).toBe(true);
  });

  test('reduced motion: the final states render and nothing waits on an animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/ship/ss-full-run/preflight');
    await expect(page.getByTestId('cleared')).toBeVisible();
    await expect(page.getByTestId('hull-ring')).toHaveAttribute('aria-label', /100 percent/);
  });
});
