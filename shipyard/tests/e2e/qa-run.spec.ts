import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defaultShip } from '../../src/domain/ship';
import { isStage } from '../../src/domain/schema';
import { initialState, reduce, toPersisted, type StoreState } from '../../src/store/store';
import { loadIndexFromDisk } from '../unit/helpers';

/**
 * T13 author QA harness. Skipped unless QA_RUN is set (a comma list of: shots, focus, states, nowebgl).
 * It writes the screens to plan/qa-screens/qa/ and merges its measurements into
 * plan/qa-screens/qa/results.json, which plan/07-qa.md cites. It asserts nothing about the product:
 * a finding is recorded, not thrown, so one defect never hides the next.
 */
const RUN = (process.env.QA_RUN ?? '').split(',').filter(Boolean);
const DIR = resolve('plan/qa-screens/qa');
const RESULTS = `${DIR}/results.json`;
const STORAGE_KEY = 'convenium.shipyard.v1';
const AT = '2026-11-06T10:00:00.000Z';
const idx = loadIndexFromDisk();
const env = { idx };
const SIZES: [number, number][] = [[1440, 900], [1024, 768], [390, 844], [360, 740]];
const WIDTHS = process.env.QA_WIDTHS?.split(',').map(Number);
/** The required states run one width per invocation (QA_STATE_WIDTH=1440 or 360): reusing one page across both widths stalled the harness (T13). */
const STATE_SIZES: [number, number][] = ([[1440, 900], [360, 740]] as [number, number][]).filter(([w]) => !process.env.QA_STATE_WIDTH || String(w) === process.env.QA_STATE_WIDTH);

function record(key: string, value: unknown) {
  mkdirSync(DIR, { recursive: true });
  const all = existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, 'utf8')) : {};
  all[key] = value;
  writeFileSync(RESULTS, JSON.stringify(all, null, 1));
}

/** Two custom ships through the real reducer: a clean fork, and a fork broken at PF-03 (the stage's own skill unequipped). */
function seedState(): { state: StoreState; clean: string; blocked: string; bare: string } {
  let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Clean fork' }, AT, env);
  const byName = (st: StoreState, n: string) => st.ships.find((x) => x.name === n)!;
  const clean = byName(s, 'Clean fork').id;
  s = reduce(s, { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Blocked fork' }, AT, env);
  const ship = byName(s, 'Blocked fork');
  const st = ship.voyage.filter(isStage).find((x) => x.activeSkill && ship.crew.some((m) => m.id === x.member && m.loadout.some((e) => e.skill === x.activeSkill)))!;
  s = reduce(s, { type: 'loadout/unequip', shipId: ship.id, member: st.member, skill: st.activeSkill! }, AT, env);
  const blocked = ship.id;
  s = reduce(s, { type: 'ship/create', name: 'Blank hull' }, AT, env);
  const bare = byName(s, 'Blank hull').id;
  return { state: s, clean, blocked, bare };
}

async function seed(page: Page, json: string) {
  await page.addInitScript(([key, value]) => {
    if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value);
  }, [STORAGE_KEY, json] as const);
}

type Log = Record<string, string[]>;
function watch(page: Page) {
  const log: Log = {};
  let cur = 'boot';
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') (log[cur] ??= []).push(`${m.type()}: ${m.text().slice(0, 240)}`);
  });
  page.on('pageerror', (e) => (log[cur] ??= []).push(`pageerror: ${e.message.slice(0, 240)}`));
  // A request cut by the harness's own page.reload() is not a product failure.
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText ?? '')) (log[cur] ??= []).push(`requestfailed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`); });
  return { log, at: (n: string) => (cur = n) };
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page: page as never }).analyze();
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
}

async function settle(page: Page, name: string) {
  if (/bridge|board|hangar|armory-custom/.test(name)) {
    await page.locator('canvas').first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    if (/bridge/.test(name)) await page.locator('[data-testid="turntable"][data-ready="true"]').waitFor({ timeout: 60_000 }).catch(() => undefined);
    await page.waitForTimeout(/board/.test(name) ? 4500 : 3000);
  } else await page.waitForTimeout(1200);
}

/** One Tab at a time: is the focused thing outlined, on screen, and not under a sticky bar or sheet (WCAG 2.4.11)? */
async function focusAudit(page: Page, steps: number) {
  const bad: string[] = [];
  let seen = 0;
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(60);
    const r = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body) return null;
      const rect = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      const outlined = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      const cx = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const cy = Math.min(innerHeight - 1, Math.max(0, rect.top + Math.min(rect.height / 2, 20)));
      const top = document.elementFromPoint(cx, cy);
      const covered = !(top && (a.contains(top) || top.contains(a)));
      const offscreen = rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth;
      const name = `${a.tagName.toLowerCase()}${a.getAttribute('data-testid') ? `[${a.getAttribute('data-testid')}]` : ''} "${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 28)}"`;
      return { name, outlined, covered, offscreen, coverer: covered && top ? `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 30)}` : '' };
    });
    if (!r) continue;
    seen++;
    if (!r.outlined) bad.push(`no focus ring: ${r.name}`);
    if (r.offscreen) bad.push(`off screen: ${r.name}`);
    else if (r.covered) bad.push(`covered by ${r.coverer}: ${r.name}`);
  }
  return { stops: seen, problems: bad };
}

test.describe('qa run', () => {
  test.skip(RUN.length === 0, 'set QA_RUN');
  test.setTimeout(900_000);

  for (const [w, h] of SIZES) {
    if (WIDTHS && !WIDTHS.includes(w)) continue;

    test(`shots ${w}`, async ({ page }) => {
      test.skip(!RUN.includes('shots'));
      mkdirSync(DIR, { recursive: true });
      await page.setViewportSize({ width: w, height: h });
      const { state, clean, blocked } = seedState();
      await seed(page, JSON.stringify(toPersisted(state)));
      const { log, at } = watch(page);
      const out: Record<string, { axe: ReturnType<typeof axe> extends Promise<infer T> ? T : never; overflow: number }> = {};
      const only = process.env.QA_ONLY?.split(',');
      const screens: { name: string; hash: string; act?: (p: Page) => Promise<void> }[] = [
        { name: 'hangar', hash: '/' },
        { name: 'board', hash: '/ship/ss-full-run/board' },
        { name: 'bridge-captain', hash: '/ship/ss-full-run/bridge?member=captain' },
        { name: 'bridge-engineer', hash: '/ship/ss-full-run/bridge?member=engineer' },
        { name: 'bridge-custom', hash: `/ship/${clean}/bridge?member=strategist` },
        { name: 'armory-noship', hash: '/armory' },
        { name: 'armory-custom', hash: `/armory?ship=${clean}&member=captain&skill=gsap-core` },
        { name: 'voyage', hash: '/ship/ss-full-run/voyage' },
        { name: 'voyage-picked', hash: '/ship/ss-full-run/voyage?stage=audit' },
        { name: 'preflight-clean', hash: '/ship/ss-full-run/preflight' },
        { name: 'preflight-blocked', hash: `/ship/${blocked}/preflight` },
        { name: 'logbook', hash: '/logbook' },
        { name: 'commission', hash: '/', act: async (p) => { await p.getByTestId('commission').click(); await p.waitForTimeout(600); } },
      ];
      for (const s of screens) {
        if (only && !only.includes(s.name)) continue;
        at(s.name);
        await page.goto(`/#${s.hash}`);
        await page.reload();
        await settle(page, s.name);
        if (s.act) await s.act(page);
        await page.screenshot({ path: `${DIR}/${s.name}-${w}.png` });
        out[s.name] = { axe: await axe(page), overflow: await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) } as never;
      }
      record(`shots-${w}`, { axe: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.axe])), overflow: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.overflow])), console: log });
    });

    test(`focus ${w}`, async ({ page }) => {
      test.skip(!RUN.includes('focus'));
      await page.setViewportSize({ width: w, height: h });
      const { state, clean } = seedState();
      await seed(page, JSON.stringify(toPersisted(state)));
      const res: Record<string, unknown> = {};
      for (const [name, hash] of [
        ['hangar', '/'],
        ['board', '/ship/ss-full-run/board'],
        ['bridge', `/ship/${clean}/bridge?member=strategist`],
        ['armory', `/armory?ship=${clean}&member=captain&skill=gsap-core`],
        ['voyage', `/ship/${clean}/voyage?stage=audit`],
        ['preflight', `/ship/${clean}/preflight`],
        ['logbook', '/logbook'],
      ] as const) {
        if (process.env.QA_ONLY && !process.env.QA_ONLY.split(',').includes(name)) continue;
        await page.goto(`/#${hash}`);
        await page.reload();
        await settle(page, name);
        res[name] = await focusAudit(page, name === 'armory' ? 60 : 45);
      }
      record(`focus-${w}${process.env.QA_ONLY ? '-' + process.env.QA_ONLY : ''}`, res);
    });
  }

  test('states at 1440 and 360', async ({ page }) => {
    test.skip(!RUN.includes('states'));
    // The states are DOM states: run them in the app's 2D mode (?2d) so no step waits on the turntable (T13: six 60 s turntable waits overran 15 min).
    test.setTimeout(30 * 60_000);
    const found: Record<string, string> = {};
    for (const [w, h] of STATE_SIZES) {
      await page.setViewportSize({ width: w, height: h });
      const shot = (n: string) => page.screenshot({ path: `${DIR}/state-${n}-${w}.png`, timeout: 15_000 });

      // empty: a blank ship, and a member who wears nothing
      const { state, clean, bare } = seedState();
      let s2 = state;
      const ship = s2.ships.find((x) => x.id === clean)!;
      const member = ship.crew[1];
      for (const e of [...member.loadout]) s2 = reduce(s2, { type: 'loadout/unequip', shipId: clean, member: member.id, skill: e.skill }, AT, env);
      // missing skill: an artifact whose skill left the registry (kept until removed)
      const p = toPersisted(s2) as { ships: { id: string; crew: { id: string; loadout: unknown[] }[] }[] };
      // replace the captain's last worn artifact (the captain wears the full 9; a 10th is an impossible save the app rightly refuses, T13)
      const worn = p.ships.find((x) => x.id === clean)!.crew[0].loadout as { skill: string }[];
      worn[worn.length - 1] = { ...worn[worn.length - 1], skill: 'skill-that-left-the-registry' };
      await page.addInitScript(([key, value]) => { if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(p)] as const);
      await page.goto(`/?2d#/ship/${bare}/bridge`);
      await page.reload();
      await page.waitForTimeout(1500);
      await shot('empty-blank-ship');
      found['empty blank ship'] = (await page.getByText(/Add a crew member to begin|no crew|Recruit/i).first().isVisible({ timeout: 5000 }).catch(() => false)) ? 'visible' : 'text not found';
      await page.goto(`/?2d#/ship/${clean}/bridge?member=${member.id}`);
      await page.reload();
      await page.waitForTimeout(1500);
      await shot('empty-member-no-artifacts');
      await page.goto(`/?2d#/ship/${clean}/bridge?member=${ship.crew[0].id}`);
      await page.reload();
      await page.waitForTimeout(1500);
      await shot('retired-artifact');
      found['retired chip'] = String(await page.locator('.retired-chip').count());
      await page.goto(`/?2d#/ship/${clean}/preflight`);
      await page.reload();
      await page.waitForTimeout(1200);
      await shot('export-blocked-retired');
      found['export blocked'] = (await page.getByTestId('export-blocked').textContent({ timeout: 5000 }).catch(() => null)) ?? 'not shown';
      // undo toast: not driven here. The scripted socket click hung this harness past its timeout (T13); the app shows the toast at once by hand, and bridge.spec, motion.spec and voyage.spec assert it.
      found['undo toast'] = 'asserted in bridge.spec.ts, motion.spec.ts and voyage.spec.ts; checked by hand 2026-11-08'
    }

    for (const [w, h] of STATE_SIZES) {
      await page.setViewportSize({ width: w, height: h });
      const shot = (n: string) => page.screenshot({ path: `${DIR}/state-${n}-${w}.png`, timeout: 15_000 });
      // export blocked (PF-03 on the blocked fork)
      const { state, blocked } = seedState();
      const ctx = page.context();
      await ctx.clearCookies();
      await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(toPersisted(state))] as const);
      await page.goto(`/?2d#/ship/${blocked}/preflight`);
      await page.reload();
      await page.waitForTimeout(1500);
      await page.getByTestId('design-path').fill(resolve('..'), { timeout: 5000 }).catch(() => undefined);
      await shot('export-blocked');
      found['export blocked (PF-03)'] = (await page.getByTestId('export-blocked').textContent({ timeout: 5000 }).catch(() => null)) ?? 'not shown';
      // stale KB
      let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Old fork' }, AT, env);
      s = reduce(s, { type: 'ship/replace', ship: { ...s.ships[0], kbHash: 'deadbeefdeadbeef' } }, AT, env);
      await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(toPersisted(s))] as const);
      await page.goto(`/?2d#/ship/${s.ships[0].id}/preflight`);
      await page.reload();
      await page.waitForTimeout(1500);
      await shot('stale-kb');
      found['stale kb'] = (await page.getByTestId('stale-banner').textContent({ timeout: 5000 }).catch(() => null)) ?? 'not shown';
      // import invalid
      await page.goto('/?2d#/logbook');
      await page.waitForTimeout(800);
      await page.getByTestId('import-paste').fill('{"target_project": 3, "phase_counts": "x"}', { timeout: 5000 });
      await page.getByTestId('import-paste-go').click({ timeout: 5000 });
      await page.waitForTimeout(500);
      await shot('import-invalid');
      found['import invalid'] = (await page.getByTestId('import-issues').textContent({ timeout: 5000 }).catch(() => null))?.slice(0, 160) ?? 'not shown';
    }

    // loading KB: hold the knowledge base for 6 s
    for (const [w, h] of STATE_SIZES) {
      const ctx = await page.context().browser()!.newContext({ viewport: { width: w, height: h } });
      const q = await ctx.newPage();
      await q.route('**/data/knowledge-base.json', async (r) => { await new Promise((ok) => setTimeout(ok, 6000)); await r.continue(); });
      await q.goto('/?2d#/');
      await q.waitForTimeout(700);
      await q.screenshot({ path: `${DIR}/state-loading-kb-${w}.png` });
      found[`loading kb ${w}`] = (await q.getByTestId('kb-loading').textContent({ timeout: 5000 }).catch(() => null)) ?? 'not shown';
      // storage unavailable
      const c2 = await page.context().browser()!.newContext({ viewport: { width: w, height: h } });
      const r2 = await c2.newPage();
      await r2.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
      });
      await r2.goto('/?2d#/');
      await r2.waitForTimeout(2500);
      await r2.screenshot({ path: `${DIR}/state-storage-unavailable-${w}.png` });
      found[`storage unavailable ${w}`] = (await r2.getByTestId('persist-banner').textContent({ timeout: 5000 }).catch(() => null)) ?? 'not shown';
      await ctx.close();
      await c2.close();
    }
    record(`states-${process.env.QA_STATE_WIDTH ?? 'all'}`, found);
  });

  test('no WebGL, and a lost context, on every 3D screen', async ({ browser }) => {
    test.skip(!RUN.includes('nowebgl'));
    const res: Record<string, unknown> = {};
    const { state, clean } = seedState();
    const screens: [string, string][] = [
      ['hangar', '/'],
      ['board', '/ship/ss-full-run/board'],
      ['bridge', `/ship/${clean}/bridge?member=captain`],
      ['armory-detail', `/armory?ship=${clean}&member=captain&skill=gsap-core`],
    ];
    for (const mode of ['none', 'lost'] as const) {
      for (const [w, h] of STATE_SIZES) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const page = await ctx.newPage();
        const { log, at } = watch(page);
        await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(toPersisted(state))] as const);
        if (mode === 'none') {
          await page.addInitScript(() => {
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
              if (/webgl/i.test(type)) return null;
              return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as never;
            } as typeof original;
          });
        }
        for (const [name, hash] of screens) {
          at(`${mode}-${name}`);
          await page.goto(`/#${hash}`);
          await page.reload();
          await page.waitForTimeout(3500);
          if (mode === 'lost') {
            await page.evaluate(() => {
              for (const c of document.querySelectorAll('canvas')) {
                const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
                gl?.getExtension('WEBGL_lose_context')?.loseContext();
              }
            });
            await page.waitForTimeout(2000);
          }
          const facts = await page.evaluate(() => ({
            canvases: document.querySelectorAll('canvas').length,
            main: !!document.querySelector('main')?.textContent?.trim(),
            anchors: document.querySelectorAll('[data-testid="anchor-diagram"] .socket').length,
            bodyText: (document.body.innerText || '').length,
          }));
          await page.screenshot({ path: `${DIR}/webgl-${mode}-${name}-${w}.png` });
          res[`${mode}-${name}-${w}`] = facts;
        }
        res[`console-${mode}-${w}`] = log;
        await ctx.close();
      }
    }
    record('nowebgl', res);
  });
});
